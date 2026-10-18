# Application Feature Management and Release Control System

FlagFlow is a feature-flag management and release-control platform. It lets
teams manage flags across environments, target users and groups, run
deterministic percentage rollouts, evaluate flags through an authenticated API,
review configuration history, and inspect evaluation telemetry.

## Key features

- JWT Bearer authentication for protected management and evaluation routes.
- Environment-scoped feature flags with boolean, string, and number values.
- User, group, and percentage targeting rules with separate active state and
  boolean treatment.
- Deterministic evaluation with Redis result caching and bounded Redis failure
  behavior.
- Python `FlagClient` middleware/helper with local caching and stale-value
  handling.
- Audit logs for flag and targeting-rule changes, including state snapshots.
- Hourly evaluation counters in Redis; completed hourly Redis buckets can be
  flushed into PostgreSQL through the evaluation analytics service.
- React/Vite administration dashboard with Feature Flags, Environments,
  Targeting Rules, Analytics, Audit Logs, and Settings modules.
- Read-only flag cleanup candidate tooling.

## Technology stack

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic, Uvicorn, JWT
- **Frontend:** React, Vite, React Router, Recharts
- **Database:** PostgreSQL
- **Cache/telemetry:** Redis
- **Testing:** pytest, isolated SQLite integration fixtures, fake Redis
- **Analytics flushing:** a FastAPI lifecycle task flushes completed Redis
  evaluation buckets to PostgreSQL at the start of each UTC day.
- **Load testing:** Locust
- **Browser E2E:** Playwright

## Project structure

```text
app/                  FastAPI application, models, schemas, services, and routes
alembic/              Database migrations
frontend/             React/Vite dashboard
scripts/              Demo and Locust seed scripts
loadtests/            Locust workload and campaign documentation
tests/                Unit, API, integration, analytics, and client tests
docs/                 Database schema and ER documentation
requirements.txt      Backend Python dependencies
```

Important entry points include `app/main.py`, `app/services/evaluation_engine.py`,
`app/middleware/flag_client.py`, `frontend/src/App.jsx`, and
`frontend/src/services/api.js`.

Architecture and runtime data flow are documented in
[`docs/architecture.md`](docs/architecture.md).

## Prerequisites

Install the dependencies listed in `requirements.txt`, Node/npm for the
frontend, PostgreSQL, and Redis. Locust is needed only for the documented load
tests and is intentionally not part of the runtime requirements.

The repository provides Docker Compose configuration for the frontend, backend,
PostgreSQL, and Redis. The local-development workflow below still uses
PostgreSQL and Redis with your local service tooling.

### Docker Compose deployment

Docker Compose provides a reproducible local stack with the production-built
frontend, FastAPI backend, PostgreSQL, and Redis. Install Docker Desktop or
Docker Engine with Compose v2, then run from the repository root:

```powershell
docker compose up -d --build postgres redis
docker compose run --rm backend python -m alembic upgrade head
docker compose up -d --build
```

The first command starts the Compose infrastructure, the second applies the
database schema, and the third starts the complete application stack.
`docker compose up -d --build` does not run migrations and does not create an
application admin account or demo records automatically.

The browser application is available at `http://localhost:5173`, and the
backend is available at `http://localhost:8000`. Swagger is available at
`http://localhost:8000/docs`. The frontend container serves the Vite
production build and proxies the browser's `/api` requests to the backend.
PostgreSQL and Redis are internal Compose services; their data is not exposed
on host ports. PostgreSQL data persists in the named `postgres_data` volume.
Use these commands to inspect logs or stop the stack:

```powershell
docker compose ps
docker compose logs --no-color backend
docker compose down
```

`docker compose down` removes the containers but preserves the named
`postgres_data` volume. To intentionally reset the Compose database, use
`docker compose down -v`; this also removes that volume and deletes its
database contents. This is a destructive reset operation and is not part of
normal shutdown.

