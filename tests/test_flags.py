from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_flag():
    body = {
        "environment_id": 1,
        "key": "pytest_flag",
        "type": "boolean",
        "default_value": "false",
        "enabled": False,
        "description": "Pytest flag",
        "owner_team": "backend"
    }

    response = client.post("/flags", json=body)

    assert response.status_code == 201

    data = response.json()

    assert data["key"] == "pytest_flag"

    flag_id = data["id"]
    delete_response = client.delete(f"/flags/{flag_id}")

    assert delete_response.status_code == 204
