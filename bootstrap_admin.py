import os

from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password


def bootstrap_admin(db: Session, username: str, password: str) -> bool:
    """Create the initial admin user without changing an existing account."""

    normalized_username = username.strip()
    if not normalized_username or not password:
        raise ValueError("Admin bootstrap username and password must not be empty.")

    existing = db.query(User).filter(User.username == normalized_username).first()
    if existing:
        return False

    db.add(User(username=normalized_username, hashed_password=hash_password(password)))
    db.commit()
    return True


def main() -> None:
    username = os.environ.get("ADMIN_BOOTSTRAP_USERNAME")
    password = os.environ.get("ADMIN_BOOTSTRAP_PASSWORD")
    if username is None or password is None:
        raise RuntimeError(
            "ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD are required."
        )

    db = SessionLocal()
    try:
        created = bootstrap_admin(db, username, password)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    if created:
        print(f"Created admin user '{username.strip()}'.")
    else:
        print(f"Admin user '{username.strip()}' already exists; no changes made.")


if __name__ == "__main__":
    main()
