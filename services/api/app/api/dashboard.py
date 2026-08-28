"""Dashboard summary endpoint."""

from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import RUN_ID
from app.schemas.common import DataEnvelope
from app.storage.artifact_store import store

router = APIRouter()


class DashboardSummaryPayload(BaseModel):
    """Payload for GET /api/v1/dashboard/summary."""

    run_id: str
    data_classification: str = "SYNTHETIC_ONLY"
    total_events: int
    total_alerts: int
    review_priority_count: int
    evidence_record_count: int
    risk_threshold: int = 65
    scenario_count: int = 8
    last_generated_at: str


@router.get("/dashboard/summary", response_model=DataEnvelope[DashboardSummaryPayload])
def get_dashboard_summary() -> DataEnvelope[DashboardSummaryPayload]:
    """Get high-level summary metrics for Overview screen."""
    if not store.is_loaded:
        store.load()

    total_events = store.model_card.get("dataset", {}).get("event_count", 60000)
    total_alerts = len(store.alerts_list)
    evidence_count = sum(len(evs) for evs in store.evidence_by_alert_id.values())
    priority_count = sum(1 for a in store.alerts_list if a.get("risk_score", 0) >= 65)
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    payload = DashboardSummaryPayload(
        run_id=RUN_ID,
        data_classification="SYNTHETIC_ONLY",
        total_events=total_events,
        total_alerts=total_alerts,
        review_priority_count=priority_count,
        evidence_record_count=evidence_count,
        risk_threshold=65,
        scenario_count=8,
        last_generated_at=now_iso,
    )
    return DataEnvelope(data=payload)
