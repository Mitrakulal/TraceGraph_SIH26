"""Common schemas and response envelope wrappers."""

from typing import Generic, TypeVar
from pydantic import BaseModel

DataType = TypeVar("DataType")


class DataEnvelope(BaseModel, Generic[DataType]):
    """Standard success response wrapper: {"data": ...}."""

    data: DataType


class ErrorDetail(BaseModel):
    """Error object inside error response."""

    code: str
    message: str
    request_id: str


class ErrorResponse(BaseModel):
    """Standard error response structure."""

    error: ErrorDetail
