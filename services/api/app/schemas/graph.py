"""Schemas for Graph Explorer endpoint."""

from typing import Literal
from pydantic import BaseModel, Field

NodeType = Literal["WALLET", "IP", "TRANSACTION"]
EdgeType = Literal["SENT_TO", "OBSERVED_FROM", "INVOLVES_TX"]


class GraphNode(BaseModel):
    """Single node in the graph."""

    id: str
    label: str
    type: NodeType
    risk_score: int | None = Field(default=None, ge=0, le=100)
    is_focus: bool = False


class GraphEdge(BaseModel):
    """Single directed edge in the graph."""

    id: str
    source: str
    target: str
    type: EdgeType
    observed_at: str


class GraphSummary(BaseModel):
    """Metadata summary of returned graph subset."""

    node_count: int
    edge_count: int
    truncated: bool = False


class GraphPayload(BaseModel):
    """Payload for GET /api/v1/graph/entities/:entityId data field."""

    focus_entity_id: str
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    summary: GraphSummary
    synthetic_notice: str = "Synthetic relationship graph only. Human review required."
