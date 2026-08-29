from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_environments():
    response = client.get("/environments")
    assert response.status_code == 200


def test_get_existing_environment():
    response = client.get("/environments/1")
    assert response.status_code == 200


def test_get_invalid_environment():
    response = client.get("/environments/999999")
    assert response.status_code == 404
