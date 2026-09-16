"""Clustered Entity Explorer router endpoints."""

from typing import Annotated
from fastapi import APIRouter, Query, status

from app.core.errors import APIException
from app.schemas.common import DataEnvelope
from app.schemas.entities import (
    EntityClusterItem,
    EntityDetailPayload,
    EntityListPayload,
)
from app.storage.artifact_store import store

router = APIRouter()


@router.get("/entities", response_model=DataEnvelope[EntityListPayload])
def list_entities(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    min_risk: Annotated[int | None, Query(ge=0, le=100)] = None,
    search: Annotated[str | None, Query()] = None,
) -> DataEnvelope[EntityListPayload]:
    """Get paginated, filterable list of clustered synthetic entity supernodes."""
    if not store.is_loaded:
        store.load()

    filtered = list(store.entities_list)

    if min_risk is not None:
        filtered = [e for e in filtered if e["risk_score"] >= min_risk]

    if search:
        q = search.lower().strip()
        filtered = [
            e for e in filtered
            if q in e["entity_id"].lower() or q in e["root_wallet"].lower() or any(q in w.lower() for w in e["wallets"])
        ]

    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = filtered[start:end]

    items = [
        EntityClusterItem(
            entity_id=e["entity_id"],
            root_wallet=e["root_wallet"],
            wallet_count=e["wallet_count"],
            transaction_count=e["transaction_count"],
            risk_score=e["risk_score"],
            status=e["status"],
            wallets=e["wallets"][:10],
        )
        for e in paginated
    ]

    return DataEnvelope(
        data=EntityListPayload(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
        )
    )


@router.get("/entities/{entityId}", response_model=DataEnvelope[EntityDetailPayload])
def get_entity_detail(entityId: str) -> DataEnvelope[EntityDetailPayload]:
    """Get detail for a single synthetic entity cluster."""
    if not store.is_loaded:
        store.load()

    ent = store.entities_by_id.get(entityId)
    if not ent:
        # Fallback search by root_wallet or member wallet
        mapped_id = store.wallet_to_entity_map.get(entityId)
        if mapped_id:
            ent = store.entities_by_id.get(mapped_id)

    if not ent:
        raise APIException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="ENTITY_NOT_FOUND",
            message=f"No entity cluster found with ID '{entityId}'.",
        )

    wallets = ent["wallets"]
    max_risk = max((store.wallet_risk_map.get(w, 0) for w in wallets), default=0)
    tx_count = sum(len(store.wallet_adjacency.get(w, [])) for w in wallets) // 2

    payload = EntityDetailPayload(
        entity_id=ent["entity_id"],
        root_wallet=ent["root_wallet"],
        wallet_count=len(wallets),
        transaction_count=max(1, tx_count),
        risk_score=max_risk,
        status="Flagged" if max_risk >= 75 else "Monitored" if max_risk >= 50 else "Normal",
        wallets=wallets,
        counterparties=min(len(wallets) * 3, 120),
    )
    return DataEnvelope(data=payload)
