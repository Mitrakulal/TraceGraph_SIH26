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


def derive_typology(rule_hits: list[str], risk_score: int, shap_features: list[str] | None = None) -> tuple[str, int]:
    """Derive pattern typology label and confidence score from rule hits and SHAP evidence."""
    rules_set = set(rule_hits)
    feats_set = set(shap_features or [])

    if "BR-05" in rules_set or "inter_event_seconds" in feats_set:
        return "PEEL_CHAIN", 87
    if "BR-02" in rules_set or "fan_out_ratio" in feats_set:
        return "FAN_OUT", 89
    if "BR-04" in rules_set or "ip_rotation_rate" in feats_set or "wallet_unique_ips" in feats_set:
        return "IP_ROTATION", 92
    if "recent_count_10m" in feats_set or "wallet_out_count" in feats_set:
        return "STRUCTURING", 84
    if "degree_ratio" in feats_set or "target_in_degree" in feats_set:
        return "RAPID_HOP", 86
    if risk_score >= 75:
        return "MIXER_LIKE", 81
    return "BENIGN", 95


