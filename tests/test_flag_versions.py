from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_flag_versions():
    response = client.get("/flags/1/versions")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)


def test_get_versions_for_invalid_flag():
    response = client.get("/flags/999999/versions")

    assert response.status_code == 404
