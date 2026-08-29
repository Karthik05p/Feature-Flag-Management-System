from sqlalchemy.orm import Session

from app.models.targeting_rule import TargetingRule
from app.models.flag import Flag
from app.schemas.targeting import TargetingRuleCreate


def create_targeting_rule(
    db: Session,
    rule_data: TargetingRuleCreate
) -> TargetingRule | None:

    flag = (
        db.query(Flag)
        .filter(Flag.id == rule_data.flag_id)
        .first()
    )

    if flag is None:
        return None

    rule = TargetingRule(
        flag_id=rule_data.flag_id,
        attribute=rule_data.attribute,
        operator=rule_data.operator,
        value=rule_data.value,
        priority=rule_data.priority
    )

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return rule


def get_targeting_rules(
    db: Session,
    flag_id: int
) -> list[TargetingRule]:

    return (
        db.query(TargetingRule)
        .filter(TargetingRule.flag_id == flag_id)
        .order_by(TargetingRule.priority)
        .all()
    )
