from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    actor: str,
    action: str,
    environment_id: int | None = None,
    flag_id: int | None = None,
    previous_state: str | None = None,
    new_state: str | None = None
) -> AuditLog:

    audit_log = AuditLog(
        actor=actor,
        action=action,
        environment_id=environment_id,
        flag_id=flag_id,
        previous_state=previous_state,
        new_state=new_state
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log


def get_audit_logs(
    db: Session
) -> list[AuditLog]:

    return (
        db.query(AuditLog)
        .order_by(AuditLog.id.desc())
        .all()
    )
