from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_enabled_flag_evaluation():
    response = client.get(
        "/evaluate/development/new_dashboard"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["key"] == "new_dashboard"
    assert data["enabled"] is True
    assert data["value"] == "false"


def test_disabled_flag_evaluation():
    response = client.get(
        "/evaluate/development/dark_mode"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["key"] == "dark_mode"
    assert data["enabled"] is False
    assert data["value"] == "false"


def test_invalid_flag_evaluation():
    response = client.get(
        "/evaluate/development/does_not_exist"
    )

    assert response.status_code == 404


def test_invalid_environment_evaluation():
    response = client.get(
        "/evaluate/does_not_exist/new_dashboard"
    )

    assert response.status_code == 404
