from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import requests

from app.models.audit_log import AuditLog
from app.models.evaluation_count import EvaluationCount
from app.models.flag import Flag
from app.models.user_group_membership import UserGroupMembership
from app.services.evaluation_analytics import evaluation_bucket_key, evaluation_field, record_evaluation, utc_hour_start
from app.services.evaluation_analytics_flush import flush_completed_buckets
from app.services.evaluation_engine import _build_cache_key
from app.middleware.flag_client import FlagClient
from test_auth import auth_header
from tests.helpers import ASGIRequestsAdapter


def login(client):
    response = client("POST", "/api/auth/login", body={"username": "admin", "password": "admin123"})
    assert response["status"] == 200
    return response["json"]["access_token"]


def create_flag(client, token, *, key, enabled=False, default_value="off"):
    response = client(
        "POST",
        "/api/flags",
        headers=auth_header(token),
        body={
            "environment_id": 1,
            "key": key,
            "name": key.replace("_", " ").title(),
            "type": "string",
            "default_value": default_value,
            "enabled": enabled,
            "description": "E2E flag",
            "owner_team": "platform",
        },
    )
    assert response["status"] == 200
    return response["json"]


def create_rule(client, token, flag_id, **overrides):
    body = {
        "flag_id": flag_id,
        "priority": 1,
        "rule_type": "user",
        "operator": "equals",
        "value": "user-123",
        "percentage": None,
        "enabled": True,
        "is_active": True,
    }
    body.update(overrides)
    response = client("POST", "/api/targeting-rules", headers=auth_header(token), body=body)
    assert response["status"] == 200
    return response["json"]


def evaluate(client, token, key, user_id="user-123", environment="development"):
    response = client(
        "POST",
        "/api/evaluate",
        headers=auth_header(token),
        body={"flag_key": key, "environment_name": environment, "user_context": {"user_id": user_id}},
    )
    assert response["status"] == 200
    return response["json"]


def test_authenticated_configuration_to_evaluation_flow(e2e_client):
    token = login(e2e_client)
    targeted = create_flag(e2e_client, token, key="e2e_targeted")
    create_rule(e2e_client, token, targeted["id"], enabled=True)

    matched = evaluate(e2e_client, token, "e2e_targeted")
    assert matched["enabled"] is True
    assert matched["value"] == "off"
    assert matched["message"] == "Matched User Targeting Rule"

    inactive = create_flag(e2e_client, token, key="e2e_inactive")
    create_rule(e2e_client, token, inactive["id"], enabled=True, is_active=False)
    ignored = evaluate(e2e_client, token, "e2e_inactive")
    assert ignored["enabled"] is False
    assert ignored["message"] == "Default Flag Evaluation"

    percentage = create_flag(e2e_client, token, key="e2e_percentage")
    create_rule(e2e_client, token, percentage["id"], rule_type="percentage", operator=None, value=None, percentage=50)
    first = evaluate(e2e_client, token, "e2e_percentage", user_id="stable-user")
    second = evaluate(e2e_client, token, "e2e_percentage", user_id="stable-user")
    assert first["enabled"] == second["enabled"]
    assert first["message"] in {"Matched Percentage Rollout", "Default Flag Evaluation"}


def test_authenticated_group_targeting_configuration_to_evaluation_flow(
    e2e_client,
    db_session,
):
    token = login(e2e_client)
    assert token
    flag = create_flag(e2e_client, token, key="e2e_group_targeted", enabled=True)

    membership = UserGroupMembership(user_id="group-user", group_name="beta")
    db_session.add(membership)
    db_session.commit()
    assert db_session.query(UserGroupMembership).filter_by(
        user_id="group-user",
        group_name="beta",
    ).one() is not None

    rule = create_rule(
        e2e_client,
        token,
        flag["id"],
        rule_type="group",
        operator="equals",
        value="beta",
        percentage=None,
        enabled=True,
        is_active=True,
    )
    assert rule["rule_type"] == "group"
    assert rule["value"] == "beta"
    assert rule["enabled"] is True
    assert rule["is_active"] is True

    result = evaluate(
        e2e_client,
        token,
        flag["key"],
        user_id="group-user",
        environment="development",
    )
    assert result["success"] is True
    assert result["enabled"] is True
    assert result["value"] == "off"
    assert result["message"] == "Matched Group Targeting Rule"


def test_cache_analytics_flush_and_analytics_api_flow(e2e_client, db_session, fake_redis):
    token = login(e2e_client)
    flag = db_session.query(Flag).filter_by(key="dark_mode").one()
    environment_id = flag.environment_id

    first = evaluate(e2e_client, token, "dark_mode")
    second = evaluate(e2e_client, token, "dark_mode")
    assert second["message"] == "Returned From Redis Cache"

    current_hour = utc_hour_start(datetime.now(timezone.utc))
    current_key = evaluation_bucket_key(current_hour)
    field = evaluation_field(flag.id, environment_id)
    assert fake_redis.hashes[current_key][field] >= 2

    before_invalid = fake_redis.hashes[current_key][field]
    assert e2e_client("POST", "/api/evaluate", headers=auth_header(token), body={"flag_key": "missing", "environment_name": "development"})["status"] == 200
    assert e2e_client("POST", "/api/evaluate", headers=auth_header(token), body={"flag_key": "dark_mode", "environment_name": "missing"})["status"] == 200
    assert fake_redis.hashes[current_key][field] == before_invalid

    completed_hour = current_hour - timedelta(hours=2)
    record_evaluation(fake_redis, flag.id, environment_id, completed_hour)
    record_evaluation(fake_redis, flag.id, environment_id, completed_hour)
    record_evaluation(fake_redis, flag.id, environment_id, current_hour - timedelta(hours=1))
    assert flush_completed_buckets(db_session, fake_redis, current_hour) >= 1
    assert evaluation_bucket_key(completed_hour) not in fake_redis.hashes
    assert current_key in fake_redis.hashes
    assert db_session.query(EvaluationCount).filter_by(flag_id=flag.id, environment_id=environment_id, hour_start=completed_hour).one().evaluation_count == 2

    query = urlencode({"flag_id": flag.id, "environment_id": environment_id, "start": (completed_hour - timedelta(hours=1)).isoformat().replace("+00:00", "Z"), "end": current_hour.isoformat().replace("+00:00", "Z")})
    telemetry = e2e_client("GET", f"/api/analytics/evaluations?{query}", headers=auth_header(token))
    assert telemetry["status"] == 200
    assert any(row["evaluation_count"] == 2 for row in telemetry["json"])


