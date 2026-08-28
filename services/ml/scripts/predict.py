"""Standalone batch prediction CLI for TraceGraph AI.

Scores a new synthetic-only CSV batch using the committed trained model
artifacts. Does not retrain, does not access the network, does not accept
real wallet/IP/blockchain data, and does not expose ground-truth labels.

Usage (from services/ml/):
    PYTHONPATH=src python3 scripts/predict.py \\
      --input  data/generated/sih26146-synthetic-60000-v2/events.csv \\
      --manifest data/generated/sih26146-synthetic-60000-v2/manifest.json \\
      --model-run artifacts/runs/sih26146-cpu-demo-2026-v1 \\
      --output artifacts/predictions/demo-predictions.json

Output JSON schema:
    {
      "run_id": "...",
      "input_event_count": N,
      "alert_count": K,
      "data_classification": "SYNTHETIC_ONLY",
      "limitation": "...",
      "alerts": [ { alert fields + evidence } ]
    }
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from collections import Counter, defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from xgboost import DMatrix, XGBClassifier

# Reuse canonical constants from the single source of truth
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from tracegraph.pipeline import (  # noqa: E402
    EVENT_COLUMNS,
    FEATURE_COLUMNS,
    SCRIPT_CODES,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SYNTHETIC_IP_PREFIXES = ("198.18.", "198.19.")
RISK_QUEUE_THRESHOLD = 65
RISK_QUEUE_MAX = 250
EVIDENCE_TOP_K = 5
FEATURE_SCHEMA_SHA256 = "6bcd69da4ca91ccb9b685639d538cd91437616edb9c1c5fb2f4be7a96ef5fcca"


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def _validate_manifest(manifest_path: Path) -> dict[str, Any]:
    """Validate manifest and return its contents.

    Raises ValueError if the data classification is not SYNTHETIC_ONLY.
    Does not enforce SHA-256 of the CSV here; that is done separately.
    """
    if not manifest_path.is_file():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("data_classification") != "SYNTHETIC_ONLY":
        raise ValueError(
            "Rejected: manifest 'data_classification' must be 'SYNTHETIC_ONLY'. "
            f"Got: {manifest.get('data_classification')!r}"
        )
    return manifest


def _validate_csv(events_path: Path) -> pd.DataFrame:
    """Load and validate the events CSV against the canonical header contract.

    Raises ValueError for header mismatches, non-synthetic IPs, or invalid
    amount/fee relationships.
    """
    if not events_path.is_file():
        raise FileNotFoundError(f"Events CSV not found: {events_path}")

    events = pd.read_csv(events_path, parse_dates=["observed_at"])

    # Canonical column order check
    if tuple(events.columns) != EVENT_COLUMNS:
        raise ValueError(
            f"CSV header does not match canonical contract.\n"
            f"Expected: {EVENT_COLUMNS}\n"
            f"Got:      {tuple(events.columns)}"
        )

    # Uniqueness checks
    if events["event_id"].duplicated().any():
        raise ValueError("Duplicate event_id values detected — rejected.")
    if events["event_sequence"].duplicated().any():
        raise ValueError("Duplicate event_sequence values detected — rejected.")

    # Synthetic IP range check (198.18.0.0/15)
    bad_src = ~events["src_ip"].str.startswith(SYNTHETIC_IP_PREFIXES)
    bad_dst = ~events["dst_ip"].str.startswith(SYNTHETIC_IP_PREFIXES)
    if bad_src.any() or bad_dst.any():
        raise ValueError(
            "Non-benchmark IP range detected. Only 198.18.0.0/15 is accepted. "
            "This batch appears to contain real or non-synthetic IPs."
        )

    # Amount/fee relationship
    if not (events["amount_sats"] > events["fee_sats"]).all():
        raise ValueError("Invalid amount/fee relationship: amount_sats must be > fee_sats.")

    return events


# ---------------------------------------------------------------------------
# Feature extraction (inference-safe, no labels required)
# ---------------------------------------------------------------------------

def _extract_features_inference(events: pd.DataFrame) -> pd.DataFrame:
    """Build the 18 time-safe features for every event in chronological order.

    This mirrors pipeline.extract_features exactly but does not require
    truth/labels.csv. The returned DataFrame contains only the 18 FEATURE_COLUMNS
    plus event_id, observed_at, input_wallet, and output_wallet for downstream use.

    All history windows use prior events only — no future leakage.
    """
    events = events.sort_values(["observed_at", "event_sequence"], kind="stable").reset_index(drop=True)

    histories: dict[str, deque[tuple[pd.Timestamp, str, str, int]]] = defaultdict(deque)
    last_time: dict[str, pd.Timestamp] = {}
    destination_sets: dict[str, set[str]] = defaultdict(set)
    ip_sets: dict[str, set[str]] = defaultdict(set)
    sender_sets: dict[str, set[str]] = defaultdict(set)
    source_out: Counter[str] = Counter()
    target_in: Counter[str] = Counter()

    rows: list[dict[str, Any]] = []

    for row in events.itertuples(index=False):
        now: pd.Timestamp = row.observed_at
        source: str = row.input_wallet
        target: str = row.output_wallet
        history = histories[source]

        # Evict events outside 24-hour window
        cutoff = now - pd.Timedelta(hours=24)
        while history and history[0][0] < cutoff:
            history.popleft()

        previous = last_time.get(source)
        elapsed = (now - previous).total_seconds() if previous is not None else 86_400.0
        prior_destinations = destination_sets[source]
        prior_ips = ip_sets[source]
        current_out = source_out[source]
        current_in = target_in[target]
        recent_count_10m = sum(
            1 for item in history if item[0] >= now - pd.Timedelta(minutes=10)
        )
        amount = float(row.amount_sats)

        rows.append({
            "event_id": row.event_id,
            "observed_at": now.isoformat(),
            "input_wallet": source,
            "output_wallet": target,
            # 18 model features
            "amount_log": math.log1p(amount),
            "fee_rate": float(row.fee_sats) / max(1.0, amount),
            "latency_log": math.log1p(float(row.latency_ms)),
            "peer_count_hint": float(row.peer_count_hint),
            "src_port_norm": float(row.src_port) / 65535.0,
            "inter_event_seconds": min(elapsed, 86_400.0),
            "recent_count_10m": float(recent_count_10m),
            "wallet_out_count": float(len(history)),
            "wallet_unique_destinations": float(len(prior_destinations)),
            "wallet_unique_ips": float(len(prior_ips)),
            "ip_rotation_rate": float(len(prior_ips)) / max(1.0, len(history)),
            "fan_out_ratio": float(len(prior_destinations)) / max(1.0, len(history)),
            "target_unique_senders": float(len(sender_sets[target])),
            "source_out_degree": float(current_out),
            "target_in_degree": float(current_in),
            "degree_ratio": float(current_out) / max(1.0, float(current_in)),
            "graph_reach_proxy": float(current_out + current_in + len(prior_destinations)),
            "script_type_code": float(SCRIPT_CODES[row.script_type]),
        })

        # Update state with current event
        history.append((now, target, row.src_ip, int(row.src_port)))
        last_time[source] = now
        destination_sets[source].add(target)
        ip_sets[source].add(row.src_ip)
        sender_sets[target].add(source)
        source_out[source] += 1
        target_in[target] += 1

    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Model loading and scoring
# ---------------------------------------------------------------------------

def _load_models(model_run_dir: Path) -> tuple[Any, Any, XGBClassifier]:
    """Load the three committed model artifacts from the run directory."""
    artifacts_dir = model_run_dir / "artifacts"
    scaler_path = artifacts_dir / "robust_scaler.joblib"
    iso_path = artifacts_dir / "isolation_forest.joblib"
    xgb_path = artifacts_dir / "xgboost_model.json"

    for path in (scaler_path, iso_path, xgb_path):
        if not path.is_file():
            raise FileNotFoundError(f"Required model artifact missing: {path}")

    scaler = joblib.load(scaler_path)
    isolation = joblib.load(iso_path)
    classifier = XGBClassifier()
    classifier.load_model(str(xgb_path))
    return scaler, isolation, classifier


def _verify_feature_schema(model_run_dir: Path) -> None:
    """Verify the committed feature schema hash matches the runtime contract."""
    schema_path = model_run_dir / "feature_schema.json"
    if not schema_path.is_file():
        raise FileNotFoundError(f"feature_schema.json not found: {schema_path}")
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    committed_hash = schema.get("sha256", "")
    runtime_hash = hashlib.sha256("|".join(FEATURE_COLUMNS).encode()).hexdigest()
    if committed_hash != runtime_hash:
        raise ValueError(
            f"Feature schema hash mismatch. "
            f"Committed: {committed_hash}  Runtime: {runtime_hash}. "
            "The feature set in this run does not match the trained model."
        )


def _get_train_novelty_range(model_run_dir: Path, scaler: Any, isolation: Any) -> tuple[float, float]:
    """Compute the novelty normalization range from the committed training features.

    Reads features.parquet (already a committed artifact) and scores only the
    benign training rows to reproduce the same normalization applied during training.
    """
    parquet_path = model_run_dir / "features.parquet"
    if not parquet_path.is_file():
        raise FileNotFoundError(f"features.parquet not found: {parquet_path}")

    df = pd.read_parquet(parquet_path, columns=list(FEATURE_COLUMNS) + ["split", "is_anomalous"])
    train_benign = df[(df["split"] == "train") & (df["is_anomalous"] == 0)][list(FEATURE_COLUMNS)]
    if train_benign.empty:
        raise ValueError("No benign training rows found in features.parquet — cannot compute novelty range.")

    train_novelty = -isolation.score_samples(scaler.transform(train_benign.to_numpy(dtype=float)))
    return float(train_novelty.min()), float(train_novelty.max())


def _score_batch(
    feature_frame: pd.DataFrame,
    scaler: Any,
    isolation: Any,
    classifier: XGBClassifier,
    novelty_lower: float,
    novelty_upper: float,
) -> pd.DataFrame:
    """Apply the full risk scoring pipeline to a feature frame.

    Returns the frame with ml_probability, novelty_score, graph_risk_score,
    and risk_score columns appended.

    Risk formula (from spec Section 6.1):
        risk_score = round(100 * clamp(
            0.75 * ml_probability
          + 0.15 * novelty_score
          + 0.10 * graph_risk_score,
          0, 1))
    """
    result = feature_frame.copy()
    x = result[list(FEATURE_COLUMNS)].to_numpy(dtype=float)

    # XGBoost ML probability
    probability = classifier.predict_proba(x)[:, 1]

    # Isolation Forest novelty (normalized against training range)
    raw_novelty = -isolation.score_samples(scaler.transform(x))
    novelty = np.clip(
        (raw_novelty - novelty_lower) / max(1e-9, novelty_upper - novelty_lower),
        0, 1,
    )

    # Graph risk score (normalized within this batch)
    graph_raw = result["graph_reach_proxy"].to_numpy(dtype=float)
    graph_score = np.clip(
        (graph_raw - graph_raw.min()) / max(1e-9, graph_raw.max() - graph_raw.min()),
        0, 1,
    )

    result["ml_probability"] = probability
    result["novelty_score"] = novelty
    result["graph_risk_score"] = graph_score
    result["risk_score"] = np.round(
        100 * np.clip(0.75 * probability + 0.15 * novelty + 0.10 * graph_score, 0, 1)
    ).astype(int)

    return result


# ---------------------------------------------------------------------------
# Alert and evidence building
# ---------------------------------------------------------------------------

def _build_alerts_and_evidence(
    scored: pd.DataFrame,
    classifier: XGBClassifier,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Build the alert queue (top 250, risk_score >= 65) and 5-item SHAP evidence.

    Mirrors the exact alert/evidence structure written by pipeline.train_and_evaluate.
    """
    queue = (
        scored[scored["risk_score"] >= RISK_QUEUE_THRESHOLD]
        .sort_values(["risk_score", "ml_probability"], ascending=False)
        .head(RISK_QUEUE_MAX)
        .copy()
    )

    if queue.empty:
        return [], []

    # TreeSHAP contributions -- last column is bias term, omit it
    # Pass feature_names explicitly so XGBoost validates the feature set.
    feature_df = queue[list(FEATURE_COLUMNS)]
    shap_values = classifier.get_booster().predict(
        DMatrix(feature_df, feature_names=list(FEATURE_COLUMNS)),
        pred_contribs=True,
    )[:, :-1]

    alerts: list[dict[str, Any]] = []
    evidence: list[dict[str, Any]] = []

    for position, (_, row) in enumerate(queue.iterrows(), start=1):
        alert_id = f"alt_{position:05d}_{row['event_id']}"
        values = np.asarray(shap_values[position - 1])
        top_indices = np.argsort(np.abs(values))[::-1][:EVIDENCE_TOP_K]

        # Rule hits (same threshold logic as pipeline.py)
        rule_hits: list[str] = []
        if row["fan_out_ratio"] >= 0.75 and row["wallet_out_count"] >= 12:
            rule_hits.append("BR-02")
        if row["ip_rotation_rate"] >= 0.50 and row["wallet_unique_ips"] >= 8:
            rule_hits.append("BR-04")
        if row["inter_event_seconds"] <= 180 and row["graph_reach_proxy"] >= 8:
            rule_hits.append("BR-05")

        alerts.append({
            "alert_id": alert_id,
            "queue_rank": position,
            "event_id": row["event_id"],
            "entity_id": row["input_wallet"],
            "observed_at": row["observed_at"],
            "source_wallet": row["input_wallet"],
            "target_wallet": row["output_wallet"],
            "risk_score": int(row["risk_score"]),
            "ml_probability": round(float(row["ml_probability"]), 6),
            "novelty_score": round(float(row["novelty_score"]), 6),
            "graph_risk_score": round(float(row["graph_risk_score"]), 6),
            "rule_hits": rule_hits,
            "limitations": ["Synthetic evidence only", "Human review required"],
            "synthetic_notice": "Synthetic evidence only. Human review required.",
        })

        for idx in top_indices:
            feature = FEATURE_COLUMNS[int(idx)]
            contribution = float(values[int(idx)])
            evidence.append({
                "alert_id": alert_id,
                "feature": feature,
                "feature_value": round(float(row[feature]), 6),
                "shap_value": round(contribution, 6),
                "direction": "INCREASED_RISK" if contribution >= 0 else "DECREASED_RISK",
                "message": (
                    f"Synthetic feature {feature} "
                    f"{'increased' if contribution >= 0 else 'decreased'} the model risk score."
                ),
            })

    return alerts, evidence


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def _write_output(
    output_path: Path,
    run_id: str,
    manifest: dict[str, Any],
    alerts: list[dict[str, Any]],
    evidence: list[dict[str, Any]],
    input_event_count: int,
) -> None:
    """Write the predictions JSON to the specified output path."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "run_id": run_id,
        "data_classification": "SYNTHETIC_ONLY",
        "input_dataset_id": manifest.get("dataset_id", "unknown"),
        "input_event_count": input_event_count,
        "alert_count": len(alerts),
        "evidence_count": len(evidence),
        "risk_queue_threshold": RISK_QUEUE_THRESHOLD,
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "limitation": (
            "Synthetic investigation support only. Alerts are synthetic review priorities, "
            "not claims of wrongdoing, identity, ownership, or real-world risk. "
            "Human review required."
        ),
        "alerts": alerts,
        "evidence": evidence,
    }
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="TraceGraph AI — batch prediction CLI (synthetic data only).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Example:\n"
            "  PYTHONPATH=src python3 scripts/predict.py \\\n"
            "    --input  data/generated/sih26146-synthetic-60000-v2/events.csv \\\n"
            "    --manifest data/generated/sih26146-synthetic-60000-v2/manifest.json \\\n"
            "    --model-run artifacts/runs/sih26146-cpu-demo-2026-v1 \\\n"
            "    --output artifacts/predictions/demo-predictions.json"
        ),
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to synthetic events.csv (must have the canonical 15-column header).",
    )
    parser.add_argument(
        "--manifest",
        required=True,
        help="Path to manifest.json declaring SYNTHETIC_ONLY classification.",
    )
    parser.add_argument(
        "--model-run",
        required=True,
        dest="model_run",
        help="Path to the model run directory (e.g. artifacts/runs/sih26146-cpu-demo-2026-v1).",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Destination path for the predictions JSON output file.",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    input_path = Path(args.input)
    manifest_path = Path(args.manifest)
    model_run_dir = Path(args.model_run)
    output_path = Path(args.output)

    print("TraceGraph AI - Batch Prediction (Synthetic Data Only)")
    print("=" * 55)

    # 1. Validate manifest
    print(f"[1/7] Validating manifest: {manifest_path}")
    manifest = _validate_manifest(manifest_path)
    print(f"      data_classification = {manifest['data_classification']!r}  [OK]")

    # 2. Validate events CSV
    print(f"[2/7] Validating events CSV: {input_path}")
    events = _validate_csv(input_path)
    print(f"      {len(events):,} events loaded, canonical header verified  [OK]")

    # 3. Load model artifacts
    print(f"[3/7] Loading model artifacts from: {model_run_dir}")
    scaler, isolation, classifier = _load_models(model_run_dir)
    print("      RobustScaler, IsolationForest, XGBoost loaded  [OK]")

    # 4. Verify feature schema hash
    print("[4/7] Verifying feature schema hash")
    _verify_feature_schema(model_run_dir)
    print(f"      Feature schema SHA-256 verified ({FEATURE_SCHEMA_SHA256[:16]}...)  [OK]")

    # 5. Extract features (inference-safe, no labels)
    print("[5/7] Extracting 18 time-safe features (no labels used)")
    feature_frame = _extract_features_inference(events)
    print(f"      {len(feature_frame):,} feature rows extracted  [OK]")

    # 6. Score
    print("[6/7] Scoring with Isolation Forest + XGBoost")
    novelty_lower, novelty_upper = _get_train_novelty_range(model_run_dir, scaler, isolation)
    scored = _score_batch(feature_frame, scaler, isolation, classifier, novelty_lower, novelty_upper)
    queue_count = int((scored["risk_score"] >= RISK_QUEUE_THRESHOLD).sum())
    print(f"      Scoring complete. Events with risk_score >= {RISK_QUEUE_THRESHOLD}: {queue_count:,}")

    # 7. Build alerts and evidence
    print("[7/7] Building alert queue and TreeSHAP evidence")
    run_id = model_run_dir.name
    alerts, evidence = _build_alerts_and_evidence(scored, classifier)
    print(f"      Alerts queued: {len(alerts)}  Evidence records: {len(evidence)}")

    # Write output
    _write_output(output_path, run_id, manifest, alerts, evidence, len(events))
    print()
    print(f"Output written -> {output_path}")
    print("Limitation: Synthetic evidence only. Human review required.")


if __name__ == "__main__":
    main()
