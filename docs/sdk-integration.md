# FlagFlow SDK and Integration Guide

## Overview

FlagFlow exposes an authenticated REST API for managing environments, feature
flags, and targeting rules, plus a runtime endpoint for evaluating a flag.
The repository also contains a Python `FlagClient` helper at
`app/middleware/flag_client.py`. It is not a separately packaged or published
SDK.

Management APIs change configuration. Runtime evaluation reads the configured
flag and returns the decision for an environment and optional user context.

## Authentication

Obtain a JWT with `POST /api/auth/login`:

```http
POST /api/auth/login
Content-Type: application/json

{"username":"<username>","password":"<password>"}
```

The response is:

```json
{"access_token":"<jwt>","token_type":"bearer"}
```

Send the token to protected endpoints as:

```http
Authorization: Bearer <jwt>
```

The login endpoint is implemented in `app/api/auth.py` (`login`). Protected
route authentication is implemented by `app/core/security.py`
(`get_current_user`).

## Feature evaluation

Call `POST /api/evaluate` with an `EvaluationRequest` from
`app/schemas/evaluation.py`:

```json
{
  "flag_key": "dark_mode",
  "environment_name": "development",
  "user_context": {"user_id": "user-123"}
}
```

`flag_key` and `environment_name` are strings. `user_context` is optional and
may be `null`. The route is `evaluate` in `app/api/flag_routes.py` and calls
`evaluate_flag` in `app/services/evaluation_engine.py`.

Successful responses include:

```json
{
  "success": true,
  "message": "Default Flag Evaluation",
  "environment": "development",
  "flag": "dark_mode",
  "enabled": true,
  "value": "true"
}
```

The response `enabled` value is the boolean decision and `value` is the flag's
configured default value (which may be boolean, string, or number). Depending
on the path taken, `message` can be:

- `Default Flag Evaluation`
- `Matched User Targeting Rule`
- `Matched Group Targeting Rule`
- `Matched Percentage Rollout`
- `Returned From Redis Cache`

An unknown environment or flag returns HTTP 200 with `success: false` and a
message such as `Environment not found` or `Feature flag not found`.

## Targeting

Targeting rules are configured through the authenticated targeting-rule API.
The evaluation engine currently supports these rule types:

- **User:** with a `user_context.user_id` matching the rule value.
- **Group:** with a `user_context.user_id` whose group membership matches the
  rule value. Membership data is represented by the
  `UserGroupMembership` model; no public membership-management endpoint is
  confirmed in the source.
- **Percentage:** with a `user_context.user_id`; the engine applies a
  deterministic SHA-256 bucket using `user_id:flag_key`.

Rules are evaluated in this fixed precedence order: user, group, then
percentage. Within each rule type, lower priority numbers are evaluated first.
If multiple active rules have the same priority, the rule with the lower
database ID is evaluated first. Only active rules participate. The first
matching rule returns its `enabled` treatment together with the flag's
configured `value`; when no rule matches, the flag's default state is returned.

## Python `FlagClient`

The helper is defined in `app/middleware/flag_client.py`:

```python
from app.middleware.flag_client import FlagClient

client = FlagClient(
    base_url="http://127.0.0.1:8000/api",
    environment="development",
    auth_token="<jwt>",
)

result = client.evaluate("dark_mode", {"user_id": "user-123"})
enabled = client.is_enabled("dark_mode", {"user_id": "user-123"})
value = client.get_value("dark_mode", {"user_id": "user-123"})
```

Constructor parameters are `base_url`, `environment`, `cache_ttl=30`,
`stale_ttl=60`, `timeout=5`, `use_stale_cache=True`, and `auth_token=None`.
The helper posts to `{base_url}/evaluate` with the Bearer token. It keeps an
in-memory cache keyed by environment, flag key, and user context. Fresh values
are returned locally; expired values may be served as stale values after an
API request failure when `use_stale_cache` is enabled. Without an
`auth_token`, a cache miss raises `FlagClientAuthenticationError`.

Additional methods:

```python
client.clear_cache()
client.clear_flag("dark_mode", {"user_id": "user-123"})
stats = client.cache_stats()
```

`cache_stats()` reports hits, misses, stale hits, total requests, hit rate,
and cached item count. HTTP failures are re-raised unless a permitted stale
value is available.

## Management API reference

All of the following routes require the JWT Bearer header:

- Flags: `GET/POST /api/flags`, `GET/PUT/DELETE /api/flags/{flag_id}`
- Environments: `GET/POST /api/environment`,
  `GET/PUT/DELETE /api/environment/{environment_id}`
- Targeting rules: `GET/POST /api/targeting-rules`,
  `GET/PUT/DELETE /api/targeting-rules/{rule_id}`

Request schemas and validation are defined in `app/schemas/feat_flag.py`,
`app/schemas/environment.py`, and `app/schemas/targeting_rule.py`. These are
configuration endpoints; use `POST /api/evaluate` for application runtime
decisions.

## API documentation

FastAPI exposes the generated documentation at:

- `/docs` (Swagger UI)
- `/redoc` (ReDoc)
- `/openapi.json` (OpenAPI document)

The application is created in `app/main.py`.

## Integration notes

- Runtime evaluation is authenticated; it is not a public or anonymous API.
- Keep management/configuration credentials and runtime evaluation credentials
  protected by the integrating application.
- The Python helper's local cache is separate from the server's Redis result
  cache. Redis is an implementation detail of the FlagFlow evaluation service.
- No JavaScript, Java, Go, or other language SDK is confirmed in this
  repository.
