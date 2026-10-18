import asyncio
from datetime import datetime, timedelta, timezone
import logging

from app.cache.redis_client import redis_client
from app.database.session import SessionLocal
from app.services.evaluation_analytics_flush import flush_completed_buckets


logger = logging.getLogger(__name__)


def seconds_until_next_utc_day(now: datetime | None = None) -> float:
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    current = current.astimezone(timezone.utc)
    next_day = (current + timedelta(days=1)).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    return max((next_day - current).total_seconds(), 0.0)


def run_analytics_flush() -> int | None:
    """Flush completed analytics buckets using a short-lived database session."""

    db = SessionLocal()
    try:
        return flush_completed_buckets(db, redis_client)
    except Exception:
        logger.exception("Scheduled evaluation analytics flush failed")
        return None
    finally:
        db.close()


async def analytics_flush_loop() -> None:
    """Run the analytics flush once at the start of each UTC day."""

    while True:
        await asyncio.sleep(seconds_until_next_utc_day())
        run_analytics_flush()
