from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_targeting_endpoint_exists():
    response = client.get("/targeting")
    assert response.status_code != 404


def test_invalid_targeting_request():
    response = client.get("/targeting/999999")
    assert response.status_code == 200
    assert response.json() == []


def test_create_targeting_rule():
    response = client.post(
        "/targeting",
        json={
            "flag_id": 1,
            "attribute": "country",
            "operator": "equals",
            "value": "IN",
            "priority": 1
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["flag_id"] == 1
    assert data["attribute"] == "country"
    assert data["operator"] == "equals"
    assert data["value"] == "IN"
    assert data["priority"] == 1


def test_get_targeting_rules():
    response = client.get("/targeting/1")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
