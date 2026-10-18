from app.cache.redis_client import create_redis_client, redis_client
from app.database.config import settings


def test_redis_client_uses_bounded_configuration():
    connection_kwargs = redis_client.connection_pool.connection_kwargs
    retry = connection_kwargs["retry"]

    assert connection_kwargs["host"] == settings.REDIS_HOST
    assert connection_kwargs["port"] == settings.REDIS_PORT
    assert connection_kwargs["socket_connect_timeout"] == settings.REDIS_SOCKET_CONNECT_TIMEOUT
    assert connection_kwargs["socket_timeout"] == settings.REDIS_SOCKET_TIMEOUT
    assert retry._retries == settings.REDIS_RETRIES
    assert connection_kwargs["retry_on_error"] == []


def test_redis_client_supports_url_configuration():
    config = settings.model_copy(
        update={
            "REDIS_URL": "rediss://:secret@example.test:6380/2",
            "REDIS_HOST": "ignored.example.test",
            "REDIS_PORT": 6390,
        }
    )

    client = create_redis_client(config)
    connection_kwargs = client.connection_pool.connection_kwargs

    assert connection_kwargs["host"] == "example.test"
    assert connection_kwargs["port"] == 6380
    assert connection_kwargs["db"] == 2
    assert connection_kwargs["password"] == "secret"
    assert client.connection_pool.connection_class.__name__ == "SSLConnection"
    assert connection_kwargs["socket_connect_timeout"] == settings.REDIS_SOCKET_CONNECT_TIMEOUT
    assert connection_kwargs["socket_timeout"] == settings.REDIS_SOCKET_TIMEOUT
