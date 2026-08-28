"""Graph Explorer router endpoints."""

from typing import Annotated
from fastapi import APIRouter, Query

from app.schemas.common import DataEnvelope
from app.schemas.graph import GraphPayload
from app.services.graph_service import GraphService

router = APIRouter()


@router.get("/graph/entities/{entityId}", response_model=DataEnvelope[GraphPayload])
def get_entity_graph(
    entityId: str,
    depth: Annotated[int, Query(ge=1, le=2)] = 1,
    limit: Annotated[int, Query(ge=1, le=120)] = 60,
) -> DataEnvelope[GraphPayload]:
    """Get relationship graph subset around a focus entity."""
    payload = GraphService.get_entity_graph(
        entity_id=entityId,
        depth=depth,
        limit=limit,
    )
    return DataEnvelope(data=payload)
