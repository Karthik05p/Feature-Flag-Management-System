from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.evaluation import (
    FlagEvaluationResponse,
    EvaluationContext
)
from app.services.evaluation_service import evaluate_flag


router = APIRouter(
    prefix="/evaluate",
    tags=["Evaluation"]
)


# Existing GET endpoint
@router.get(
    "/{environment_name}/{flag_key}",
    response_model=FlagEvaluationResponse
)
def evaluate_flag_get(
    environment_name: str,
    flag_key: str,
    db: Session = Depends(get_db)
):
    flag = evaluate_flag(
        db,
        environment_name,
        flag_key
    )

    if flag is None:
        raise HTTPException(
            status_code=404,
            detail="Flag not found"
        )

    return FlagEvaluationResponse(
        key=flag.key,
       enabled=getattr(flag, "_effective_enabled", flag.enabled),
        value=flag.default_value
    )


# New POST endpoint with targeting context
@router.post(
    "/{environment_name}/{flag_key}",
    response_model=FlagEvaluationResponse
)
def evaluate_flag_post(
    environment_name: str,
    flag_key: str,
    context: EvaluationContext,
    db: Session = Depends(get_db)
):
    flag = evaluate_flag(
        db,
        environment_name,
        flag_key,
        context.model_dump(exclude_none=True)
    )

    if flag is None:
        raise HTTPException(
            status_code=404,
            detail="Flag not found"
        )

    return FlagEvaluationResponse(
        key=flag.key,
        enabled=getattr(flag, "_effective_enabled", flag.enabled),
        value=flag.default_value
    )
