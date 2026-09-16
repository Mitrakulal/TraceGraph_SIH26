"""Schemas for Bulk File Ingestion endpoint."""

from pydantic import BaseModel


class IngestUploadResponse(BaseModel):
    """Payload for POST /api/v1/ingest/upload data field."""

    rows_ingested: int
    links_built: int
    entities_clustered: int
    priority_cases: int
    data_classification: str = "OFFLINE_SYNTHETIC_ONLY"
    elapsed_sec: float
    message: str
