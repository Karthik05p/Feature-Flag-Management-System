# Locust evaluation load test

## Purpose

This workload measures the authenticated `POST /api/evaluate` path under
concurrency. It measures the real FastAPI, PostgreSQL, Redis result-cache, and
Redis analytics-counter behavior. It does not modify application behavior.

Use this only against a dedicated load-test environment. Never run it against
production or a shared development database.

## Prerequisites

- Python dependencies from the project requirements.
- Locust installed separately as a load-testing tool:

  ```powershell
  python -m pip install locust
  ```

- PostgreSQL with the project migrations applied.
- Redis available to the FastAPI process.
- FastAPI running under Uvicorn.
- A dedicated database and Redis instance/database for the test campaign.

The repository does not currently provide Docker Compose configuration. Start
PostgreSQL and Redis using your local service tooling, and keep their data
isolated from development/demo data.

## Configuration

Point the application `.env` or process environment at the dedicated
PostgreSQL database:

```text
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<load_test_database>
REDIS_HOST=<load-test-redis-host>
REDIS_PORT=6379
```

The application already supports bounded Redis settings:

```text
REDIS_SOCKET_CONNECT_TIMEOUT=1.0
REDIS_SOCKET_TIMEOUT=1.0
REDIS_RETRIES=0
```

Locust settings:

```text
LOAD_TEST_ENVIRONMENT=load-test
LOAD_TEST_USERNAME=loadtest
LOAD_TEST_PASSWORD=<dedicated-password>
LOAD_TEST_CACHED_FLAG=load_cached
LOAD_TEST_VARIED_FLAG=load_user_targeted
```

The defaults match the seed script, but set an explicit password for shared
environments.

## Seed data

After applying migrations, run the idempotent seed script with the dedicated
database configuration:

```powershell
python scripts/seed_load_test_data.py
```

It creates or reuses only the `load-test` environment and these flags:

- `load_cached` — enabled flag for repeated cached evaluation.
- `load_disabled` — disabled/default flag.
- `load_user_targeted` — active user rule.
- `load_group_targeted` — active group rule.
- `load_percentage` — active 50% percentage rule.

It also creates the dedicated login user and a group membership used by the
seeded targeting data. It does not delete or rewrite unrelated rows.

## Start FastAPI

From the project root, with the dedicated `.env` or environment variables:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Verify the server and services before starting Locust. The evaluation route is
authenticated, so the seeded load-test user must exist in the same database
used by FastAPI.

## Start Locust

Interactive web UI:

```powershell
locust -f loadtests/locustfile.py --host http://127.0.0.1:8000
```

Then open `http://localhost:8089` and select one user class:

- `CachedEvaluationUser` for the cache-hot profile.
- `VariedContextEvaluationUser` for varied cache keys.
- `MixedEvaluationUser` for the recommended 75% cached / 25% varied mix.

Headless example:

```powershell
locust -f loadtests/locustfile.py `
  --host http://127.0.0.1:8000 `
  --headless `
  --class-picker `
  --users 25 `
  --spawn-rate 5 `
  --run-time 5m `
  --html loadtests/results-25-users.html
```

Do not run a 100-user test automatically. Increase load deliberately after
checking the lower-concurrency result.

## Completed campaign

The Phase C campaign was completed with `MixedEvaluationUser` using the same
scenario and dedicated seed data. The one-user cached and varied-context runs
established the profile baselines; the concurrency progression below reports
the mixed workload. Evaluation request counts exclude the one-time login and
warm-up requests made by each Locust user.

| Users | Evaluation requests | Total requests | RPS | p50 | p95 | p99 | Average | Failures |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 558 | 560 | 6.2 | 21 ms | 38 ms | 45 ms | 24.48 ms | 0 |
| 10 | 6,484 | 6,504 | 54.2 | 46 ms | 130 ms | 220 ms | 57.55 ms | 0 |
| 25 | 9,236 | 9,286 | 76.8 | 180 ms | 370 ms | 450 ms | 192.44 ms | 0 |
| 50 | 10,503 | 10,603 | 83.7 | 450 ms | 730 ms | 940 ms | 446.14 ms | 0 |

All campaigns completed with zero failures. The 10-user workload was
approximately 74.5% cached / 25.5% varied; the 25-user workload was 74.9% /
25.1%; and the 50-user workload was 75.4% / 24.6%. Throughput increased as
users were added, but p95 and p99 latency increased substantially, reaching
730 ms and 940 ms at 50 users. The 50-user campaign was the highest completed
test. A 100-user campaign was intentionally not performed.

These results are specific to the local test environment and must not be
presented as production capacity or as evidence of support for exactly 50
production users. Keep the test duration below the current 60-minute JWT
lifetime, or restart/authenticate a new campaign before tokens expire.

## Scenarios

### Cached evaluation

`CachedEvaluationUser` warms one fixed flag/environment/user context and then
repeats it using the request name `evaluate - cached`.

The response contract exposes cache hits through:

```text
message = "Returned From Redis Cache"
```

The application still performs PostgreSQL environment/flag lookups and the
Redis analytics increment before checking the result cache.

### Varied context

`VariedContextEvaluationUser` generates a unique `user_context.user_id` for
each request. This creates distinct result-cache keys and exercises the
evaluation path more heavily than the cache-hot profile.

### Mixed workload

`MixedEvaluationUser` uses Locust task weights of 3:1:

- approximately 75% cached requests;
- approximately 25% varied-context requests.

Configuration mutations are intentionally excluded.

## Metrics and interpretation

Locust reports the following per request name and in aggregate:

- total requests;
- successful and failed requests;
- requests per second;
- average and median latency;
- p50 latency;
- p95 latency;
- p99 latency;
- maximum latency;
- HTTP failures and error rate.

Compare `evaluate - cached` with
`evaluate - varied-context`. Look for latency growth, throughput saturation,
5xx responses, Redis timeout errors, PostgreSQL connection exhaustion, and
long p99 tails as users increase.

Do not invent a fixed pass/fail latency target. The first campaign establishes
a baseline for the exact machine, worker count, PostgreSQL configuration,
Redis configuration, and network path used. Results are environment-specific
and must not be presented as production capacity unless the infrastructure is
equivalent.

## Analytics behavior

Every valid evaluation increments the Redis hourly analytics counter, including
result-cache hits. This overhead is intentionally included in the primary
benchmark because it is part of the real request path.

The Redis-to-PostgreSQL analytics flush is not part of `/evaluate` latency and
must not be mixed into Locust request timings. If desired, verify it separately
after a run using the existing flush service and the analytics API.

## Safety and cleanup

- Use a dedicated PostgreSQL database.
- Use a dedicated Redis instance or isolated Redis database.
- Use a dedicated load-test user and environment.
- Never point `DATABASE_URL` or Redis settings at production.
- Do not run the seed script against shared demo data.
- After a campaign, stop Locust and Uvicorn, then remove the dedicated
  database/Redis data using the service’s administrative tooling.

The seed script is idempotent and does not remove unrelated records, so cleanup
should be performed only against the dedicated load-test resources.

## Known limitations

- The application database engine currently uses SQLAlchemy `echo=True`, which
  adds SQL log I/O and can distort local measurements.
- The project does not currently configure explicit SQLAlchemy pool sizing.
- Redis result caching and analytics counters share the configured Redis
  service.
- The load test measures the API, not browser rendering or frontend behavior.
- A cache hit still includes PostgreSQL lookups and an analytics Redis write.
- JWT tokens currently expire after 60 minutes.
- Locust is intentionally not added to production runtime requirements.
