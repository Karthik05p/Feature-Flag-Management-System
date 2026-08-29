from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.targeting import (
    TargetingRuleCreate,
    TargetingRuleResponse
)
from app.services.targeting_service import (
    create_targeting_rule,
    get_targeting_rules
)


router = APIRouter(
    prefix="/targeting",
    tags=["Targeting"]
)


@router.post(
    "",
    response_model=TargetingRuleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_rule(
    data: TargetingRuleCreate,
    db: Session = Depends(get_db)
):
    rule = create_targeting_rule(db, data)

    if rule is None:
        raise HTTPException(
            status_code=404,
            detail="Flag not found"
        )

    return rule


@router.get(
    "/{flag_id}",
    response_model=list[TargetingRuleResponse]
)
def list_rules(
    flag_id: int,
    db: Session = Depends(get_db)
):
    return get_targeting_rules(db, flag_id)
