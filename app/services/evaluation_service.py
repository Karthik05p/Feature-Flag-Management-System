import hashlib
import json

from sqlalchemy.orm import Session

from app.cache.redis_client import redis_client
from app.models.environment import Environment
from app.models.flag import Flag
from app.models.targeting_rule import TargetingRule
from app.models.user_group_membership import UserGroupMembership


CACHE_TTL = 60


def _cache_key(
    environment_name: str,
    flag_key: str,
    context: dict[str, str | list[str]] | None
) -> str:

    context = context or {}

    normalized_context = json.dumps(
        context,
        sort_keys=True,
        separators=(",", ":")
    )

    context_hash = hashlib.sha256(
        normalized_context.encode("utf-8")
    ).hexdigest()

    return f"flag:{environment_name}:{flag_key}:{context_hash}"


def _set_effective_enabled(
    flag: Flag,
    enabled: bool
) -> Flag:

    flag._effective_enabled = enabled
    return flag


def evaluate_flag(
    db: Session,
    environment_name: str,
    flag_key: str,
    context: dict[str, str | list[str]] | None = None
) -> Flag | None:

    cache_key = _cache_key(
        environment_name,
        flag_key,
        context
    )

    cached = redis_client.get(cache_key)

    if cached is not None:
        cached_data = json.loads(cached)

        flag = (
            db.query(Flag)
            .join(Environment)
            .filter(
                Environment.name == environment_name,
                Flag.key == flag_key
            )
            .first()
        )

        if flag is None:
            return None

        return _set_effective_enabled(
            flag,
            cached_data["enabled"]
        )

    environment = (
        db.query(Environment)
        .filter(Environment.name == environment_name)
        .first()
    )

    if environment is None:
        return None

    flag = (
        db.query(Flag)
        .filter(
            Flag.environment_id == environment.id,
            Flag.key == flag_key
        )
        .first()
    )

    if flag is None:
        return None

    rules = (
        db.query(TargetingRule)
        .filter(TargetingRule.flag_id == flag.id)
        .order_by(TargetingRule.priority.asc())
        .all()
    )

    if not rules:
        flag = _set_effective_enabled(flag, flag.enabled)

        redis_client.setex(
            cache_key,
            CACHE_TTL,
            json.dumps({
                "enabled": flag._effective_enabled,
                "value": flag.default_value
            })
        )

        return flag

    if context is None:
        flag = _set_effective_enabled(flag, flag.enabled)

        redis_client.setex(
            cache_key,
            CACHE_TTL,
            json.dumps({
                "enabled": flag._effective_enabled,
                "value": flag.default_value
            })
        )

        return flag

    user_id = context.get("user_id")
    groups = context.get("groups", [])

    if user_id is not None and not groups:
        memberships = (
            db.query(UserGroupMembership)
            .filter(UserGroupMembership.user_id == user_id)
            .all()
        )

        groups = [
            membership.group_name
            for membership in memberships
        ]

    targeting_matched = False

    for rule in rules:

        actual_value = None

        if rule.attribute == "user_id":
            actual_value = user_id

        elif rule.attribute == "group":

            if isinstance(groups, list):

                if rule.operator == "equals":

                    if rule.value in groups:
                        targeting_matched = True
                        break

                elif rule.operator == "in":

                    allowed_groups = [
                        value.strip()
                        for value in rule.value.split(",")
                    ]

                    if any(
                        group in allowed_groups
                        for group in groups
                    ):
                        targeting_matched = True
                        break

                continue

        else:
            actual_value = context.get(rule.attribute)

        if actual_value is None:
            continue

        if not isinstance(actual_value, str):
            continue

        matched = False

        if rule.operator == "equals":
            matched = actual_value == rule.value

        elif rule.operator == "not_equals":
            matched = actual_value != rule.value

        elif rule.operator == "contains":
            matched = rule.value in actual_value

        elif rule.operator == "starts_with":
            matched = actual_value.startswith(rule.value)

        elif rule.operator == "ends_with":
            matched = actual_value.endswith(rule.value)

        elif rule.operator == "in":
            allowed_values = [
                value.strip()
                for value in rule.value.split(",")
            ]

            matched = actual_value in allowed_values

        if matched:
            targeting_matched = True
            break

    if not targeting_matched:
        flag = _set_effective_enabled(flag, False)

        redis_client.setex(
            cache_key,
            CACHE_TTL,
            json.dumps({
                "enabled": False,
                "value": flag.default_value
            })
        )

        return flag

    if not flag.enabled:
        flag = _set_effective_enabled(flag, False)

        redis_client.setex(
            cache_key,
            CACHE_TTL,
            json.dumps({
                "enabled": False,
                "value": flag.default_value
            })
        )

        return flag

    percentage = flag.rollout_percentage

    if percentage <= 0:
        flag = _set_effective_enabled(flag, False)

    elif percentage >= 100:
        flag = _set_effective_enabled(flag, True)

    elif user_id is None:
        flag = _set_effective_enabled(flag, False)

    else:
        hash_input = f"{flag.key}:{user_id}"

        hash_value = hashlib.sha256(
            hash_input.encode("utf-8")
        ).hexdigest()

        bucket = int(hash_value[:8], 16) % 100

        flag = _set_effective_enabled(
            flag,
            bucket < percentage
        )

    redis_client.setex(
        cache_key,
        CACHE_TTL,
        json.dumps({
            "enabled": flag._effective_enabled,
            "value": flag.default_value
        })
    )

    return flag
