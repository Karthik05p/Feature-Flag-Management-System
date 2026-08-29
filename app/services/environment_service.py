from sqlalchemy.orm import Session

from app.models.environment import Environment
from app.schemas.environment import EnvironmentCreate


def create_environment(
    db: Session,
    environment_data: EnvironmentCreate
) -> Environment:
    environment = Environment(
        name=environment_data.name,
        description=environment_data.description
    )

    db.add(environment)
    db.commit()
    db.refresh(environment)

    return environment


def get_environments(db: Session) -> list[Environment]:
    return db.query(Environment).all()


def get_environment(
    db: Session,
    environment_id: int
) -> Environment | None:
    return (
        db.query(Environment)
        .filter(Environment.id == environment_id)
        .first()
    )


def delete_environment(
    db: Session,
    environment_id: int
) -> bool:
    environment = get_environment(db, environment_id)

    if environment is None:
        return False

    db.delete(environment)
    db.commit()

    return True
