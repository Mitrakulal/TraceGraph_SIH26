"""Tests for synthetic 1K stream endpoint."""

import pytest


def test_get_stream_events_returns_1k_with_70_30_ratio(client):
    response = client.get("/api/v1/stream/events?limit=1000")
    assert response.status_code == 200
    data = response.json()["data"]

    assert data["total_events"] == 1000
    assert data["normal_count"] == 700
    assert data["anomaly_count"] == 300
    assert data["data_classification"] == "SYNTHETIC_ONLY"
    assert len(data["events"]) == 1000

    # Verify event structure
    first = data["events"][0]
    assert first["event_id"].startswith("syn_evt_")
    assert first["source_wallet"].startswith("syn_w_")
    assert first["target_wallet"].startswith("syn_w_")
    assert "amount_log" in first
    assert "is_scenario_anomaly" in first

