"""Tests for system status, dashboard summary, and shared error format."""

def test_status_endpoint(client):
    """Test GET /api/v1/status."""
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    data = response.json().get("data", {})
    assert data["service"] == "tracegraph-api"
    assert data["mode"] == "OFFLINE_SYNTHETIC_ONLY"
    assert data["current_run_id"] == "sih26146-cpu-demo-2026-v1"
    assert data["model_ready"] is True
    assert data["api_version"] == "v1"


def test_dashboard_summary_endpoint(client):
    """Test GET /api/v1/dashboard/summary."""
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json().get("data", {})
    assert data["run_id"] == "sih26146-cpu-demo-2026-v1"
    assert data["data_classification"] == "SYNTHETIC_ONLY"
    assert data["total_events"] == 60000
    assert data["total_alerts"] == 250
    assert data["review_priority_count"] == 250
    assert data["evidence_record_count"] == 1250
    assert data["risk_threshold"] == 65
    assert data["scenario_count"] == 8


def test_error_structure(client):
    """Test shared error response format for 404 endpoints."""
    response = client.get("/api/v1/unknown_route")
    assert response.status_code == 404
    payload = response.json()
    assert "error" in payload
    err = payload["error"]
    assert "code" in err
    assert "message" in err
    assert "request_id" in err
    assert err["request_id"].startswith("req_")
