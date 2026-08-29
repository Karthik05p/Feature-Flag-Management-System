from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.flag_version import FlagVersionResponse
from app.schemas.flag import FlagResponse
from app.services.flag_version_service import get_flag_versions
from app.services.rollback_service import rollback_flag


router = APIRouter(
    prefix="/flags",
    tags=["Flag Versions"]
)


@router.get(
    "/{flag_id}/versions",
    response_model=list[FlagVersionResponse]
)
def list_flag_versions(
    flag_id: int,
    db: Session = Depends(get_db)
):
    versions = get_flag_versions(db, flag_id)

    if versions is None:
        raise HTTPException(
            status_code=404,
            detail="Flag not found"
        )

    return versions


@router.post(
    "/{flag_id}/rollback/{version_number}",
    response_model=FlagResponse
)
def rollback_flag_api(
    flag_id: int,
    version_number: int,
    db: Session = Depends(get_db)
):
    flag = rollback_flag(
        db,
        flag_id,
        version_number
    )

    if flag is None:
        raise HTTPException(
            status_code=404,
            detail="Flag or version not found"
        )

    return flag
