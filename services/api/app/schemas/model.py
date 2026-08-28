"""Schemas for the Model & Run Evidence endpoint."""

from pydantic import BaseModel


class ModelMetrics(BaseModel):
    """Held-out test metrics from the committed run."""

    test_pr_auc: float
    test_f1: float
    test_false_positives_per_1000: float


class ModelCurrentPayload(BaseModel):
    """Payload for GET /api/v1/model/current data field."""

    run_id: str
    dataset_version: str
    data_classification: str = "SYNTHETIC_ONLY"
    models: list[str]
    feature_count: int
    risk_threshold: int
    metrics: ModelMetrics
    artifact_status: str
    limitation: str
