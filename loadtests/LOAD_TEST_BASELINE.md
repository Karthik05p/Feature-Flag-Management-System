# Phase C — Load Test Baseline Results

**Project:** Application Feature Management and Release Control System  
**Date:** 2026-09-09  
**Tool:** Locust  
**API:** `http://127.0.0.1:8000`  
**Evaluation endpoint:** `POST /api/evaluate`

## 1. Test Environment

- FastAPI application running with Uvicorn on `127.0.0.1:8000`
- PostgreSQL used by the application
- Redis used for evaluation-result caching
- Dedicated load-test environment: `load-test`
- Locust workload: `loadtests/locustfile.py`
- Authentication performed once during each Locust user startup
- Evaluation requests use JWT Bearer authentication
- Warm-up evaluation is recorded separately as `evaluate - warmup`

## 2. Workload Profiles

The load-test implementation provides three concrete profiles:

1. `CachedEvaluationUser` — repeated evaluation of the same cached context
2. `VariedContextEvaluationUser` — unique user contexts intended to exercise cache-miss evaluation
3. `MixedEvaluationUser` — approximately 75% cached and 25% varied-context requests

The mixed profile uses Locust task weights of 3:1.

---

## 3. Cached Baseline

**Profile:** `CachedEvaluationUser`

| Metric | Result |
|---|---:|
| Evaluation requests | 1,077 |
| Failures | 0 |
| Median (p50) | 19 ms |
| 95th percentile | 28 ms |
| 99th percentile | 40 ms |
| Average | 20.5 ms |
| Minimum | 8 ms |
| Maximum | 149 ms |
| Throughput | 6.5 RPS |

### Interpretation

This establishes the cache-hot baseline for repeated evaluation of the same user context.

---

## 4. Varied-Context Baseline

**Profile:** `VariedContextEvaluationUser`

| Metric | Result |
|---|---:|
| Evaluation requests | 429 |
| Failures | 0 |
| Median (p50) | 32 ms |
| 95th percentile | 45 ms |
| 99th percentile | 58 ms |
| Average | 33.5 ms |
| Minimum | 11 ms |
| Maximum | 95 ms |
| Throughput | 6.2 RPS |

### Interpretation

This profile generates a unique `user_context.user_id` for each evaluation request, producing different evaluation-cache keys and exercising the varied-context path.

---

## 5. Mixed Workload Baseline

**Profile:** `MixedEvaluationUser`

| Metric | Cached | Varied Context | Aggregated |
|---|---:|---:|---:|
| Requests | 431 | 127 | 560 |
| Failures | 0 | 0 | 0 |
| Median (p50) | 20 ms | 31 ms | 21 ms |
| 95th percentile | 29 ms | 44 ms | 38 ms |
| 99th percentile | 39 ms | 52 ms | 45 ms |
| Average | 20.54 ms | 33.05 ms | 24.48 ms |
| Minimum | 13 ms | 19 ms | 13 ms |
| Maximum | 49 ms | 103 ms | 633 ms |
| Throughput | 4.4 RPS | 1.8 RPS | 6.2 RPS |

### Workload distribution

- Cached: 431 / 558 evaluation requests = **77.2%**
- Varied context: 127 / 558 evaluation requests = **22.8%**
- Target distribution: **75% / 25%**

The observed distribution is close to the intended 3:1 workload ratio.

### Important note on maximum latency

The aggregated maximum of **633 ms** corresponds to the one-time `auth - login` request, not an evaluation request. Evaluation-specific maximum latency in this campaign was:

- Cached: 49 ms
- Varied context: 103 ms

---

## 6. Baseline Summary

| Profile | Requests | RPS | p50 | p95 | p99 | Average | Failures |
|---|---:|---:|---:|---:|---:|---:|---:|
| Cached | 1,077 | 6.5 | 19 ms | 28 ms | 40 ms | 20.5 ms | 0% |
| Varied Context | 429 | 6.2 | 32 ms | 45 ms | 58 ms | 33.5 ms | 0% |
| Mixed 75/25 | 558 eval. | 6.2 | 21 ms | 38 ms | 45 ms | 24.48 ms | 0% |

## 7. Baseline Conclusion

The baseline campaign completed successfully with **0% failures across all three workload profiles**.

The results show:

- Cache-hot evaluation is the fastest path, with a median of **19 ms**.
- Varied-context evaluation has higher latency, with a median of **32 ms**, as expected for a workload that does not repeatedly reuse the same evaluation-cache key.
- The mixed workload produced approximately the intended **75/25 cached-to-varied distribution**.
- Evaluation latency remained below **60 ms at p99** for the dedicated cached and varied-context campaigns.
- The baseline provides a reference point for subsequent concurrency/stress campaigns.

## 8. Concurrency and Stress Results

The following `MixedEvaluationUser` campaigns increased concurrency while using
the same dedicated load-test environment and seed data. Evaluation requests are
shown separately from the one-time login and warm-up requests (two per Locust
user).

| Users | Evaluation requests | Total requests | RPS | p50 | p95 | p99 | Average | Failures |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 558 | 560 | 6.2 | 21 ms | 38 ms | 45 ms | 24.48 ms | 0 |
| 10 | 6,484 | 6,504 | 54.2 | 46 ms | 130 ms | 220 ms | 57.55 ms | 0 |
| 25 | 9,236 | 9,286 | 76.8 | 180 ms | 370 ms | 450 ms | 192.44 ms | 0 |
| 50 | 10,503 | 10,603 | 83.7 | 450 ms | 730 ms | 940 ms | 446.14 ms | 0 |

The 10-user campaign produced 4,832 cached and 1,652 varied-context
evaluations (approximately 74.5% / 25.5%). The 25-user campaign produced
6,920 cached and 2,316 varied-context evaluations (approximately 74.9% /
25.1%). The 50-user campaign produced 7,925 cached and 2,578 varied-context
evaluations (approximately 75.4% / 24.6%). All campaigns had zero failures.

Evaluation throughput increased from 6.2 RPS at one user to 83.7 RPS at 50
users, while latency rose substantially under concurrency. At 50 users,
evaluation p95 reached 730 ms and p99 reached 940 ms; cached p95/p99 were
650/910 ms and varied-context p95/p99 were 810/1,000 ms. The 50-user run was
the highest completed campaign. These measurements describe this local test
environment only and are not a claim that the system supports exactly 50
production users.

## 9. Campaign Conclusion

The completed campaign covered 1, 10, 25, and 50 users with
`MixedEvaluationUser`. No 100-user campaign was performed. Results must not be
presented as production capacity: they are specific to the local machine,
application configuration, PostgreSQL, Redis, and network path used during the
campaign.
