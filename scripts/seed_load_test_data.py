"""Idempotently seed isolated data for the Locust evaluation workload.

Run this with DATABASE_URL pointed at a dedicated load-test PostgreSQL
database. The script does not clear or modify demo/development data.
"""

from __future__ import annotations

import os

from sqlalchemy import select

from app.database.session import SessionLocal
from app.models import Environment, Flag, TargetingRule, User, UserGroupMembership
from app.services.auth_service import hash_password


ENVIRONMENT_NAME = os.getenv("LOAD_TEST_ENVIRONMENT", "load-test")
USERNAME = os.getenv("LOAD_TEST_USERNAME", "loadtest")
PASSWORD = os.getenv("LOAD_TEST_PASSWORD", "loadtest-password")


def get_or_create_flag(db, environment: Environment, *, key: str, enabled: bool, default_value: str) -> Flag:
    flag = db.scalar(select(Flag).where(Flag.environment_id == environment.id, Flag.key == key))
    if flag is None:
        flag = Flag(
            environment_id=environment.id,
            key=key,
            name=key.replace("_", " ").title(),
            description="Dedicated Locust load-test flag",
            enabled=enabled,
            type="string",
            default_value=default_value,
            owner_team="load-testing",
        )
        db.add(flag)
        db.flush()
    return flag


def get_or_create_rule(db, flag: Flag, **values) -> TargetingRule:
    rule = db.scalar(
        select(TargetingRule).where(
            TargetingRule.flag_id == flag.id,
            TargetingRule.rule_type == values["rule_type"],
            TargetingRule.priority == values["priority"],
        )
    )
    if rule is None:
        rule = TargetingRule(flag_id=flag.id, **values)
        db.add(rule)
        db.flush()
    return rule


def seed() -> dict[str, int]:
    db = SessionLocal()
    try:
        environment = db.scalar(select(Environment).where(Environment.name == ENVIRONMENT_NAME))
        if environment is None:
            environment = Environment(name=ENVIRONMENT_NAME, description="Dedicated Locust load-test environment", is_active=True)
            db.add(environment)
            db.flush()

        cached = get_or_create_flag(db, environment, key="load_cached", enabled=True, default_value="on")
        get_or_create_flag(db, environment, key="load_disabled", enabled=False, default_value="off")
        user_targeted = get_or_create_flag(db, environment, key="load_user_targeted", enabled=False, default_value="off")
        group_targeted = get_or_create_flag(db, environment, key="load_group_targeted", enabled=False, default_value="off")
        percentage = get_or_create_flag(db, environment, key="load_percentage", enabled=False, default_value="off")

        get_or_create_rule(db, user_targeted, priority=1, rule_type="user", operator="equals", value="loadtest-user", percentage=None, enabled=True, is_active=True)
        get_or_create_rule(db, group_targeted, priority=1, rule_type="group", operator="equals", value="loadtest-group", percentage=None, enabled=True, is_active=True)
        get_or_create_rule(db, percentage, priority=1, rule_type="percentage", operator=None, value=None, percentage=50, enabled=True, is_active=True)

        user = db.scalar(select(User).where(User.username == USERNAME))
        if user is None:
            db.add(User(username=USERNAME, hashed_password=hash_password(PASSWORD)))

        membership = db.scalar(
            select(UserGroupMembership).where(
                UserGroupMembership.user_id == "loadtest-user",
                UserGroupMembership.group_name == "loadtest-group",
            )
        )
        if membership is None:
            db.add(UserGroupMembership(user_id="loadtest-user", group_name="loadtest-group"))

        db.commit()
        return {"environment": environment.id, "flags": 5, "rules": 3}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    result = seed()
    print("Load-test seed complete:", ", ".join(f"{key}={value}" for key, value in result.items()))
