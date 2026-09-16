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

# Human-readable labels for the 18 model features.
# Used to render plain-English evidence in API responses.
# Keys must exactly match feature names in graph_summary.json -> feature_columns.
FEATURE_PLAIN_LABELS = {
    "amount_log": "transaction amount",
    "fee_rate": "fee rate",
    "latency_log": "network latency",
    "peer_count_hint": "peer count",
    "src_port_norm": "source port pattern",
    "inter_event_seconds": "time gap between transactions",
    "recent_count_10m": "transaction burst rate in a 10-minute window",
    "wallet_out_count": "outgoing transaction count",
    "wallet_unique_destinations": "number of distinct destination wallets",
    "wallet_unique_ips": "number of distinct IP addresses used",
    "ip_rotation_rate": "IP rotation rate",
    "fan_out_ratio": "fan-out ratio",
    "target_unique_senders": "number of distinct senders to the target",
    "source_out_degree": "source wallet out-degree",
    "target_in_degree": "target wallet in-degree",
    "degree_ratio": "in-to-out degree ratio",
    "graph_reach_proxy": "graph reach",
    "script_type_code": "script type",
}


def plain_reason(feature: str, direction: str) -> str:
    """Render a plain-English reason line for a SHAP evidence record."""
    label = FEATURE_PLAIN_LABELS.get(feature, feature)
    verb = "raised" if direction == "INCREASED_RISK" else "lowered"
    return f"Unusual {label} {verb} the review priority score."

