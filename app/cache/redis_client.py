import redis
from redis.backoff import NoBackoff
from redis.retry import Retry

from app.database.config import settings


def create_redis_client(config=settings):
    connection_options = {
        "db": 0,
        "decode_responses": True,
        "socket_connect_timeout": config.REDIS_SOCKET_CONNECT_TIMEOUT,
        "socket_timeout": config.REDIS_SOCKET_TIMEOUT,
        "retry": Retry(NoBackoff(), retries=config.REDIS_RETRIES),
    }
    if config.REDIS_URL:
        return redis.Redis.from_url(config.REDIS_URL, **connection_options)
    return redis.Redis(
        host=config.REDIS_HOST,
        port=config.REDIS_PORT,
        **connection_options,
    )


redis_client = create_redis_client()
