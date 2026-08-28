"""Pytest configuration and shared fixtures for API tests."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.storage.artifact_store import store


@pytest.fixture(scope="session", autouse=True)
def load_artifacts():
    """Ensure artifacts are loaded before tests run."""
    store.load()


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    with TestClient(app) as test_client:
        yield test_client
