"""Configuration settings for TraceGraph AI API service."""

import os
from pathlib import Path

# Resolve base directories safely relative to file location
FILE_PATH = Path(__file__).resolve()
CORE_DIR = FILE_PATH.parent
APP_DIR = CORE_DIR.parent
API_SERVICE_DIR = APP_DIR.parent
SERVICES_DIR = API_SERVICE_DIR.parent
REPO_ROOT = SERVICES_DIR.parent

# Default run ID and data paths
DEFAULT_RUN_ID = "sih26146-cpu-demo-2026-v1"
RUN_ID = os.getenv("TRACEGRAPH_RUN_ID", DEFAULT_RUN_ID)

RUN_DIR = os.getenv(
    "TRACEGRAPH_RUN_DIR",
    str(REPO_ROOT / "services" / "ml" / "artifacts" / "runs" / RUN_ID)
)

ALLOWED_SCENARIO_KEYS = {
    "normal",
    "structuring",
    "peel_chain",
    "rapid_hop",
    "fan_out",
    "fan_in",
    "ip_rotation",
    "source_port_shift",
}

RULE_CODE_MAP = {
    "BR-02": "FAN_OUT_RATIO",
    "BR-04": "HIGH_IP_ROTATION",
    "BR-05": "RAPID_RELATION_ACTIVITY",
}
