"""Alert List and Alert Detail router endpoints."""

from typing import Annotated
from fastapi import APIRouter, Query, status

from app.core.config import ALLOWED_SCENARIO_KEYS
from app.core.errors import APIException
from app.schemas.alerts import (
    AlertDetailPayload,
    AlertListPayload,
    LatestReview,
    ReviewRequest,
    ReviewResponse,
)
from app.schemas.common import DataEnvelope
from app.services.alert_service import AlertService
from app.storage import review_store

router = APIRouter()

VALID_REVIEW_STATES = {"UNREVIEWED", "REVIEWED", "DISMISSED", "ESCALATED"}
VALID_SORTS = {"RISK_DESC", "TIME_DESC"}


@router.get("/alerts", response_model=DataEnvelope[AlertListPayload])
def list_alerts(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    min_risk: Annotated[float | None, Query(ge=0.0, le=100.0)] = None,
    review_state: Annotated[str | None, Query()] = None,
    scenario_key: Annotated[str | None, Query()] = None,
    sort: Annotated[str, Query()] = "RISK_DESC",
) -> DataEnvelope[AlertListPayload]:
    """Get paginated, filterable, sortable list of synthetic review alerts."""

    # Validate review_state enum if provided
    if review_state is not None and review_state.upper() not in VALID_REVIEW_STATES:
        raise APIException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="INVALID_PARAMETER",
            message=f"Invalid review_state '{review_state}'. Allowed values: {sorted(list(VALID_REVIEW_STATES))}",
        )

    # Validate scenario_key enum if provided
    if scenario_key is not None and scenario_key.lower() not in ALLOWED_SCENARIO_KEYS:
        raise APIException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="INVALID_PARAMETER",
            message=f"Invalid scenario_key '{scenario_key}'. Allowed keys: {sorted(list(ALLOWED_SCENARIO_KEYS))}",
        )

    # Validate sort enum
    if sort not in VALID_SORTS:
        raise APIException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="INVALID_PARAMETER",
            message=f"Invalid sort parameter '{sort}'. Allowed values: {sorted(list(VALID_SORTS))}",
        )

    payload = AlertService.list_alerts(
        page=page,
        page_size=page_size,
        min_risk=min_risk,
        review_state=review_state,
        scenario_key=scenario_key,
        sort=sort,
    )
    return DataEnvelope(data=payload)


@router.get("/alerts/{alertId}", response_model=DataEnvelope[AlertDetailPayload])
def get_alert_detail(alertId: str) -> DataEnvelope[AlertDetailPayload]:
    """Get detailed explainability evidence and metadata for a single alert."""
    payload = AlertService.get_alert_detail(alert_id=alertId)
    return DataEnvelope(data=payload)


@router.post("/alerts/{alertId}/reviews", response_model=DataEnvelope[ReviewResponse])
def create_review(
    alertId: str,
    body: ReviewRequest,
) -> DataEnvelope[ReviewResponse]:
    """Store a human reviewer decision for an alert.

    Validates that the alert exists in the current run, persists the decision
    to SQLite with a UTC timestamp, and returns the updated alert review state.
    Valid decisions: REVIEWED, DISMISSED, ESCALATED.
    """
    from app.storage.artifact_store import store  # lazy import avoids circular

    if not store.is_loaded:
        store.load()

    if alertId not in store.alerts_by_id:
        raise APIException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="ALERT_NOT_FOUND",
            message=f"No alert with ID '{alertId}' exists in the current run.",
        )

    # Persist decision
    saved = review_store.save_review(
        alert_id=alertId,
        decision=body.decision,
        note=body.note,
    )

    latest = LatestReview(
        review_id=saved["review_id"],
        decision=saved["decision"],
        note=saved["note"],
        reviewed_at=saved["reviewed_at"],
    )

    payload = ReviewResponse(
        alert_id=alertId,
        review_state=body.decision,
        latest_review=latest,
    )
    return DataEnvelope(data=payload)
