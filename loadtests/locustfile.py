"""Locust workload for the authenticated feature-flag evaluation API.

Run this against a dedicated Uvicorn/PostgreSQL/Redis environment.  The
workload deliberately uses the public HTTP API and does not import application
internals.
"""

from __future__ import annotations

import os
from uuid import uuid4

from locust import HttpUser, between, task
from locust.exception import StopUser


def _required_setting(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if not value:
        raise RuntimeError(f"Missing load-test setting: {name}")
    return value


class AuthenticatedEvaluationUser(HttpUser):
    """Shared login and evaluation helpers for all workload profiles."""

    abstract = True
    wait_time = between(0.05, 0.2)

    def on_start(self):
        self.environment_name = os.getenv("LOAD_TEST_ENVIRONMENT", "load-test")
        self.cached_flag = os.getenv("LOAD_TEST_CACHED_FLAG", "load_cached")
        self.varied_flag = os.getenv("LOAD_TEST_VARIED_FLAG", "load_user_targeted")
        username = _required_setting("LOAD_TEST_USERNAME", "loadtest")
        password = _required_setting("LOAD_TEST_PASSWORD", "loadtest-password")

        with self.client.post(
            "/api/auth/login",
            json={"username": username, "password": password},
            name="auth - login",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(f"authentication failed with HTTP {response.status_code}")
                raise StopUser()
            try:
                payload = response.json()
                token = payload["access_token"]
            except (ValueError, KeyError, TypeError):
                response.failure("authentication response did not contain an access token")
                raise StopUser()
            if not isinstance(token, str) or not token:
                response.failure("authentication response contained an invalid access token")
                raise StopUser()

        self.headers = {"Authorization": f"Bearer {token}"}
        self._varied_sequence = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self._warm_cache()

    def _payload(self, flag_key: str, user_id: str) -> dict:
        return {
            "flag_key": flag_key,
            "environment_name": self.environment_name,
            "user_context": {"user_id": user_id},
        }

    def _warm_cache(self):
        # The warm-up is reported separately and excluded from cached-result
        # measurements. It also validates that the seeded data is reachable.
        with self.client.post(
            "/api/evaluate",
            json=self._payload(self.cached_flag, "loadtest-cached-user"),
            headers=self.headers,
            name="evaluate - warmup",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(f"warm-up failed with HTTP {response.status_code}")
                return
            try:
                payload = response.json()
            except ValueError:
                response.failure("warm-up returned invalid JSON")
                return
            if payload.get("success") is not True:
                response.failure("warm-up evaluation was unsuccessful")

    def _evaluate_cached(self):
        with self.client.post(
            "/api/evaluate",
            json=self._payload(self.cached_flag, "loadtest-cached-user"),
            headers=self.headers,
            name="evaluate - cached",
            catch_response=True,
        ) as response:
            self._validate_evaluation_response(response, classify_cache=True)

    def _evaluate_varied(self):
        self._varied_sequence += 1
        user_id = f"loadtest-varied-{id(self)}-{self._varied_sequence}-{uuid4().hex}"
        with self.client.post(
            "/api/evaluate",
            json=self._payload(self.varied_flag, user_id),
            headers=self.headers,
            name="evaluate - varied-context",
            catch_response=True,
        ) as response:
            self._validate_evaluation_response(response)

    def _validate_evaluation_response(self, response, classify_cache=False):
        if response.status_code != 200:
            response.failure(f"evaluation failed with HTTP {response.status_code}")
            return
        try:
            payload = response.json()
        except ValueError:
            response.failure("evaluation returned invalid JSON")
            return
        if payload.get("success") is not True:
            response.failure("evaluation returned success=false")
        elif classify_cache:
            # The API exposes this classification in its existing response
            # message; no application instrumentation is added for the test.
            if payload.get("message") == "Returned From Redis Cache":
                self.cache_hits += 1
            else:
                self.cache_misses += 1


class CachedEvaluationUser(AuthenticatedEvaluationUser):
    """100% repeated cached evaluation workload."""

    @task
    def cached_evaluation(self):
        self._evaluate_cached()


class VariedContextEvaluationUser(AuthenticatedEvaluationUser):
    """100% varied-context/cache-miss-oriented workload."""

    @task
    def varied_context_evaluation(self):
        self._evaluate_varied()


class MixedEvaluationUser(AuthenticatedEvaluationUser):
    """Approximately 75% cached and 25% varied-context evaluations."""

    @task(3)
    def cached_evaluation(self):
        self._evaluate_cached()

    @task(1)
    def varied_context_evaluation(self):
        self._evaluate_varied()
