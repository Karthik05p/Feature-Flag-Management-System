import json

from sqlalchemy.orm import Session

from app.models.flag import Flag
from app.models.flag_version import FlagVersion
from app.services.audit_log_service import create_audit_log


def rollback_flag(
    db: Session,
    flag_id: int,
    version_number: int
) -> Flag | None:

    flag = (
        db.query(Flag)
        .filter(Flag.id == flag_id)
        .first()
    )

    if flag is None:
        return None

    target_version = (
        db.query(FlagVersion)
        .filter(
            FlagVersion.flag_id == flag_id,
            FlagVersion.version == version_number
        )
        .first()
    )

    if target_version is None:
        return None

    previous_state = json.dumps({
        "key": flag.key,
        "enabled": flag.enabled,
        "value": flag.default_value
    })

    latest_version = (
        db.query(FlagVersion)
        .filter(FlagVersion.flag_id == flag_id)
        .order_by(FlagVersion.version.desc())
        .first()
    )

    next_version = (
        1 if latest_version is None
        else latest_version.version + 1
    )

    flag.default_value = target_version.value
    flag.enabled = target_version.enabled

    new_version = FlagVersion(
        flag_id=flag.id,
        version=next_version,
        value=target_version.value,
        enabled=target_version.enabled
    )

    db.add(new_version)
    db.commit()
    db.refresh(flag)

    new_state = json.dumps({
        "key": flag.key,
        "enabled": flag.enabled,
        "value": flag.default_value
    })

    create_audit_log(
        db=db,
        actor="system",
        action="ROLLBACK_FLAG",
        environment_id=flag.environment_id,
        flag_id=flag.id,
        previous_state=previous_state,
        new_state=new_state
    )

    return flag
