from datetime import datetime, timezone

from sqlalchemy.exc import SQLAlchemyError

from app.services import evaluation_analytics_scheduler as scheduler


class TrackingSession:
    def __init__(self):
        self.closed = False

    def close(self):
        self.closed = True


def test_seconds_until_next_utc_day():
    now = datetime(2026, 8, 29, 23, 59, 30, tzinfo=timezone.utc)

    assert scheduler.seconds_until_next_utc_day(now) == 30


def test_run_analytics_flush_creates_and_closes_session(monkeypatch):
    session = TrackingSession()
    monkeypatch.setattr(scheduler, "SessionLocal", lambda: session)
    monkeypatch.setattr(
        scheduler,
        "flush_completed_buckets",
        lambda db, redis: 3,
    )

    assert scheduler.run_analytics_flush() == 3
    assert session.closed is True


def test_run_analytics_flush_logs_failure_and_closes_session(monkeypatch, caplog):
    session = TrackingSession()
    monkeypatch.setattr(scheduler, "SessionLocal", lambda: session)

    def fail_flush(db, redis):
        raise SQLAlchemyError("database unavailable")

    monkeypatch.setattr(scheduler, "flush_completed_buckets", fail_flush)

    with caplog.at_level("ERROR", logger="app.services.evaluation_analytics_scheduler"):
        assert scheduler.run_analytics_flush() is None

    assert session.closed is True
    assert "Scheduled evaluation analytics flush failed" in caplog.text