def test_audit_and_cache_invalidation_flow(e2e_client, db_session, fake_redis):
    token = login(e2e_client)
    flag = create_flag(e2e_client, token, key="e2e_mutation", enabled=True, default_value="old")
    evaluate(e2e_client, token, "e2e_mutation", user_id="cache-user")
    evaluate(e2e_client, token, "payment_v2", user_id="cache-user")
    unrelated_key = _build_cache_key("development", "payment_v2", {"user_id": "cache-user"})
    assert unrelated_key in fake_redis.values

    update = e2e_client(
        "PUT",
        f"/api/flags/{flag['id']}",
        headers=auth_header(token),
        body={"key": "e2e_mutation", "type": "string", "default_value": "new", "enabled": False, "description": "changed", "owner_team": "platform"},
    )
    assert update["status"] == 200
    changed = evaluate(e2e_client, token, "e2e_mutation", user_id="cache-user")
    assert changed["enabled"] is False
    assert changed["value"] == "new"
    assert unrelated_key in fake_redis.values

    rule = create_rule(e2e_client, token, flag["id"], enabled=True)
    rule_update = e2e_client(
        "PUT",
        f"/api/targeting-rules/{rule['id']}",
        headers=auth_header(token),
        body={"flag_id": flag["id"], "priority": 1, "rule_type": "user", "operator": "equals", "value": "cache-user", "percentage": None, "enabled": True, "is_active": True},
    )
    assert rule_update["status"] == 200

    audit = e2e_client("GET", "/api/audit-logs", headers=auth_header(token))
    assert audit["status"] == 200
    flag_records = [record for record in audit["json"] if record.get("flag_id") == flag["id"]]
    actions = {record["action"] for record in flag_records}
    assert {"CREATE", "DISABLE", "TARGETING_RULE_CREATE", "TARGETING_RULE_UPDATE"}.issubset(actions)
    assert all(record["actor"] == "admin" and record["environment_id"] == 1 for record in flag_records)
    create_record = next(record for record in flag_records if record["action"] == "CREATE")
    disable_record = next(record for record in flag_records if record["action"] == "DISABLE")
    assert create_record["new_state"]["key"] == "e2e_mutation"
    assert disable_record["old_state"]["enabled"] is True
    assert disable_record["new_state"]["enabled"] is False


def test_flag_client_reaches_real_evaluation_api_and_uses_local_cache(e2e_client, monkeypatch):
    token = login(e2e_client)
    adapter = ASGIRequestsAdapter(e2e_client)
    monkeypatch.setattr(requests, "post", adapter.post)
    client = FlagClient(base_url="http://testserver/api", environment="development", auth_token=token)

    first = client.evaluate("dark_mode", {"user_id": "client-user"})
    second = client.evaluate("dark_mode", {"user_id": "client-user"})
    assert first["success"] is True
    assert second == first
    assert len(adapter.calls) == 1
    assert adapter.calls[0]["kwargs"]["headers"] == {"Authorization": f"Bearer {token}"}
    assert client.is_enabled("dark_mode", {"user_id": "client-user"}) is True
    assert client.get_value("dark_mode", {"user_id": "client-user"}) == "true"


def test_cleanup_candidate_flow_is_advisory_and_environment_scoped(e2e_client, db_session):
    token = login(e2e_client)
    disabled = create_flag(e2e_client, token, key="cleanup_disabled")
    rolled_out = create_flag(e2e_client, token, key="cleanup_rollout", enabled=True)
    create_rule(e2e_client, token, rolled_out["id"], rule_type="percentage", operator=None, value=None, percentage=100)
    old = datetime.now(timezone.utc) - timedelta(days=90)
    for flag_id in (disabled["id"], rolled_out["id"]):
        flag = db_session.get(Flag, flag_id)
        flag.updated_at = old
        if flag_id == disabled["id"]:
            flag.enabled = False
    db_session.commit()
    counts_before = (db_session.query(Flag).count(), db_session.query(AuditLog).count(), db_session.query(EvaluationCount).count())

    response = e2e_client("GET", "/api/flags/cleanup-candidates", headers=auth_header(token))
    assert response["status"] == 200
    candidates = {item["key"]: item for item in response["json"]["items"]}
    assert "disabled" in candidates["cleanup_disabled"]["reasons"]
    assert "fully_rolled_out" in candidates["cleanup_rollout"]["reasons"]
    assert candidates["cleanup_disabled"]["environment_id"] == 1

    counts_after = (db_session.query(Flag).count(), db_session.query(AuditLog).count(), db_session.query(EvaluationCount).count())
    assert counts_after == counts_before
