from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.audit_log_service import get_audit_logs


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


@router.get("")
def list_audit_logs(
    db: Session = Depends(get_db)
):
    return get_audit_logs(db)
