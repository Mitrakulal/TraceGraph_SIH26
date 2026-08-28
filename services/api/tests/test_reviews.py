"""Contract tests for POST /api/v1/alerts/{alertId}/reviews endpoint."""

import pytest


@pytest.fixture
def first_alert_id(client) -> str:
    """Return the alert_id of the first alert in the queue."""
    response = client.get("/api/v1/alerts?page_size=1")
    assert response.status_code == 200
    return response.json()["data"]["items"][0]["alert_id"]


class TestReviewHappyPath:
    """Valid review decisions are persisted and returned correctly."""

    def test_reviewed_decision(self, client, first_alert_id):
        """POST REVIEWED decision returns 200 with correct review_state."""
        response = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"decision": "REVIEWED"},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["alert_id"] == first_alert_id
        assert data["review_state"] == "REVIEWED"

    def test_dismissed_decision(self, client, first_alert_id):
        """POST DISMISSED decision returns 200."""
        response = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"decision": "DISMISSED"},
        )
        assert response.status_code == 200
        assert response.json()["data"]["review_state"] == "DISMISSED"

    def test_escalated_decision(self, client, first_alert_id):
        """POST ESCALATED decision returns 200."""
        response = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"decision": "ESCALATED"},
        )
        assert response.status_code == 200
        assert response.json()["data"]["review_state"] == "ESCALATED"

    def test_latest_review_fields(self, client, first_alert_id):
        """latest_review block must contain all required spec Section 6.9 fields."""
        response = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"decision": "REVIEWED", "note": "Synthetic rapid-hop reviewed during judge demo."},
        )
        assert response.status_code == 200
        latest = response.json()["data"]["latest_review"]
        assert "review_id" in latest
        assert "decision" in latest
        assert "reviewed_at" in latest
        assert latest["review_id"].startswith("rev_")
        assert latest["decision"] == "REVIEWED"

    def test_review_with_note(self, client, first_alert_id):
        """A note is stored and returned correctly."""
        note = "Reviewed during judge demonstration."
        response = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"decision": "REVIEWED", "note": note},
        )
        assert response.status_code == 200
        latest = response.json()["data"]["latest_review"]
        assert latest["note"] == note

    def test_review_without_note(self, client, first_alert_id):
        """A review with no note is accepted; note field is null."""
        response = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"decision": "DISMISSED"},
        )
        assert response.status_code == 200
        latest = response.json()["data"]["latest_review"]
        assert latest.get("note") is None

    def test_each_review_has_unique_id(self, client, first_alert_id):
        """Two reviews on the same alert must have distinct review_ids."""
        r1 = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"decision": "REVIEWED"},
        )
        r2 = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"decision": "DISMISSED"},
        )
        id1 = r1.json()["data"]["latest_review"]["review_id"]
        id2 = r2.json()["data"]["latest_review"]["review_id"]
        assert id1 != id2


class TestReviewValidation:
    """Invalid inputs to the review endpoint are correctly rejected."""

    def test_invalid_decision_returns_422(self, client, first_alert_id):
        """An unknown decision value must return 422."""
        response = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"decision": "APPROVE"},
        )
        assert response.status_code == 422

    def test_unknown_alert_id_returns_404(self, client):
        """A nonexistent alertId must return 404 ALERT_NOT_FOUND."""
        response = client.post(
            "/api/v1/alerts/alt_99999_nonexistent/reviews",
            json={"decision": "REVIEWED"},
        )
        assert response.status_code == 404
        err = response.json().get("error", {})
        assert err["code"] == "ALERT_NOT_FOUND"

    def test_note_exceeding_500_chars_returns_422(self, client, first_alert_id):
        """A note longer than 500 characters must return 422."""
        long_note = "x" * 501
        response = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"decision": "REVIEWED", "note": long_note},
        )
        assert response.status_code == 422

    def test_missing_decision_returns_422(self, client, first_alert_id):
        """Missing decision field must return 422."""
        response = client.post(
            f"/api/v1/alerts/{first_alert_id}/reviews",
            json={"note": "No decision provided."},
        )
        assert response.status_code == 422
