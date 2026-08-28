"""Contract tests for Demo Scenarios and Demo Activate API endpoints."""


def test_list_scenarios_returns_eight_entries(client):
    """GET /api/v1/demo/scenarios must return exactly 8 scenario items."""
    response = client.get("/api/v1/demo/scenarios")
    assert response.status_code == 200
    data = response.json()["data"]
    assert "items" in data
    assert len(data["items"]) == 8


def test_list_scenarios_required_fields(client):
    """Every scenario item must have the required contract fields."""
    response = client.get("/api/v1/demo/scenarios")
    items = response.json()["data"]["items"]
    required = {"scenario_key", "display_name", "description", "expected_review_band", "available"}
    for item in items:
        for field in required:
            assert field in item, f"Missing field '{field}' in scenario item: {item}"


def test_list_scenarios_valid_bands(client):
    """expected_review_band must be REVIEW_PRIORITY or LOW_PRIORITY."""
    response = client.get("/api/v1/demo/scenarios")
    items = response.json()["data"]["items"]
    valid_bands = {"REVIEW_PRIORITY", "LOW_PRIORITY"}
    for item in items:
        assert item["expected_review_band"] in valid_bands, (
            f"Invalid band: {item['expected_review_band']!r}"
        )


def test_list_scenarios_normal_is_low_priority(client):
    """The 'normal' scenario must be LOW_PRIORITY as stated in spec."""
    response = client.get("/api/v1/demo/scenarios")
    items = response.json()["data"]["items"]
    normal = next((s for s in items if s["scenario_key"] == "normal"), None)
    assert normal is not None, "Scenario key 'normal' not found."
    assert normal["expected_review_band"] == "LOW_PRIORITY"


def test_list_scenarios_rapid_hop_is_review_priority(client):
    """The 'rapid_hop' scenario must be REVIEW_PRIORITY."""
    response = client.get("/api/v1/demo/scenarios")
    items = response.json()["data"]["items"]
    rapid_hop = next((s for s in items if s["scenario_key"] == "rapid_hop"), None)
    assert rapid_hop is not None, "Scenario key 'rapid_hop' not found."
    assert rapid_hop["expected_review_band"] == "REVIEW_PRIORITY"


def test_list_scenarios_all_keys_are_allowed(client):
    """All returned scenario_key values must be from the spec-allowed set."""
    allowed = {
        "normal", "structuring", "peel_chain", "rapid_hop",
        "fan_out", "fan_in", "ip_rotation", "source_port_shift",
    }
    response = client.get("/api/v1/demo/scenarios")
    items = response.json()["data"]["items"]
    for item in items:
        assert item["scenario_key"] in allowed, (
            f"Unexpected scenario_key: {item['scenario_key']!r}"
        )


def test_activate_valid_scenario(client):
    """POST /api/v1/demo/activate with rapid_hop returns READY status."""
    response = client.post("/api/v1/demo/activate", json={"scenario_key": "rapid_hop"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["scenario_key"] == "rapid_hop"
    assert data["status"] == "READY"
    assert "demo_session_id" in data
    assert data["demo_session_id"].startswith("demo_")
    assert "run_id" in data
    assert "message" in data


def test_activate_normal_scenario(client):
    """POST /api/v1/demo/activate with normal scenario works."""
    response = client.post("/api/v1/demo/activate", json={"scenario_key": "normal"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["scenario_key"] == "normal"
    assert data["status"] == "READY"


def test_activate_returns_featured_alert_id(client):
    """Activate response should include a featured_alert_id from the current run."""
    response = client.post("/api/v1/demo/activate", json={"scenario_key": "rapid_hop"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data.get("featured_alert_id") is not None
    assert data["featured_alert_id"].startswith("alt_")


def test_activate_invalid_scenario_key(client):
    """Invalid scenario_key must return 422 INVALID_SCENARIO_KEY."""
    response = client.post("/api/v1/demo/activate", json={"scenario_key": "real_data"})
    assert response.status_code == 422
    err = response.json().get("error", {})
    assert err["code"] == "INVALID_SCENARIO_KEY"


def test_activate_missing_body(client):
    """Missing request body must return a 422 validation error."""
    response = client.post("/api/v1/demo/activate", json={})
    assert response.status_code == 422


def test_activate_each_session_has_unique_id(client):
    """Two activate calls must produce distinct demo_session_ids."""
    r1 = client.post("/api/v1/demo/activate", json={"scenario_key": "fan_out"})
    r2 = client.post("/api/v1/demo/activate", json={"scenario_key": "fan_out"})
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["data"]["demo_session_id"] != r2.json()["data"]["demo_session_id"]
