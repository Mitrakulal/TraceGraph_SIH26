"""Demo Scenarios and Demo Activate router endpoints."""

import uuid
from fastapi import APIRouter, status

from app.core.config import ALLOWED_SCENARIO_KEYS, RUN_ID
from app.core.errors import APIException
from app.schemas.common import DataEnvelope
from app.schemas.demo import (
    DemoActivatePayload,
    DemoActivateRequest,
    ScenarioItem,
    ScenarioListPayload,
)
from app.storage.artifact_store import store

router = APIRouter()


# ---------------------------------------------------------------------------
# Scenario catalog — order and wording match spec Section 6.3
# ---------------------------------------------------------------------------

_SCENARIO_CATALOG: list[ScenarioItem] = [
    ScenarioItem(
        scenario_key="normal",
        display_name="Normal synthetic pattern",
        description="Stable timing, limited destinations, and low IP rotation.",
        expected_review_band="LOW_PRIORITY",
        available=True,
    ),
    ScenarioItem(
        scenario_key="structuring",
        display_name="Structuring pattern",
        description="Repeated near-threshold amounts sent in rapid succession.",
        expected_review_band="REVIEW_PRIORITY",
        available=True,
    ),
    ScenarioItem(
        scenario_key="peel_chain",
        display_name="Peel chain pattern",
        description="Sequential decreasing transfers through a synthetic wallet chain.",
        expected_review_band="REVIEW_PRIORITY",
        available=True,
    ),
    ScenarioItem(
        scenario_key="rapid_hop",
        display_name="Rapid hop pattern",
        description="Rapid consecutive transfers through several synthetic wallets.",
        expected_review_band="REVIEW_PRIORITY",
        available=True,
    ),
    ScenarioItem(
        scenario_key="fan_out",
        display_name="Fan-out pattern",
        description="One synthetic wallet distributing to many recipients in a short window.",
        expected_review_band="REVIEW_PRIORITY",
        available=True,
    ),
    ScenarioItem(
        scenario_key="fan_in",
        display_name="Fan-in pattern",
        description="Many synthetic senders converging funds to a single recipient wallet.",
        expected_review_band="REVIEW_PRIORITY",
        available=True,
    ),
    ScenarioItem(
        scenario_key="ip_rotation",
        display_name="IP rotation pattern",
        description="High rate of synthetic source-IP rotation for a single wallet.",
        expected_review_band="REVIEW_PRIORITY",
        available=True,
    ),
    ScenarioItem(
        scenario_key="source_port_shift",
        display_name="Source port shift pattern",
        description="Unusual source-port and elevated latency deviating from background traffic.",
        expected_review_band="REVIEW_PRIORITY",
        available=True,
    ),
]

_SCENARIO_KEY_SET = {s.scenario_key for s in _SCENARIO_CATALOG}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/demo/scenarios", response_model=DataEnvelope[ScenarioListPayload])
def list_demo_scenarios() -> DataEnvelope[ScenarioListPayload]:
    """Return the full synthetic scenario catalog for the Demo Scenario Control screen."""
    return DataEnvelope(data=ScenarioListPayload(items=_SCENARIO_CATALOG))


@router.post(
    "/demo/activate",
    response_model=DataEnvelope[DemoActivatePayload],
    status_code=status.HTTP_200_OK,
)
def activate_demo_scenario(body: DemoActivateRequest) -> DataEnvelope[DemoActivatePayload]:
    """Activate a precomputed synthetic demo scenario session.

    Does NOT retrain models or generate new data. Returns the top-ranked alert
    from the current committed run as the featured alert for the scenario.
    """
    key = body.scenario_key.lower().strip()
    if key not in _SCENARIO_KEY_SET:
        raise APIException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="INVALID_SCENARIO_KEY",
            message=(
                f"Invalid scenario_key '{body.scenario_key}'. "
                f"Allowed values: {sorted(_SCENARIO_KEY_SET)}"
            ),
        )

    if not store.is_loaded:
        store.load()

    # Pick scenario-specific featured alert from the committed run.
    # Ground-truth scenario labels are never used here; selection is based on distinct alert offsets.
    featured_alert_id: str | None = None
    if store.alerts_list:
        scenario_offsets = {
            "normal": -1,             # Lowest-risk alert in queue
            "structuring": 0,          # Rank 1 alert
            "peel_chain": 1,           # Rank 2 alert
            "rapid_hop": 2,            # Rank 3 alert
            "fan_out": 3,              # Rank 4 alert
            "fan_in": 4,               # Rank 5 alert
            "ip_rotation": 5,          # Rank 6 alert
            "source_port_shift": 6,    # Rank 7 alert
        }
        idx = scenario_offsets.get(key, 0)
        target_alert = store.alerts_list[idx % len(store.alerts_list)]
        featured_alert_id = target_alert.get("alert_id")


    demo_session_id = f"demo_{uuid.uuid4().hex[:16]}"

    payload = DemoActivatePayload(
        demo_session_id=demo_session_id,
        scenario_key=key,
        run_id=RUN_ID,
        status="READY",
        featured_alert_id=featured_alert_id,
        message="Synthetic scenario is ready for review.",
    )
    return DataEnvelope(data=payload)
