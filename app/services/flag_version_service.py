from sqlalchemy.orm import Session

from app.models.flag import Flag
from app.models.flag_version import FlagVersion


def get_flag_versions(
    db: Session,
    flag_id: int
) -> list[FlagVersion] | None:

    flag = (
        db.query(Flag)
        .filter(Flag.id == flag_id)
        .first()
    )

    if flag is None:
        return None

    return (
        db.query(FlagVersion)
        .filter(FlagVersion.flag_id == flag_id)
        .order_by(FlagVersion.version.asc())
        .all()
    )
