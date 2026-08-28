"""TraceGraph AI FastAPI Application Entry Point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import alerts, dashboard, graph, status
from app.core.errors import (
    APIException,
    api_exception_handler,
    generate_request_id,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.storage.artifact_store import store


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager loading ML artifacts at startup."""
    try:
        store.load()
    except Exception as e:
        print(f"Warning: ArtifactStore load error at startup: {e}")
    yield


app = FastAPI(
    title="TraceGraph AI API Service",
    description="Offline CPU-only synthetic Bitcoin transaction analysis API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for local offline frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id_middleware(request: Request, call_next):
    """Middleware attaching request_id to request state."""
    request_id = request.headers.get("X-Request-ID") or generate_request_id()
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Register exception handlers
app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Include v1 REST routers
API_V1_PREFIX = "/api/v1"
app.include_router(status.router, prefix=API_V1_PREFIX, tags=["Status"])
app.include_router(dashboard.router, prefix=API_V1_PREFIX, tags=["Dashboard"])
app.include_router(alerts.router, prefix=API_V1_PREFIX, tags=["Alerts"])
app.include_router(graph.router, prefix=API_V1_PREFIX, tags=["Graph Explorer"])


@app.get("/", include_in_schema=False)
def root():
    """Root redirect / info endpoint."""
    return {
        "service": "tracegraph-api",
        "status": "online",
        "docs": "/docs",
        "api_prefix": API_V1_PREFIX,
    }
