from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_country_targeting_non_match():
    response = client.post(
        "/evaluate/development/new_dashboard",
        json={
            "country": "US"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["key"] == "new_dashboard"
    assert data["enabled"] is False
