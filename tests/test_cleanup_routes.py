from datetime import datetime, timedelta, timezone

from app.api.cleanup_routes import get_cleanup_candidates
from app.core.security import AuthenticatedUser
from app.models.audit_log import AuditLog
from app.models.evaluation_count import EvaluationCount
from app.models.environment import Environment
from app.models.flag import Flag
from app.models.flag_version import FlagVersion
from app.models.targeting_rule import TargetingRule
from test_auth import auth_header, client
from app.services.auth_service import create_access_token


def actor():
    return AuthenticatedUser(user_id=1, username="cleanup-admin")


def test_empty_database_returns_empty_result(db_session):
    db_session.query(Flag).delete()
    db_session.commit()
    result = get_cleanup_candidates(db_session, actor())
    assert result.total == 0
    assert result.items == []


def test_stale_disabled_flag_uses_disable_transition_and_reports_metadata(db_session):
    flag = db_session.query(Flag).filter_by(key="payment_v2").one()
    old = datetime.now(timezone.utc) - timedelta(days=90)
    flag.created_at = old
    flag.updated_at = old
    db_session.add(AuditLog(flag_id=flag.id, environment_id=flag.environment_id, actor="admin", action="DISABLE", created_at=old + timedelta(days=1)))
    db_session.commit()

    result = get_cleanup_candidates(db_session, actor(), stale_after_days=30)
    candidate = next(item for item in result.items if item.flag_id == flag.id)
    assert candidate.disabled_since == old + timedelta(days=1)
    assert "disabled" in candidate.reasons
    assert "no_recent_persisted_evaluations" in candidate.reasons
    assert "has_audit_history" in candidate.deletion_warnings


def test_disabled_flag_without_transition_falls_back_to_updated_at(db_session):
    flag = db_session.query(Flag).filter_by(key="payment_v2").one()
    old = datetime.now(timezone.utc) - timedelta(days=40)
    flag.created_at = old
    flag.updated_at = old
    db_session.add(AuditLog(flag_id=flag.id, environment_id=flag.environment_id, actor="admin", action="UPDATE", created_at=old + timedelta(days=1)))
    db_session.commit()

    result = get_cleanup_candidates(db_session, actor(), stale_after_days=30)
    candidate = next(item for item in result.items if item.flag_id == flag.id)
    assert candidate.disabled_since == old
    assert "disabled" in candidate.reasons


def test_recently_updated_enabled_flag_is_excluded_by_default(db_session):
    flag = db_session.query(Flag).filter_by(key="dark_mode").one()
    flag.updated_at = datetime.now(timezone.utc) - timedelta(days=60)
    db_session.commit()
    result = get_cleanup_candidates(db_session, actor(), stale_after_days=30)
    assert all(item.flag_id != flag.id for item in result.items)


def test_fully_rolled_out_flag_is_reported_and_targeting_counts_are_batch_derived(db_session):
    flag = db_session.query(Flag).filter_by(key="dark_mode").one()
    old = datetime.now(timezone.utc) - timedelta(days=45)
    flag.updated_at = old
    db_session.add_all([
        TargetingRule(flag_id=flag.id, priority=1, rule_type="percentage", percentage=100, enabled=True, is_active=True),
        TargetingRule(flag_id=flag.id, priority=2, rule_type="user", operator="equals", value="u", enabled=False, is_active=False),
        FlagVersion(flag_id=flag.id, version=1, enabled=True, config={}),
        AuditLog(flag_id=flag.id, environment_id=flag.environment_id, actor="admin", action="UPDATE", created_at=old),
    ])
    db_session.commit()

    result = get_cleanup_candidates(db_session, actor(), stale_after_days=30)
    candidate = next(item for item in result.items if item.flag_id == flag.id)
    assert "fully_rolled_out" in candidate.reasons
    assert candidate.targeting_rule_count == 2
    assert candidate.active_targeting_rule_count == 1
    assert candidate.percentage_rule_count == 1
    assert candidate.inactive_targeting_rule_count == 1
    assert candidate.version_count == 1
    assert {"has_targeting_rules", "has_version_history", "has_audit_history"}.issubset(candidate.deletion_warnings)


