"""Schemas for Alert List and Alert Detail endpoints."""

from typing import Literal
from pydantic import BaseModel, Field


ReviewState = Literal["UNREVIEWED", "REVIEWED", "DISMISSED", "ESCALATED"]
PriorityBand = Literal["REVIEW_PRIORITY", "LOW_PRIORITY"]
DirectionType = Literal["INCREASED_RISK", "DECREASED_RISK"]
SortOption = Literal["RISK_DESC", "TIME_DESC"]


class AlertListItem(BaseModel):
    """Single item in the alert queue list."""

    alert_id: str
    event_id: str
    observed_at: str
    source_wallet: str
    target_wallet: str
    risk_score: int = Field(ge=0, le=100)
    ml_probability: float
    novelty_score: float
    graph_risk_score: float
    baseline_score: int
    priority_band: PriorityBand
    review_state: ReviewState
    top_reason: str
    synthetic_notice: str = "Synthetic evidence only. Human review required."


class AlertListPayload(BaseModel):
    """Payload for GET /api/v1/alerts data field."""

    items: list[AlertListItem]
    page: int
    page_size: int
    total: int


class AlertDetailItem(BaseModel):
    """Alert metadata sub-object inside alert detail."""

    alert_id: str
    event_id: str
    observed_at: str
    source_wallet: str
    target_wallet: str
    risk_score: int = Field(ge=0, le=100)
    ml_probability: float
    novelty_score: float
    graph_risk_score: float
    baseline_score: int
    priority_band: PriorityBand
    review_state: ReviewState
    synthetic_notice: str = "Synthetic evidence only. Human review required."


class EvidenceItem(BaseModel):
    """Single TreeSHAP feature contribution record."""

    evidence_id: str
    feature: str
    feature_value: float
    shap_value: float
    direction: DirectionType
    message: str
    plain_reason: str | None = None



class ReviewRecord(BaseModel):
    """History of human reviewer decisions."""

    review_id: str
    decision: ReviewState
    note: str | None = None
    reviewed_at: str


class AlertDetailPayload(BaseModel):
    """Payload for GET /api/v1/alerts/:alertId data field."""

    alert: AlertDetailItem
    rule_hits: list[str]
    evidence: list[EvidenceItem]
    linked_entity_ids: list[str]
    review_history: list[ReviewRecord] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Reviewer decision schemas (spec Section 6.9)
# ---------------------------------------------------------------------------

DecisionType = Literal["REVIEWED", "DISMISSED", "ESCALATED"]


class ReviewRequest(BaseModel):
    """Request body for POST /api/v1/alerts/:alertId/reviews."""

    decision: DecisionType
    note: str | None = Field(default=None, max_length=500)


class LatestReview(BaseModel):
    """The most recent reviewer decision record."""

    review_id: str
    decision: DecisionType
    note: str | None = None
    reviewed_at: str


class ReviewResponse(BaseModel):
    """Payload for POST /api/v1/alerts/:alertId/reviews data field."""

    alert_id: str
    review_state: ReviewState
    latest_review: LatestReview


class ActionNoteRequest(BaseModel):
    """Optional note body for POST /api/v1/alerts/:alertId/dismiss or /escalate."""

    note: str | None = Field(default=None, max_length=500)

