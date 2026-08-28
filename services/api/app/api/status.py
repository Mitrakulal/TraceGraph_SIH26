"""System status endpoint."""

from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import RUN_ID
from app.schemas.common import DataEnvelope
from app.storage.artifact_store import store

router = APIRouter()


class StatusPayload(BaseModel):
    """Payload for GET /api/v1/status."""

    service: str = "tracegraph-api"
    mode: str = "OFFLINE_SYNTHETIC_ONLY"
    current_run_id: str
    model_ready: bool
    api_version: str = "v1"
    timestamp: str


@router.get("/status", response_model=DataEnvelope[StatusPayload])
def get_status() -> DataEnvelope[StatusPayload]:
    """Get backend connection and model readiness status."""
    if not store.is_loaded:
        try:
            store.load()
        except Exception:
            pass

    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    payload = StatusPayload(
        service="tracegraph-api",
        mode="OFFLINE_SYNTHETIC_ONLY",
        current_run_id=RUN_ID,
        model_ready=store.is_loaded,
        api_version="v1",
        timestamp=now_iso,
    )
    return DataEnvelope(data=payload)
