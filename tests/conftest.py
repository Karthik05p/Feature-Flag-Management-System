import fnmatch
import asyncio
import json
from urllib.parse import urlsplit

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
# Importing app.models ensures every model class (Flag, Environment,
# FlagVersion, TargetingRule, AuditLog, UserGroupMembership) is registered
# on Base's metadata and all relationship() string references can resolve.
import app.models as models  # noqa: F401
from app.models.environment import Environment
from app.models.flag import Flag
from app.models.user import User
from app.services.auth_service import hash_password
from app.main import app


class FakeRedis:
    """Minimal isolated cache for backend tests without a Redis service."""

    def __init__(self):
        self.values = {}
        self.hashes = {}

    def get(self, key):
        return self.values.get(key)

    def set(self, key, value):
        self.values[key] = value

    def scan_iter(self, match=None, count=None):
        keys = set(self.values) | set(self.hashes)
        yield from [key for key in keys if fnmatch.fnmatchcase(key, match)]

    def delete(self, *keys):
        deleted = 0
        for key in keys:
            if key in self.values:
                del self.values[key]
                deleted += 1
            if key in self.hashes:
                del self.hashes[key]
                deleted += 1
        return deleted

    def hincrby(self, key, field, amount):
        bucket = self.hashes.setdefault(key, {})
        bucket[field] = bucket.get(field, 0) + amount
        return bucket[field]

    def hgetall(self, key):
        return dict(self.hashes.get(key, {}))


@pytest.fixture()
def fake_redis():
    return FakeRedis()


@pytest.fixture(autouse=True)
def isolated_evaluation_cache(monkeypatch, fake_redis):
    from app.services import evaluation_engine

    monkeypatch.setattr(evaluation_engine, "redis_client", fake_redis)
    return fake_redis


@pytest.fixture()
def e2e_client(db_session):
    """Small ASGI client for integration tests without a network server."""

    db_session.add(User(username="admin", hashed_password=hash_password("admin123")))
    db_session.commit()

    def override_get_db():
        yield db_session

    from app.api import auth as auth_api
    from app.database import session as database_session

    app.dependency_overrides[auth_api.get_db] = override_get_db
    app.dependency_overrides[database_session.get_db] = override_get_db

    def request(method, path, headers=None, body=None):
        parsed = urlsplit(path)
        request_body = json.dumps(body).encode() if body is not None else b""
        request_headers = [(key.lower().encode(), value.encode()) for key, value in (headers or {}).items()]
        if body is not None:
            request_headers.append((b"content-type", b"application/json"))
        response = {"status": None, "headers": [], "body": b""}
        body_sent = False

        async def receive():
            nonlocal body_sent
            if body_sent:
                return {"type": "http.disconnect"}
            body_sent = True
            return {"type": "http.request", "body": request_body, "more_body": False}

        async def send(message):
            if message["type"] == "http.response.start":
                response["status"] = message["status"]
                response["headers"] = message["headers"]
            elif message["type"] == "http.response.body":
                response["body"] += message.get("body", b"")

        async def execute():
            await app(
                {
                    "type": "http",
                    "http_version": "1.1",
                    "method": method,
                    "scheme": "http",
                    "path": parsed.path,
                    "raw_path": parsed.path.encode(),
                    "query_string": parsed.query.encode(),
                    "headers": request_headers,
                    "client": ("testclient", 50000),
                    "server": ("testserver", 80),
                },
                receive,
                send,
            )

        asyncio.run(execute())
        response["json"] = json.loads(response["body"]) if response["body"] else None
        response["headers"] = {key.decode().lower(): value.decode() for key, value in response["headers"]}
        return response

    yield request
    app.dependency_overrides.clear()


@pytest.fixture()
def db_session():
    # In-memory SQLite DB, isolated per test. StaticPool + check_same_thread=False
    # keeps a single connection alive for the lifetime of the engine, which is
    # required for SQLite ":memory:" databases to work with SQLAlchemy sessions.
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    session = TestingSessionLocal()

    # --- Seed data expected by test_engine.py ---
    dev_env = Environment(name="development", description="Dev environment")
    session.add(dev_env)
    session.flush()  # populate dev_env.id without committing

    dark_mode = Flag(
        environment_id=dev_env.id,
        key="dark_mode",
        name="Dark Mode",
        description="Enables dark mode UI",
        enabled=True,
        type="boolean",
        default_value="true",
        owner_team="frontend",
    )

    payment_v2 = Flag(
        environment_id=dev_env.id,
        key="payment_v2",
        name="Payment V2",
        description="New payment flow",
        enabled=False,
        type="boolean",
        default_value="false",
        owner_team="payments",
    )

    session.add_all([dark_mode, payment_v2])
    session.commit()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
