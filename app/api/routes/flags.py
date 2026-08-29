from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.flag import FlagCreate, FlagResponse, FlagUpdate
from app.services.flag_service import (
    create_flag,
    get_flags,
    get_flag,
    update_flag,
    delete_flag,
)


router = APIRouter(
    prefix="/flags",
    tags=["Feature Flags"]
)


@router.post(
    "",
    response_model=FlagResponse,
    status_code=status.HTTP_201_CREATED
)
def create_flag_api(
    data: FlagCreate,
    db: Session = Depends(get_db)
):
    return create_flag(db, data)


@router.get(
    "",
    response_model=list[FlagResponse]
)
def list_flags(
    db: Session = Depends(get_db)
):
    return get_flags(db)


@router.get(
    "/{flag_id}",
    response_model=FlagResponse
)
def get_flag_api(
    flag_id: int,
    db: Session = Depends(get_db)
):
    flag = get_flag(db, flag_id)

    if flag is None:
        raise HTTPException(
            status_code=404,
            detail="Feature flag not found"
        )

    return flag
@router.put(
    "/{flag_id}",
    response_model=FlagResponse
)
def update_flag_api(
    flag_id: int,
    data: FlagUpdate,
    db: Session = Depends(get_db)
):
    flag = update_flag(db, flag_id, data)

    if flag is None:
        raise HTTPException(
            status_code=404,
            detail="Flag not found"
        )

    return flag

@router.delete(
    "/{flag_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_flag_api(
    flag_id: int,
    db: Session = Depends(get_db)
):
    deleted = delete_flag(db, flag_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Feature flag not found"
        )

    return None
