from pydantic import BaseModel, ConfigDict


class EnvironmentCreate(BaseModel):
    name: str
    description: str | None = None


class EnvironmentResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)
