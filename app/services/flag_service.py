import json

from sqlalchemy.orm import Session
from app.cache.redis_client import redis_client
from app.models.flag import Flag
from app.models.flag_version import FlagVersion
from app.schemas.flag import FlagCreate, FlagUpdate
from app.services.audit_log_service import create_audit_log


def create_flag(
    db: Session,
    flag_data: FlagCreate
) -> Flag:

    flag = Flag(
        environment_id=flag_data.environment_id,
        key=flag_data.key,
        type=flag_data.type,
        default_value=flag_data.default_value,
        enabled=flag_data.enabled,
        rollout_percentage=flag_data.rollout_percentage,
        description=flag_data.description,
        owner_team=flag_data.owner_team
    )

    db.add(flag)
    db.flush()

    version = FlagVersion(
        flag_id=flag.id,
        version=1,
        value=flag.default_value,
        enabled=flag.enabled
    )

    db.add(version)
    db.commit()
    db.refresh(flag)

    new_state = json.dumps({
        "key": flag.key,
        "enabled": flag.enabled,
        "value": flag.default_value,
        "rollout_percentage": flag.rollout_percentage
    })

    create_audit_log(
        db=db,
        actor="system",
        action="CREATE_FLAG",
        environment_id=flag.environment_id,
        flag_id=flag.id,
        previous_state=None,
        new_state=new_state
    )

    return flag


def get_flags(db: Session) -> list[Flag]:
    return db.query(Flag).all()


def get_flag(
    db: Session,
    flag_id: int
) -> Flag | None:

    return (
        db.query(Flag)
        .filter(Flag.id == flag_id)
        .first()
    )


def update_flag(
    db: Session,
    flag_id: int,
    flag_data: FlagUpdate
) -> Flag | None:

    flag = get_flag(db, flag_id)

    if flag is None:
        return None

    previous_state = json.dumps({
        "key": flag.key,
        "enabled": flag.enabled,
        "value": flag.default_value,
        "rollout_percentage": flag.rollout_percentage
    })

    update_data = flag_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(flag, field, value)

    latest_version = (
        db.query(FlagVersion)
        .filter(FlagVersion.flag_id == flag.id)
        .order_by(FlagVersion.version.desc())
        .first()
    )

    next_version = (
        1 if latest_version is None
        else latest_version.version + 1
    )

    version = FlagVersion(
        flag_id=flag.id,
        version=next_version,
        value=flag.default_value,
        enabled=flag.enabled
    )

    db.add(version)
    db.commit()
    redis_client.delete(
    f"flag:{flag.environment_id}:{flag.key}")

    db.refresh(flag)

    new_state = json.dumps({
        "key": flag.key,
        "enabled": flag.enabled,
        "value": flag.default_value,
        "rollout_percentage": flag.rollout_percentage
    })

    create_audit_log(
        db=db,
        actor="system",
        action="UPDATE_FLAG",
        environment_id=flag.environment_id,
        flag_id=flag.id,
        previous_state=previous_state,
        new_state=new_state
    )

    return flag


def delete_flag(
    db: Session,
    flag_id: int
) -> bool:

    flag = get_flag(db, flag_id)

    if flag is None:
        return False

    previous_state = json.dumps({
        "key": flag.key,
        "enabled": flag.enabled,
        "value": flag.default_value,
        "rollout_percentage": flag.rollout_percentage
    })

    environment_id = flag.environment_id

    create_audit_log(
        db=db,
        actor="system",
        action="DELETE_FLAG",
        environment_id=environment_id,
        flag_id=flag.id,
        previous_state=previous_state,
        new_state=None
    )

    db.query(FlagVersion).filter(
        FlagVersion.flag_id == flag.id
    ).delete(synchronize_session=False)

    db.delete(flag)
    redis_client.delete(
    f"flag:{environment_id}:{flag.key}")
    db.commit()

    return True
