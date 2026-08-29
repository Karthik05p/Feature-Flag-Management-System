from pydantic import BaseModel, ConfigDict, Field


class FlagCreate(BaseModel):
    environment_id: int
    key: str
    type: str
    default_value: str
    enabled: bool = False
    rollout_percentage: int = Field(default=100, ge=0, le=100)
    description: str | None = None
    owner_team: str | None = None


class FlagUpdate(BaseModel):
    enabled: bool | None = None
    default_value: str | None = None
    rollout_percentage: int | None = Field(
        default=None,
        ge=0,
        le=100
    )
    description: str | None = None
    owner_team: str | None = None


class FlagResponse(BaseModel):
    id: int
    environment_id: int
    key: str
    type: str
    default_value: str
    enabled: bool
    rollout_percentage: int
    description: str | None = None
    owner_team: str | None = None

    model_config = ConfigDict(from_attributes=True)