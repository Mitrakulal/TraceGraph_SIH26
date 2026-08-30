"""Schemas for the Model & Run Evidence endpoint."""

from typing import Any
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


class ScoreRequest(BaseModel):
    """Request body for POST /api/v1/model/score."""

    event_id: str


class ScorePayload(BaseModel):
    """Payload for POST /api/v1/model/score — live model inference result."""

    event_id: str
    model_run_id: str
    inference_time_ms: float
    features_used: dict[str, float]
    feature_count: int
    ml_probability: float
    novelty_score: float
    graph_risk_score: float
    risk_score: int
    risk_threshold: int
    is_alert: bool
    rule_hits: list[str] = []
    evidence: list[dict[str, Any]] = []
    data_classification: str = "SYNTHETIC_ONLY"
    limitation: str


class AlertEventRef(BaseModel):
    """An alert-queue event reference for the scoring picker."""

    alert_id: str
    event_id: str


class SampleEventsPayload(BaseModel):
    """Payload for GET /api/v1/model/sample-events."""

    background_events: list[str]
    alert_events: list[AlertEventRef]
    total_events: int
    data_classification: str = "SYNTHETIC_ONLY"

