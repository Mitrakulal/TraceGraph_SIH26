"""Contract tests for Graph Explorer API endpoint."""

def test_graph_valid_entity(client):
    """Test GET /api/v1/graph/entities/:entityId with a known entity ID."""
    # Obtain an entity ID from alert list
    list_res = client.get("/api/v1/alerts?page_size=1")
    entity_id = list_res.json()["data"]["items"][0]["source_wallet"]

    response = client.get(f"/api/v1/graph/entities/{entity_id}")
    assert response.status_code == 200
    data = response.json().get("data", {})

    assert data["focus_entity_id"] == entity_id
    assert "nodes" in data
    assert "edges" in data
    assert "summary" in data
    assert "synthetic_notice" in data
    assert data["synthetic_notice"] == "Synthetic relationship graph only. Human review required."

    nodes = data["nodes"]
    assert len(nodes) > 0
    focus_nodes = [n for n in nodes if n["is_focus"]]
    assert len(focus_nodes) == 1
    assert focus_nodes[0]["id"] == entity_id

    summary = data["summary"]
    assert summary["node_count"] == len(nodes)
    assert summary["edge_count"] == len(data["edges"])
    assert "truncated" in summary


def test_graph_depth_parameters(client):
    """Test depth=1 vs depth=2 parameters."""
    list_res = client.get("/api/v1/alerts?page_size=1")
    entity_id = list_res.json()["data"]["items"][0]["source_wallet"]

    res_d1 = client.get(f"/api/v1/graph/entities/{entity_id}?depth=1")
    res_d2 = client.get(f"/api/v1/graph/entities/{entity_id}?depth=2")
    assert res_d1.status_code == 200
    assert res_d2.status_code == 200

    nodes_d1 = res_d1.json()["data"]["nodes"]
    nodes_d2 = res_d2.json()["data"]["nodes"]
    assert len(nodes_d2) >= len(nodes_d1)


def test_graph_invalid_depth(client):
    """Test depth > 2 returns 422 validation error."""
    response = client.get("/api/v1/graph/entities/syn_w_0000000000001770?depth=3")
    assert response.status_code == 422

    response_zero = client.get("/api/v1/graph/entities/syn_w_0000000000001770?depth=0")
    assert response_zero.status_code == 422


def test_graph_limit_parameters(client):
    """Test limit parameters."""
    list_res = client.get("/api/v1/alerts?page_size=1")
    entity_id = list_res.json()["data"]["items"][0]["source_wallet"]

    res_l5 = client.get(f"/api/v1/graph/entities/{entity_id}?limit=5")
    assert res_l5.status_code == 200
    data_l5 = res_l5.json()["data"]
    assert len(data_l5["nodes"]) <= 5


def test_graph_invalid_limit(client):
    """Test limit > 120 returns 422 validation error."""
    response = client.get("/api/v1/graph/entities/syn_w_0000000000001770?limit=121")
    assert response.status_code == 422

    response_zero = client.get("/api/v1/graph/entities/syn_w_0000000000001770?limit=0")
    assert response_zero.status_code == 422


def test_graph_unknown_entity(client):
    """Test GET /api/v1/graph/entities/:entityId with an unknown entity ID returns 404."""
    response = client.get("/api/v1/graph/entities/syn_w_NONEXISTENT_99999")
    assert response.status_code == 404
    err = response.json().get("error", {})
    assert err["code"] == "ENTITY_NOT_FOUND"


def test_graph_forbidden_fields_absent(client):
    """Verify evaluator ground truth fields are absent from graph responses."""
    list_res = client.get("/api/v1/alerts?page_size=1")
    entity_id = list_res.json()["data"]["items"][0]["source_wallet"]

    response = client.get(f"/api/v1/graph/entities/{entity_id}")
    content_str = response.text
    assert "scenario_truth_hidden" not in content_str
    assert "is_anomalous" not in content_str
    assert "severity_truth" not in content_str
