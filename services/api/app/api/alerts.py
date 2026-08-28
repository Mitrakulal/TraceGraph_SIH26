"""Alert List and Alert Detail router endpoints."""

from typing import Annotated
from fastapi import APIRouter, Query, status

from app.core.config import ALLOWED_SCENARIO_KEYS
from app.core.errors import APIException
from app.schemas.alerts import (
    ActionNoteRequest,
    AlertDetailPayload,
    AlertListPayload,
    LatestReview,
    ReviewRecord,
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
        review_state=None,  # Filtered with SQLite review overlay below
        scenario_key=scenario_key,
        sort=sort,
    )

    # Overlay persisted reviewer decisions onto returned alert list items
    latest_reviews = review_store.get_all_latest_reviews()
    for item in payload.items:
        item.review_state = latest_reviews.get(item.alert_id, "UNREVIEWED")

    # Filter by review_state if parameter provided
    if review_state is not None:
        target_state = review_state.upper()
        payload.items = [item for item in payload.items if item.review_state == target_state]
        payload.total = len(payload.items)

    return DataEnvelope(data=payload)


@router.get("/alerts/{alertId}", response_model=DataEnvelope[AlertDetailPayload])
def get_alert_detail(alertId: str) -> DataEnvelope[AlertDetailPayload]:
    """Get detailed explainability evidence and metadata for a single alert."""
    payload = AlertService.get_alert_detail(alert_id=alertId)

    # Populate review state and audit history from SQLite persistence
    raw_history = review_store.get_reviews(alertId)
    if raw_history:
        payload.alert.review_state = raw_history[0]["decision"]
        payload.review_history = [
            ReviewRecord(
                review_id=r["review_id"],
                decision=r["decision"],
                note=r.get("note"),
                reviewed_at=r["reviewed_at"],
            )
            for r in raw_history
        ]

    return DataEnvelope(data=payload)


@router.post("/alerts/{alertId}/reviews", response_model=DataEnvelope[ReviewResponse])
def create_review(
    alertId: str,
    body: ReviewRequest,
) -> DataEnvelope[ReviewResponse]:
    """Store a human reviewer decision (REVIEWED, DISMISSED, ESCALATED) for an alert.

    Validates that the alert exists in the current run, persists the decision
    to SQLite with a UTC timestamp, and returns the updated alert review state.
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


@router.post("/alerts/{alertId}/dismiss", response_model=DataEnvelope[ReviewResponse])
def dismiss_alert(
    alertId: str,
    body: ActionNoteRequest | None = None,
) -> DataEnvelope[ReviewResponse]:
    """Shortcut endpoint to mark an alert as DISMISSED."""
    note = body.note if body else None
    return create_review(alertId=alertId, body=ReviewRequest(decision="DISMISSED", note=note))


@router.post("/alerts/{alertId}/escalate", response_model=DataEnvelope[ReviewResponse])
def escalate_alert(
    alertId: str,
    body: ActionNoteRequest | None = None,
) -> DataEnvelope[ReviewResponse]:
    """Shortcut endpoint to mark an alert as ESCALATED."""
    note = body.note if body else None
    return create_review(alertId=alertId, body=ReviewRequest(decision="ESCALATED", note=note))