The Compose backend uses service names (`postgres` and `redis`) for internal
connections. It does not run migrations or seed data automatically. Initialize
an admin or demo dataset separately after the migrations have completed. For a
production-style bootstrap, provide `ADMIN_BOOTSTRAP_USERNAME` and
`ADMIN_BOOTSTRAP_PASSWORD` securely and run `python bootstrap_admin.py` once.
The command is idempotent and does not change an existing user's password. The
existing `seed_user.py` helper creates the local-development `admin` account,
while
`scripts/seed_demo_data.py` adds idempotent demo data only when its required
environments already exist. These scripts are repository/local-development
helpers; only `bootstrap_admin.py` is included in the backend image. Demo data
is optional and must be seeded intentionally. `scripts/seed_load_test_data.py`
is for isolated Locust load-test data, not normal application initialization.

The existing local Vite workflow remains available with `cd frontend`,
`npm install`, and `npm run dev`.

## Environment configuration

Create a local `.env` file. Do not commit secrets. The backend settings require:

```text
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
JWT_SECRET_KEY=<local-secret>
```

Optional settings supported by `app/database/config.py` are:

```text
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=30
REDIS_URL=redis://[:<password>@]<host>:<port>/0
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_SOCKET_CONNECT_TIMEOUT=1.0
REDIS_SOCKET_TIMEOUT=1.0
REDIS_RETRIES=0
```

Use a dedicated database and Redis instance/database for load testing. The
Locust-specific variables are documented in [`loadtests/README.md`](loadtests/README.md).

## Database setup

From the project root, after configuring `DATABASE_URL`:

```powershell
python -m alembic upgrade head
```

The current migration head is `b2c3d4e5f6a7`. Migrations create the users,
environments, flags, flag versions, targeting rules, audit logs, and evaluation
count tables and indexes.

For a deployed or production-style initialization, configure the bootstrap
credentials through the deployment environment and run this one-off command
after migrations:

```powershell
python bootstrap_admin.py
```

This requires `ADMIN_BOOTSTRAP_USERNAME` and `ADMIN_BOOTSTRAP_PASSWORD`. It
creates the user only when that username does not already exist and never logs
the password or changes an existing user's password.

For a local demo, create the development login user with the existing helper
instead:

```powershell
python seed_user.py
```

The presentation seed script adds idempotent demo flags, rules, memberships,
versions, and audit records to the expected existing environments:

```powershell
python scripts/seed_demo_data.py
```

The demo seed is optional, separate from admin bootstrap, and should only be
run when demo environments and records are intentionally desired. The local
`admin/admin123` credentials are not production credentials.

## Backend setup and run

From the project root:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The health endpoint is `GET /`. Protected routes use the JWT returned by
`POST /api/auth/login`.

The main API areas are:

- `/api/auth/login`
- `/api/flags` and `/api/evaluate`
- `/api/environment`
- `/api/targeting-rules`
- `/api/audit-logs`
- `/api/analytics/evaluations`
- `/api/flags/cleanup-candidates`

## Frontend setup and run

From `frontend/`:

```powershell
npm install
npm run dev
```

Available validation/build scripts are:

```powershell
npm run lint
npm run build
npm run preview
```

The Vite development server normally runs at `http://localhost:5173`.

## Authentication

The login page submits credentials to `POST /api/auth/login`. The returned JWT
is stored in browser local storage under `flagflow_access_token`. AuthContext
validates the stored token on startup, exposes authentication state and the
username, and clears expired or invalid tokens. Protected dashboard routes are
guarded by the existing React route wrapper; backend protected routes reuse the
JWT dependency. Sign out removes the local token and returns to the landing
page.

## Dashboard modules

- **Overview:** High-level flag, environment, rollout, configuration-health,
  recent-activity, and summary views.
- **Feature Flags:** Search, environment filtering, status filtering,
  pagination, CRUD, enable/disable actions, details, targeting rules, and flag
  deletion.
- **Environments:** Create, edit, search, paginate, and safely delete empty
  environments.
