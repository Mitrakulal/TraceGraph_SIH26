"""Schemas for Entity Cluster List and Detail endpoints."""

from typing import Literal
from pydantic import BaseModel, Field

EntityStatus = Literal["Flagged", "Monitored", "Normal"]


class EntityClusterItem(BaseModel):
    """Clustered entity supernode summary in list view."""

    entity_id: str
    root_wallet: str
    wallet_count: int
    transaction_count: int
    risk_score: int = Field(ge=0, le=100)
    status: EntityStatus
    wallets: list[str]


class EntityListPayload(BaseModel):
    """Payload for GET /api/v1/entities data field."""

    items: list[EntityClusterItem]
    page: int
    page_size: int
    total: int


class EntityDetailPayload(BaseModel):
    """Payload for GET /api/v1/entities/:id data field."""

    entity_id: str
    root_wallet: str
    wallet_count: int
    transaction_count: int
    risk_score: int
    status: EntityStatus
    wallets: list[str]
    counterparties: int
    synthetic_notice: str = "Synthetic entity intelligence only. Human review required."
