from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class TargetingOperator(str, Enum):
    equals = "equals"
    not_equals = "not_equals"
    contains = "contains"
    starts_with = "starts_with"
    ends_with = "ends_with"
    in_operator = "in"


class TargetingRuleCreate(BaseModel):
    flag_id: int
    attribute: str = Field(min_length=1, max_length=100)
    operator: TargetingOperator
    value: str = Field(min_length=1, max_length=255)
    priority: int = 0


class TargetingRuleResponse(BaseModel):
    id: int
    flag_id: int
    attribute: str
    operator: str
    value: str
    priority: int

    model_config = ConfigDict(from_attributes=True)
