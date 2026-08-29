from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.environment import EnvironmentCreate, EnvironmentResponse
from app.services.environment_service import (
    create_environment,
    get_environments,
    get_environment,
    delete_environment,
)


router = APIRouter(
    prefix="/environments",
    tags=["Environments"]
)


@router.post(
    "",
    response_model=EnvironmentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_environment_api(
    data: EnvironmentCreate,
    db: Session = Depends(get_db)
):
    return create_environment(db, data)


@router.get(
    "",
    response_model=list[EnvironmentResponse]
)
def list_environments(
    db: Session = Depends(get_db)
):
    return get_environments(db)


@router.get(
    "/{environment_id}",
    response_model=EnvironmentResponse
)
def get_environment_api(
    environment_id: int,
    db: Session = Depends(get_db)
):
    environment = get_environment(db, environment_id)

    if environment is None:
        raise HTTPException(
            status_code=404,
            detail="Environment not found"
        )

    return environment


@router.delete(
    "/{environment_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_environment_api(
    environment_id: int,
    db: Session = Depends(get_db)
):
    deleted = delete_environment(db, environment_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Environment not found"
        )

    return None
