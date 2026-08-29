from pydantic import BaseModel, ConfigDict


class FlagVersionResponse(BaseModel):
    id: int
    flag_id: int
    version: int
    value: str
    enabled: bool

    model_config = ConfigDict(from_attributes=True)
