from pydantic import BaseModel, ConfigDict, Field


class FlagEvaluationResponse(BaseModel):
    key: str
    enabled: bool
    value: str


class EvaluationContext(BaseModel):
    user_id: str | None = None
    country: str | None = None
    groups: list[str] = Field(default_factory=list)
    attributes: dict[str, str] = Field(default_factory=dict)

    model_config = ConfigDict(extra="allow")
