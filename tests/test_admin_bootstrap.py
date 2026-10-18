import pytest
import importlib

from app.models.user import User
from app.services.auth_service import verify_password
from bootstrap_admin import bootstrap_admin


bootstrap_module = importlib.import_module("bootstrap_admin")


def test_bootstrap_creates_hashed_admin_from_credentials(db_session):
    created = bootstrap_admin(db_session, "railway-admin", "strong-password")

    user = db_session.query(User).filter(User.username == "railway-admin").one()
    assert created is True
    assert user.hashed_password != "strong-password"
    assert verify_password("strong-password", user.hashed_password)


def test_bootstrap_requires_credentials_from_environment(monkeypatch):
    monkeypatch.delenv("ADMIN_BOOTSTRAP_USERNAME", raising=False)
    monkeypatch.delenv("ADMIN_BOOTSTRAP_PASSWORD", raising=False)

    with pytest.raises(RuntimeError, match="ADMIN_BOOTSTRAP_USERNAME"):
        bootstrap_module.main()


def test_bootstrap_does_not_duplicate_or_change_existing_user(db_session):
    existing = User(username="existing-admin", hashed_password="existing-hash")
    db_session.add(existing)
    db_session.commit()

    created = bootstrap_admin(db_session, "existing-admin", "new-password")

    db_session.refresh(existing)
    assert created is False
    assert existing.hashed_password == "existing-hash"
    assert db_session.query(User).filter(User.username == "existing-admin").count() == 1


def test_bootstrap_does_not_print_password(monkeypatch, capsys):
    monkeypatch.setenv("ADMIN_BOOTSTRAP_USERNAME", "railway-admin")
    monkeypatch.setenv("ADMIN_BOOTSTRAP_PASSWORD", "super-secret-password")
    monkeypatch.setattr(bootstrap_module, "bootstrap_admin", lambda db, username, password: True)

    class FakeSession:
        def close(self):
            pass

    monkeypatch.setattr(bootstrap_module, "SessionLocal", lambda: FakeSession())
    bootstrap_module.main()

    assert "super-secret-password" not in capsys.readouterr().out
