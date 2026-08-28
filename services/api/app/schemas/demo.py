"""Schemas for Demo Scenarios and Demo Activate endpoints."""

from typing import Literal
from pydantic import BaseModel


ExpectedBand = Literal["REVIEW_PRIORITY", "LOW_PRIORITY"]


class ScenarioItem(BaseModel):
    """One entry in the demo scenario catalog."""

    scenario_key: str
    display_name: str
    description: str
    expected_review_band: ExpectedBand
    available: bool = True


class ScenarioListPayload(BaseModel):
    """Payload for GET /api/v1/demo/scenarios data field."""

    items: list[ScenarioItem]


class DemoActivateRequest(BaseModel):
    """Request body for POST /api/v1/demo/activate."""

    scenario_key: str


class DemoActivatePayload(BaseModel):
    """Payload for POST /api/v1/demo/activate data field."""

    demo_session_id: str
    scenario_key: str
    run_id: str
    status: Literal["READY", "PREPARING"] = "READY"
    featured_alert_id: str | None = None
    message: str
