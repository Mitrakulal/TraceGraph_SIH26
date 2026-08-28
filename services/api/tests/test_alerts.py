"""Contract tests for Alert List and Alert Detail API endpoints."""

def test_alert_list_default(client):
    """Test default request to GET /api/v1/alerts."""
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    data = response.json().get("data", {})
    assert data["page"] == 1
    assert data["page_size"] == 25
    assert data["total"] == 250
    assert len(data["items"]) == 25

    item = data["items"][0]
    assert "alert_id" in item
    assert "event_id" in item
    assert "observed_at" in item
    assert "source_wallet" in item
    assert "target_wallet" in item
    assert "risk_score" in item
    assert "ml_probability" in item
    assert "novelty_score" in item
    assert "graph_risk_score" in item
    assert "baseline_score" in item
    assert "priority_band" in item
    assert "review_state" in item
    assert "top_reason" in item
    assert "synthetic_notice" in item
    assert item["synthetic_notice"] == "Synthetic evidence only. Human review required."


def test_alert_list_pagination(client):
    """Test pagination parameter page=2."""
    response_p1 = client.get("/api/v1/alerts?page=1&page_size=10")
    response_p2 = client.get("/api/v1/alerts?page=2&page_size=10")
    assert response_p1.status_code == 200
    assert response_p2.status_code == 200

    items_p1 = response_p1.json()["data"]["items"]
    items_p2 = response_p2.json()["data"]["items"]
    assert len(items_p1) == 10
    assert len(items_p2) == 10
    assert items_p1[0]["alert_id"] != items_p2[0]["alert_id"]


def test_alert_list_max_page_size(client):
    """Test maximum allowed page_size=100."""
    response = client.get("/api/v1/alerts?page_size=100")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["page_size"] == 100
    assert len(data["items"]) == 100


def test_alert_list_invalid_page_size(client):
    """Test page_size > 100 returns 422."""
    response = client.get("/api/v1/alerts?page_size=101")
    assert response.status_code == 422
    err = response.json().get("error", {})
    assert err["code"] == "INVALID_PARAMETER"


def test_alert_list_invalid_page(client):
    """Test page=0 returns 422."""
    response = client.get("/api/v1/alerts?page=0")
    assert response.status_code == 422


def test_alert_list_min_risk_filter(client):
    """Test filtering by min_risk=90."""
    response = client.get("/api/v1/alerts?min_risk=90")
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    for item in items:
        assert item["risk_score"] >= 90


def test_alert_list_invalid_min_risk(client):
    """Test min_risk outside 0-100 returns 422."""
    response = client.get("/api/v1/alerts?min_risk=105")
    assert response.status_code == 422


def test_alert_list_review_state_filter(client):
    """Test review_state filtering."""
    res_unreviewed = client.get("/api/v1/alerts?review_state=UNREVIEWED")
    assert res_unreviewed.status_code == 200

    res_invalid = client.get("/api/v1/alerts?review_state=INVALID_STATE")
    assert res_invalid.status_code == 422


def test_alert_list_scenario_key_filter(client):
    """Test scenario_key validation."""
    res_valid = client.get("/api/v1/alerts?scenario_key=rapid_hop")
    assert res_valid.status_code == 200

    res_invalid = client.get("/api/v1/alerts?scenario_key=INVALID_SCENARIO")
    assert res_invalid.status_code == 422


def test_alert_list_sort(client):
    """Test sort parameter."""
    res_risk = client.get("/api/v1/alerts?sort=RISK_DESC")
    assert res_risk.status_code == 200
    items_risk = res_risk.json()["data"]["items"]
    risks = [item["risk_score"] for item in items_risk]
    assert risks == sorted(risks, reverse=True)

    res_time = client.get("/api/v1/alerts?sort=TIME_DESC")
    assert res_time.status_code == 200

    res_invalid = client.get("/api/v1/alerts?sort=INVALID_SORT")
    assert res_invalid.status_code == 422


def test_alert_list_forbidden_fields_absent(client):
    """Verify evaluator ground truth fields are absent from alert list."""
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    for item in items:
        assert "is_anomalous" not in item
        assert "scenario_truth_hidden" not in item
        assert "severity_truth" not in item
        assert "scenario_id" not in item
        assert "truth" not in item


def test_alert_detail_valid(client):
    """Test GET /api/v1/alerts/:alertId with a valid alert ID."""
    list_res = client.get("/api/v1/alerts?page_size=1")
    alert_id = list_res.json()["data"]["items"][0]["alert_id"]

    response = client.get(f"/api/v1/alerts/{alert_id}")
    assert response.status_code == 200
    data = response.json()["data"]

    assert "alert" in data
    assert "rule_hits" in data
    assert "evidence" in data
    assert "linked_entity_ids" in data
    assert "review_history" in data

    alert = data["alert"]
    assert alert["alert_id"] == alert_id
    assert alert["synthetic_notice"] == "Synthetic evidence only. Human review required."

    evidence = data["evidence"]
    assert len(evidence) == 5
    for ev in evidence:
        assert "evidence_id" in ev
        assert "feature" in ev
        assert "feature_value" in ev
        assert "shap_value" in ev
        assert ev["direction"] in ["INCREASED_RISK", "DECREASED_RISK"]
        assert "message" in ev


def test_alert_detail_unknown_id(client):
    """Test GET /api/v1/alerts/:alertId with an unknown alert ID returns 404."""
    response = client.get("/api/v1/alerts/alt_NONEXISTENT_99999")
    assert response.status_code == 404
    err = response.json().get("error", {})
    assert err["code"] == "ALERT_NOT_FOUND"


def test_alert_detail_forbidden_fields_absent(client):
    """Verify evaluator ground truth fields are absent from alert detail."""
    list_res = client.get("/api/v1/alerts?page_size=1")
    alert_id = list_res.json()["data"]["items"][0]["alert_id"]

    response = client.get(f"/api/v1/alerts/{alert_id}")
    content_str = response.text
    assert "scenario_truth_hidden" not in content_str
    assert "is_anomalous" not in content_str
    assert "severity_truth" not in content_str
