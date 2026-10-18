from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from app.core.security import AuthenticatedUser, get_current_user
from app.database.session import get_db
from app.models.audit_log import AuditLog
from app.models.evaluation_count import EvaluationCount
from app.models.flag import Flag
from app.models.flag_version import FlagVersion
from app.models.targeting_rule import TargetingRule


class CleanupCandidate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    flag_id: int
    environment_id: int
    environment_name: str
    key: str
    name: str
    enabled: bool
    created_at: datetime
    updated_at: datetime
    disabled_since: datetime | None
    last_evaluated_at: datetime | None
    targeting_rule_count: int
    active_targeting_rule_count: int
    percentage_rule_count: int
    inactive_targeting_rule_count: int
    version_count: int
    audit_log_count: int
    reasons: list[str]
    deletion_warnings: list[str]


class CleanupCandidateResponse(BaseModel):
    items: list[CleanupCandidate]
    total: int
    limit: int
    offset: int


router = APIRouter()


def _utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


@router.get("/flags/cleanup-candidates", response_model=CleanupCandidateResponse)
def get_cleanup_candidates(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
    stale_after_days: Annotated[int, Query(ge=0)] = 30,
    inactive_after_days: Annotated[int | None, Query(ge=0)] = None,
    environment_id: Annotated[int | None, Query(ge=1)] = None,
    include_enabled: Annotated[bool, Query()] = False,
    include_recently_used: Annotated[bool, Query()] = False,
    limit: Annotated[int, Query(ge=1, le=1000)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    """Return advisory cleanup candidates without mutating any project data."""

    now = datetime.now(timezone.utc)
    stale_cutoff = now - timedelta(days=stale_after_days)
    inactivity_days = inactive_after_days if inactive_after_days is not None else stale_after_days
    evaluation_cutoff = now - timedelta(days=inactivity_days)

    flags_query = db.query(Flag).options(joinedload(Flag.environment)).order_by(Flag.id)
    if environment_id is not None:
        flags_query = flags_query.filter(Flag.environment_id == environment_id)
    flags = flags_query.all()
    if not flags:
        return CleanupCandidateResponse(items=[], total=0, limit=limit, offset=offset)

    flag_ids = [flag.id for flag in flags]

    rule_rows = (
        db.query(
            TargetingRule.flag_id,
            func.count(TargetingRule.id).label("total"),
            func.sum(case((TargetingRule.is_active.is_(True), 1), else_=0)).label("active"),
            func.sum(case((TargetingRule.rule_type == "percentage", 1), else_=0)).label("percentage"),
            func.sum(case((TargetingRule.is_active.is_(False), 1), else_=0)).label("inactive"),
        )
        .filter(TargetingRule.flag_id.in_(flag_ids))
        .group_by(TargetingRule.flag_id)
        .all()
    )
    rule_counts = {
        row.flag_id: {
            "total": int(row.total or 0),
            "active": int(row.active or 0),
            "percentage": int(row.percentage or 0),
            "inactive": int(row.inactive or 0),
        }
        for row in rule_rows
    }

    full_rollout_ids = {
        row.flag_id
        for row in db.query(TargetingRule.flag_id)
        .filter(
            TargetingRule.flag_id.in_(flag_ids),
            TargetingRule.rule_type == "percentage",
            TargetingRule.percentage == 100,
            TargetingRule.is_active.is_(True),
        )
        .distinct()
        .all()
    }

    evaluation_rows = (
        db.query(EvaluationCount.flag_id, func.max(EvaluationCount.hour_start).label("last_evaluated_at"))
        .filter(EvaluationCount.flag_id.in_(flag_ids))
        .group_by(EvaluationCount.flag_id)
        .all()
    )
    last_evaluated = {row.flag_id: _utc(row.last_evaluated_at) for row in evaluation_rows}

    version_rows = (
        db.query(FlagVersion.flag_id, func.count(FlagVersion.id).label("count"))
        .filter(FlagVersion.flag_id.in_(flag_ids))
        .group_by(FlagVersion.flag_id)
        .all()
    )
    version_counts = {row.flag_id: int(row.count or 0) for row in version_rows}

    audit_rows = (
        db.query(AuditLog)
        .filter(AuditLog.flag_id.in_(flag_ids))
        .order_by(AuditLog.flag_id, AuditLog.created_at.desc(), AuditLog.id.desc())
        .all()
    )
    audit_by_flag: dict[int, list[AuditLog]] = defaultdict(list)
    for record in audit_rows:
        audit_by_flag[record.flag_id].append(record)

    candidates: list[CleanupCandidate] = []
    for flag in flags:
        updated_at = _utc(flag.updated_at) or _utc(flag.created_at)
        created_at = _utc(flag.created_at)
        if updated_at is None or created_at is None:
            continue

        flag_audits = audit_by_flag.get(flag.id, [])
        transitions = [record for record in flag_audits if record.action in {"ENABLE", "DISABLE"}]
        latest_transition = transitions[0] if transitions else None
        disabled_since = None
        if not flag.enabled:
            disabled_since = _utc(latest_transition.created_at) if latest_transition and latest_transition.action == "DISABLE" else updated_at

        counts = rule_counts.get(flag.id, {"total": 0, "active": 0, "percentage": 0, "inactive": 0})
        fully_rolled_out = flag.id in full_rollout_ids
        configuration_stale = updated_at <= stale_cutoff
        disabled_long_enough = bool(not flag.enabled and disabled_since and disabled_since <= stale_cutoff)
        fully_rolled_out_long_enough = bool(fully_rolled_out and configuration_stale)
        latest_evaluation = last_evaluated.get(flag.id)
        no_recent_persisted_evaluations = latest_evaluation is None or latest_evaluation <= evaluation_cutoff
        recently_used = latest_evaluation is not None and latest_evaluation > evaluation_cutoff

        # Disabled and fully-rolled-out flags are always eligible when their
        # state is old enough. Ordinary enabled stale flags are opt-in.
        eligible = disabled_long_enough or fully_rolled_out_long_enough or (configuration_stale and include_enabled)
        if not eligible:
            continue
        if recently_used and not include_recently_used and not (disabled_long_enough or fully_rolled_out_long_enough):
            continue

        reasons: list[str] = []
        if disabled_long_enough:
            reasons.append("disabled")
        if fully_rolled_out_long_enough:
            reasons.append("fully_rolled_out")
        if configuration_stale:
            reasons.append("configuration_stale")
        if no_recent_persisted_evaluations:
            reasons.append("no_recent_persisted_evaluations")
        if counts["active"] == 0:
            reasons.append("no_active_targeting_rules")

        warnings: list[str] = []
        if counts["total"]:
            warnings.append("has_targeting_rules")
        if version_counts.get(flag.id, 0):
            warnings.append("has_version_history")
        if flag_audits:
            warnings.append("has_audit_history")

        candidates.append(
            CleanupCandidate(
                flag_id=flag.id,
                environment_id=flag.environment_id,
                environment_name=flag.environment.name,
                key=flag.key,
                name=flag.name,
                enabled=flag.enabled,
                created_at=created_at,
                updated_at=updated_at,
                disabled_since=disabled_since,
                last_evaluated_at=latest_evaluation,
                targeting_rule_count=counts["total"],
                active_targeting_rule_count=counts["active"],
                percentage_rule_count=counts["percentage"],
                inactive_targeting_rule_count=counts["inactive"],
                version_count=version_counts.get(flag.id, 0),
                audit_log_count=len(flag_audits),
                reasons=reasons,
                deletion_warnings=warnings,
            )
        )

    total = len(candidates)
    return CleanupCandidateResponse(items=candidates[offset:offset + limit], total=total, limit=limit, offset=offset)
