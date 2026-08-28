"""Contract tests for GET /api/v1/model/current endpoint."""


def test_model_current_status_200(client):
    """GET /api/v1/model/current returns HTTP 200."""
    response = client.get("/api/v1/model/current")
    assert response.status_code == 200


def test_model_current_required_fields(client):
    """Response must include all spec Section 6.8 required fields."""
    response = client.get("/api/v1/model/current")
    data = response.json()["data"]
    required = {
        "run_id",
        "dataset_version",
        "data_classification",
        "models",
        "feature_count",
        "risk_threshold",
        "metrics",
        "artifact_status",
        "limitation",
    }
    for field in required:
        assert field in data, f"Missing required field '{field}' in model/current response."


def test_model_current_data_classification(client):
    """data_classification must always be SYNTHETIC_ONLY."""
    response = client.get("/api/v1/model/current")
    data = response.json()["data"]
    assert data["data_classification"] == "SYNTHETIC_ONLY"


def test_model_current_run_id(client):
    """run_id must be the committed demo run identifier."""
    response = client.get("/api/v1/model/current")
    data = response.json()["data"]
    assert data["run_id"] == "sih26146-cpu-demo-2026-v1"


def test_model_current_artifact_status_ready(client):
    """artifact_status must be READY when artifacts are loaded."""
    response = client.get("/api/v1/model/current")
    data = response.json()["data"]
    assert data["artifact_status"] == "READY"


def test_model_current_feature_count(client):
    """feature_count must be 18 (the trained model's exact feature count)."""
    response = client.get("/api/v1/model/current")
    data = response.json()["data"]
    assert data["feature_count"] == 18


def test_model_current_risk_threshold(client):
    """risk_threshold must be 65 (the operating threshold from the spec)."""
    response = client.get("/api/v1/model/current")
    data = response.json()["data"]
    assert data["risk_threshold"] == 65


def test_model_current_metrics_fields(client):
    """metrics block must contain the three required numeric metrics."""
    response = client.get("/api/v1/model/current")
    metrics = response.json()["data"]["metrics"]
    assert "test_pr_auc" in metrics
    assert "test_f1" in metrics
    assert "test_false_positives_per_1000" in metrics

    # Values must be numeric and in reasonable ranges
    assert 0.0 <= metrics["test_pr_auc"] <= 1.0
    assert 0.0 <= metrics["test_f1"] <= 1.0
    assert metrics["test_false_positives_per_1000"] >= 0.0


def test_model_current_models_list(client):
    """models must be a non-empty list of model name strings."""
    response = client.get("/api/v1/model/current")
    models = response.json()["data"]["models"]
    assert isinstance(models, list)
    assert len(models) > 0
    for name in models:
        assert isinstance(name, str)


def test_model_current_limitation_present(client):
    """limitation string must be non-empty and mention synthetic."""
    response = client.get("/api/v1/model/current")
    limitation = response.json()["data"]["limitation"]
    assert isinstance(limitation, str)
    assert len(limitation) > 20


def test_model_current_no_forbidden_fields(client):
    """Verify no evaluator ground-truth or internal fields are exposed."""
    response = client.get("/api/v1/model/current")
    content_str = response.text
    forbidden = [
        "is_anomalous", "severity_truth", "scenario_id", "labels.csv",
        "joblib", "robust_scaler", "isolation_forest",
    ]
    for field in forbidden:
        assert field not in content_str, f"Forbidden field or path '{field}' found in response."
