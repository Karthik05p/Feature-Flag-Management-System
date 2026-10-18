from pathlib import Path


DOCKERFILE = Path(__file__).parents[1] / "Dockerfile"


def test_backend_docker_startup_uses_railway_port_with_local_fallback():
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")

    assert "--host 0.0.0.0" in dockerfile
    assert "--port ${PORT:-8000}" in dockerfile