- **Targeting Rules:** Review user, group, and percentage rules by flag and environment, including
  percentage, active state, treatment, priority, and management navigation.
- **Analytics:** Configuration charts, audit activity, and persisted hourly
  evaluation telemetry.
- **Audit Logs:** Filter, paginate, and inspect flag and targeting-rule changes.
- **Settings:** Honest account/session information, sign out, and workspace
  shortcuts; unsupported profile and preference controls are presented as
  unavailable rather than fabricated.

## Testing

Run the complete backend suite from the project root:

```powershell
python -m pytest -q
```

The current suite contains **116 passing tests** with three existing warnings.
It covers authentication, CRUD routes, targeting/evaluation semantics, cache
invalidation, audit logging, analytics counters and flushing, cleanup tooling,
number flags, and the `FlagClient`.

`tests/test_e2e_integration.py` exercises authenticated ASGI routing across
flag configuration, user/group/percentage targeting, evaluation, Redis cache
behavior, analytics persistence/API, audit logs, and the client adapter. These
tests intentionally use isolated in-memory SQLite, `FakeRedis`, and an ASGI
adapter; they do not replace production PostgreSQL/Redis or browser testing.

### Browser E2E tests

Start PostgreSQL, Redis, the backend on `127.0.0.1:8000`, and install the
Playwright browser from `frontend\`:

```powershell
cd frontend
npm install
npx playwright install chromium
npm run test:e2e
```

The E2E suite uses the documented local demo credentials `admin/admin123` by
default. Set `E2E_USERNAME` and `E2E_PASSWORD` to override them. The Vite
server runs on `localhost:5173` and proxies `/api` to the backend.

## Load testing

See [`loadtests/README.md`](loadtests/README.md) for setup, safety, seed data,
workload profiles, and commands. See
[`loadtests/LOAD_TEST_BASELINE.md`](loadtests/LOAD_TEST_BASELINE.md) for the
recorded results.

The completed Locust campaign included:

- cached and varied-context one-user baselines;
- a mixed approximately 75/25 cached-to-varied workload;
- 10-, 25-, and 50-user mixed campaigns;
- zero failures in every completed campaign.

The 50-user campaign was the highest completed test. A 100-user test was
intentionally not performed. Results are specific to the local test
environment and must not be presented as production capacity.

## Demo flow

1. Start PostgreSQL, Redis, the backend, and the Vite frontend.
2. Open the landing page and sign in through the Login flow.
3. Review Overview and create or select an Environment.
4. Create a Feature Flag and inspect its details.
5. Add a user, group, or percentage Targeting Rule and distinguish rule
   activation from its enabled/disabled treatment.
6. Evaluate the flag through the authenticated `POST /api/evaluate` path or
   the existing `FlagClient` helper.
7. Open Targeting Rules and Analytics to show targeting configuration and persisted
   evaluation telemetry when data has been flushed.
8. Open Audit Logs to show the recorded flag and targeting-rule changes.
9. Call the authenticated cleanup-candidates endpoint to review advisory
   candidates without deleting data.
10. Use Settings or the dashboard account action to sign out.

## Known limitations

- Load-test results are local-environment measurements, not production capacity
  guarantees.
- Integration tests use SQLite, fake Redis, and an ASGI adapter rather than
  real production services.
- No browser-level E2E test suite is included.
- SQLAlchemy is configured with `echo=True`, which can add SQL log I/O during
  local performance measurements.
- Explicit SQLAlchemy pool sizing is not configured.
- Redis result caching and analytics counters share the configured Redis
  service.
- Evaluation analytics flushing is separate from request latency and requires
  completed UTC-hour buckets.

## Phase C validation summary

- Backend suite: **116 passed, 3 warnings**.
- Frontend lint: passed.
- Frontend build: passed with the existing Vite chunk-size warning.
- Locust campaign: completed through 50 concurrent users with **0 failures**.
- Phase C load-test documentation: completed in the linked load-test README and
  baseline report.