def test_recent_evaluation_and_missing_telemetry_are_distinguished(db_session):
    disabled = db_session.query(Flag).filter_by(key="payment_v2").one()
    disabled.updated_at = datetime.now(timezone.utc) - timedelta(days=60)
    active = db_session.query(Flag).filter_by(key="dark_mode").one()
    active.updated_at = datetime.now(timezone.utc) - timedelta(days=60)
    db_session.add(EvaluationCount(flag_id=disabled.id, environment_id=disabled.environment_id, hour_start=datetime.now(timezone.utc) - timedelta(days=2), evaluation_count=10))
    db_session.commit()

    result = get_cleanup_candidates(db_session, actor(), stale_after_days=30, inactive_after_days=7)
    disabled_candidate = next(item for item in result.items if item.flag_id == disabled.id)
    assert disabled_candidate.last_evaluated_at is not None
    assert "no_recent_persisted_evaluations" not in disabled_candidate.reasons
    assert all(item.flag_id != active.id for item in result.items)


def test_candidate_discovery_does_not_mutate_audit_or_evaluation_rows(db_session):
    flag = db_session.query(Flag).filter_by(key="payment_v2").one()
    old = datetime.now(timezone.utc) - timedelta(days=60)
    flag.updated_at = old
    audit = AuditLog(flag_id=flag.id, environment_id=flag.environment_id, actor="admin", action="DISABLE", created_at=old)
    evaluation = EvaluationCount(flag_id=flag.id, environment_id=flag.environment_id, hour_start=old, evaluation_count=4)
    db_session.add_all([audit, evaluation])
    db_session.commit()
    audit_before = db_session.query(AuditLog).count()
    evaluation_before = db_session.query(EvaluationCount).count()

    get_cleanup_candidates(db_session, actor(), stale_after_days=30)

    assert db_session.query(AuditLog).count() == audit_before
    assert db_session.query(EvaluationCount).count() == evaluation_before


def test_same_key_is_scoped_by_environment_and_filter_works(db_session):
    first = db_session.query(Flag).filter_by(key="payment_v2").one()
    second_environment = Environment(name="stale-test", description="test", is_active=True)
    db_session.add(second_environment)
    db_session.flush()
    second = Flag(environment_id=second_environment.id, key=first.key, name="Payment Other", type="boolean", default_value="false", enabled=False, description="", owner_team="team")
    old = datetime.now(timezone.utc) - timedelta(days=60)
    first.updated_at = old
    second.updated_at = old
    db_session.add(second)
    db_session.commit()

    result = get_cleanup_candidates(db_session, actor(), stale_after_days=30, environment_id=second_environment.id)
    assert [item.environment_id for item in result.items] == [second_environment.id]
    assert result.items[0].key == first.key


def test_limit_offset_and_deleted_flags(db_session):
    flags = db_session.query(Flag).all()
    old = datetime.now(timezone.utc) - timedelta(days=60)
    for flag in flags:
        flag.updated_at = old
    deleted_id = flags[0].id
    db_session.delete(flags[0])
    db_session.commit()

    result = get_cleanup_candidates(db_session, actor(), stale_after_days=30, limit=1, offset=1)
    assert result.total == 1
    assert len(result.items) == 0
    assert all(item.flag_id != deleted_id for item in result.items)


def test_invalid_query_parameters_are_rejected_by_fastapi(client):
    headers = auth_header(create_access_token({"sub": "admin", "user_id": 1}))
    assert client("GET", "/api/flags/cleanup-candidates?stale_after_days=-1", headers=headers)["status"] == 422
    assert client("GET", "/api/flags/cleanup-candidates?limit=0", headers=headers)["status"] == 422
    assert client("GET", "/api/flags/cleanup-candidates?offset=-1", headers=headers)["status"] == 422
    assert client("GET", "/api/flags/cleanup-candidates?environment_id=0", headers=headers)["status"] == 422


def test_cleanup_endpoint_requires_authentication(client):
    assert client("GET", "/api/flags/cleanup-candidates")["status"] == 401


def test_cleanup_endpoint_accepts_authenticated_request(client):
    headers = auth_header(create_access_token({"sub": "admin", "user_id": 1}))
    response = client("GET", "/api/flags/cleanup-candidates", headers=headers)
    assert response["status"] == 200
    assert set(response["json"]) == {"items", "total", "limit", "offset"}
