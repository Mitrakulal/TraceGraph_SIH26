"""Shared error structures and exception handlers."""

import uuid
from typing import Any
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class APIException(Exception):
    """Base API exception for domain errors."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        headers: dict[str, str] | None = None,
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.headers = headers
        super().__init__(message)


def generate_request_id() -> str:
    """Generate a readable request ID."""
    return f"req_{uuid.uuid4().hex[:12]}"


def make_error_payload(code: str, message: str, request_id: str | None = None) -> dict[str, Any]:
    """Format standard error response body."""
    return {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id or generate_request_id(),
        }
    }


async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
    """Handle domain API exceptions."""
    req_id = getattr(request.state, "request_id", generate_request_id())
    payload = make_error_payload(code=exc.code, message=exc.message, request_id=req_id)
    return JSONResponse(status_code=exc.status_code, content=payload, headers=exc.headers)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle standard HTTP exceptions."""
    req_id = getattr(request.state, "request_id", generate_request_id())
    code = "NOT_FOUND" if exc.status_code == 404 else f"HTTP_{exc.status_code}"
    message = str(exc.detail) if exc.detail else "An HTTP error occurred."
    payload = make_error_payload(code=code, message=message, request_id=req_id)
    return JSONResponse(status_code=exc.status_code, content=payload)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors (422)."""
    req_id = getattr(request.state, "request_id", generate_request_id())
    # Produce readable error summary from first error location
    errors = exc.errors()
    if errors:
        first_err = errors[0]
        field_path = ".".join(str(loc) for loc in first_err.get("loc", []) if loc != "body")
        msg = f"Invalid request parameter '{field_path}': {first_err.get('msg', 'validation failed')}."
    else:
        msg = "Request validation failed."

    payload = make_error_payload(code="INVALID_PARAMETER", message=msg, request_id=req_id)
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload)


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected server errors (500) without leaking stack traces or local paths."""
    req_id = getattr(request.state, "request_id", generate_request_id())
    payload = make_error_payload(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected internal server error occurred. Human review required.",
        request_id=req_id,
    )
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=payload)
