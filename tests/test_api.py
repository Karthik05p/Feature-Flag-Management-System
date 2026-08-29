from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_flag_versions():
    response = client.get("/flags/3/versions")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)


def test_invalid_flag_versions():
    response = client.get("/flags/999999/versions")

    assert response.status_code == 404


def test_invalid_rollback_version():
    response = client.post(
        "/flags/3/rollback/999999"
    )

    assert response.status_code == 404
