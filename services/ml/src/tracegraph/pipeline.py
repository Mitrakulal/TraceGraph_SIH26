"""Deterministic, CPU-only synthetic-data model pipeline for SIH26146.

This module never opens a socket, fetches network data, or accepts real wallet/IP
identifiers. It generates a synthetic fixture, extracts time-safe relationship
features, trains Isolation Forest and XGBoost locally, and writes auditable
artifacts for the TraceGraph AI demo.
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
import os
import random
import shutil
from collections import Counter, defaultdict, deque
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import joblib
import networkx as nx
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.preprocessing import RobustScaler
from xgboost import DMatrix, XGBClassifier


SEED = 2026
EVENT_COUNT = 60_000
WALLET_COUNT = 12_000
IP_COUNT = 4_000
SCENARIOS = (
    "STRUCTURING",
    "PEEL_CHAIN",
    "RAPID_HOP",
    "FAN_OUT",
    "FAN_IN",
    "PORT_SHIFT",
    "IP_ROTATION",
    "MIXER_LIKE_CLUSTER",
)
EVENT_COLUMNS = (
    "event_id", "observed_at", "txid", "input_wallet", "output_wallet",
    "amount_sats", "fee_sats", "script_type", "src_ip", "src_port",
    "dst_ip", "dst_port", "latency_ms", "peer_count_hint", "event_sequence",
)
FEATURE_COLUMNS = (
    "amount_log", "fee_rate", "latency_log", "peer_count_hint", "src_port_norm",
    "inter_event_seconds", "recent_count_10m", "wallet_out_count",
    "wallet_unique_destinations", "wallet_unique_ips", "ip_rotation_rate",
    "fan_out_ratio", "target_unique_senders", "source_out_degree",
    "target_in_degree", "degree_ratio", "graph_reach_proxy", "script_type_code",
)
SCRIPT_CODES = {"P2PKH": 0, "P2SH": 1, "P2WPKH": 2, "P2WSH": 3, "TAPROOT": 4}
REQUIRED_RUN_ARTIFACTS = (
    "artifacts/isolation_forest.joblib",
    "artifacts/robust_scaler.joblib",
    "artifacts/xgboost_model.json",
    "alerts.json",
    "evidence.json",
    "feature_schema.json",
    "features.parquet",
    "graph_summary.json",
    "metrics_test.json",
    "metrics_validation.json",
    "model_card.json",
    "threshold_table.json",
)


@dataclass(frozen=True)
class DatasetSummary:
    event_count: int
    anomaly_count: int
    benign_count: int
    seed: int
    events_sha256: str
    labels_sha256: str
    scenario_counts: dict[str, int]


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1_048_576), b""):
            digest.update(block)
    return digest.hexdigest()


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _wallet(index: int) -> str:
    return f"syn_w_{index:016x}"


def _txid(index: int) -> str:
    return f"syn_tx_{index:032x}"


def _ip(index: int) -> str:
    """Return a non-routable benchmarking-range address in 198.18.0.0/15."""
    value = index % 131_072
    second = 18 + value // 65_536
    remainder = value % 65_536
    return f"198.{second}.{remainder // 256}.{remainder % 256}"


def _event_id(sequence: int) -> str:
    """Create a deterministic synthetic-only event identifier."""
    return f"syn_evt_{sequence:012x}_{(sequence * 7919 + SEED):016x}"


def _amount(rng: random.Random, centre: float = 12.2, spread: float = 1.0) -> int:
    return max(1_000, min(100_000_000_000, int(math.exp(rng.gauss(centre, spread)))))


def _make_event(
    rng: random.Random,
    sequence: int,
    timestamp: datetime,
    source_wallet: str,
    target_wallet: str,
    amount_sats: int,
    src_ip: str,
    src_port: int,
    dst_ip: str,
    latency_ms: int,
    peer_count_hint: int,
    script_type: str = "P2WPKH",
) -> dict[str, Any]:
    fee = max(1, min(amount_sats - 1, int(amount_sats * rng.uniform(0.00005, 0.002))))
    return {
        "event_id": _event_id(sequence),
        "observed_at": _iso(timestamp),
        "txid": _txid(sequence),
        "input_wallet": source_wallet,
        "output_wallet": target_wallet,
        "amount_sats": amount_sats,
        "fee_sats": fee,
        "script_type": script_type,
        "src_ip": src_ip,
        "src_port": src_port,
        "dst_ip": dst_ip,
        "dst_port": 8333,
        "latency_ms": latency_ms,
        "peer_count_hint": peer_count_hint,
        "event_sequence": sequence,
    }


def _anomaly_event(
    rng: random.Random,
    sequence: int,
    timestamp: datetime,
    scenario: str,
    segment: int,
    offset: int,
    wallets: list[str],
) -> dict[str, Any]:
    """Create one labelled pattern event with a group unique to its time segment."""
    scenario_index = SCENARIOS.index(scenario)
    base = scenario_index * 900 + segment * 200
    primary = wallets[base]
    chain = wallets[base + 1: base + 41]
    senders = wallets[base + 50: base + 150]
    recipients = wallets[base + 160: base + 260]
    src_ip = _ip(40_000 + scenario_index * 3 + segment)
    target = chain[offset % len(chain)]
    amount = _amount(rng)
    port = 42_000 + offset % 50
    latency = max(20, int(rng.gauss(250, 45)))
    peer_count = 12

    if scenario == "STRUCTURING":
        amount = 99_000 + (offset % 7) * 35
        target = recipients[offset % 10]
        gap = 72
        source = primary
    elif scenario == "PEEL_CHAIN":
        source = chain[offset % 12]
        target = chain[(offset + 1) % 12]
        amount = 4_800_000 - (offset % 12) * 230_000
        gap = 85
    elif scenario == "RAPID_HOP":
        source = chain[offset % 10]
        target = chain[(offset + 1) % 10]
        amount = 2_400_000 + (offset % 5) * 750
        gap = 17
        latency = 70 + offset % 25
    elif scenario == "FAN_OUT":
        source = primary
        target = recipients[offset % 80]
        amount = 330_000 + (offset % 9) * 1_300
        gap = 12
    elif scenario == "FAN_IN":
        source = senders[offset % 100]
        target = primary
        amount = 420_000 + (offset % 11) * 700
        gap = 14
    elif scenario == "PORT_SHIFT":
        source = primary
        port = 1_024 + (offset * 7_919) % 63_000
        latency = 1_600 + (offset % 50) * 40
        gap = 38
    elif scenario == "IP_ROTATION":
        source = primary
        src_ip = _ip(80_000 + scenario_index * 1_000 + segment * 250 + offset)
        gap = 28
    else:  # MIXER_LIKE_CLUSTER
        source = senders[offset % 20]
        target = recipients[(offset * 7) % 20]
        amount = 1_000_000 + (offset % 3) * 10
        src_ip = _ip(100_000 + scenario_index * 20 + offset % 12)
        peer_count = 64
        gap = 19

    return _make_event(
        rng, sequence, timestamp + timedelta(seconds=offset * gap), source, target,
        amount, src_ip, port, _ip(65_000 + scenario_index), latency, peer_count,
    )


def generate_dataset(output_dir: Path, event_count: int = EVENT_COUNT, seed: int = SEED) -> DatasetSummary:
    """Generate a full synthetic fixture with labelled patterns in every time split."""
    if event_count < 6_000:
        raise ValueError("event_count must be at least 6,000")
    rng = random.Random(seed)
    if output_dir.exists():
        shutil.rmtree(output_dir)
    (output_dir / "truth").mkdir(parents=True)
    wallet_count = max(WALLET_COUNT, 8 * 900 + 300)
    wallets = [_wallet(i) for i in range(wallet_count)]
    anomaly_count = len(SCENARIOS) * 250
    benign_count = event_count - anomaly_count
    base = datetime(2026, 7, 1, tzinfo=timezone.utc)
    events: list[dict[str, Any]] = []
    scripts = ["P2PKH", "P2SH", "P2WPKH", "P2WSH", "TAPROOT"]

    # Benign events span 30 days, supplying realistic background for each split.
    for sequence in range(1, benign_count + 1):
        source = wallets[rng.randrange(len(wallets))]
        target = source
        while target == source:
            target = wallets[rng.randrange(len(wallets))]
        timestamp = base + timedelta(seconds=int(sequence * (30 * 86_400 / benign_count)) + rng.randrange(0, 35))
        events.append(_make_event(
            rng, sequence, timestamp, source, target, _amount(rng),
            _ip((sequence * 7) % IP_COUNT), rng.randrange(10_000, 60_000),
            _ip((sequence * 17) % IP_COUNT), max(10, int(rng.gauss(320, 105))),
            rng.randrange(4, 41), rng.choices(scripts, weights=[38, 16, 30, 8, 8], k=1)[0],
        ))

    # Every scenario appears in train (days 4/12), validation (days 19/20), and test (days 25/27).
    segment_starts = [base + timedelta(days=4), base + timedelta(days=12), base + timedelta(days=19), base + timedelta(days=25)]
    segment_counts = [100, 75, 40, 35]
    labels: list[dict[str, Any]] = []
    sequence = benign_count
    for scenario in SCENARIOS:
        for segment, (start, count) in enumerate(zip(segment_starts, segment_counts, strict=True)):
            for offset in range(count):
                sequence += 1
                event = _anomaly_event(rng, sequence, start, scenario, segment, offset, wallets)
                events.append(event)
                labels.append({
                    "event_id": event["event_id"], "entity_type": "wallet", "entity_id": event["input_wallet"],
                    "window_end": event["observed_at"], "is_anomalous": 1, "scenario_id": scenario,
                    "severity_truth": "critical" if scenario in {"RAPID_HOP", "MIXER_LIKE_CLUSTER"} else "high",
                })

    events.sort(key=lambda row: (row["observed_at"], row["event_sequence"]))
    events_path = output_dir / "events.csv"
    with events_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=EVENT_COLUMNS)
        writer.writeheader()
        writer.writerows(events)
    labels_path = output_dir / "truth" / "labels.csv"
    with labels_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=("event_id", "entity_type", "entity_id", "window_end", "is_anomalous", "scenario_id", "severity_truth"))
        writer.writeheader()
        writer.writerows(labels)

    manifest = {
        "schema_version": "2.0.0", "dataset_id": "sih26146-synthetic-60000-v2",
        "generator_name": "tracegraph-synthetic-generator", "generator_version": "2.0.0",
        "data_classification": "SYNTHETIC_ONLY", "seed": seed, "event_file": "events.csv",
        "event_row_count": len(events), "dataset_sha256": _sha256(events_path),
        "label_file": "truth/labels.csv", "label_row_count": len(labels), "label_access": "EVALUATOR_ONLY",
        "scenario_catalog": list(SCENARIOS), "allowed_ip_range": "198.18.0.0/15",
        "responsible_use": "Synthetic training data only. No real wallet, IP, identity, or blockchain inference is permitted.",
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    counts = dict(sorted(Counter(row["scenario_id"] for row in labels).items()))
    summary = DatasetSummary(len(events), len(labels), benign_count, seed, _sha256(events_path), _sha256(labels_path), counts)
    (output_dir / "data_summary.json").write_text(json.dumps(asdict(summary), indent=2) + "\n", encoding="utf-8")
    return summary


def validate_dataset(dataset_dir: Path) -> DatasetSummary:
    """Validate the local synthetic-only fixture before any model step."""
    manifest = json.loads((dataset_dir / "manifest.json").read_text(encoding="utf-8"))
    if manifest["data_classification"] != "SYNTHETIC_ONLY":
        raise ValueError("Only SYNTHETIC_ONLY fixtures are accepted")
    events_path = dataset_dir / "events.csv"
    labels_path = dataset_dir / "truth" / "labels.csv"
    if _sha256(events_path) != manifest["dataset_sha256"]:
        raise ValueError("events.csv SHA-256 does not match manifest")
    events = pd.read_csv(events_path)
    labels = pd.read_csv(labels_path)
    if tuple(events.columns) != EVENT_COLUMNS:
        raise ValueError("Event header does not match canonical contract")
    if len(events) != int(manifest["event_row_count"]) or len(labels) != int(manifest["label_row_count"]):
        raise ValueError("Manifest count mismatch")
    if events["event_id"].duplicated().any() or events["event_sequence"].duplicated().any():
        raise ValueError("Duplicate synthetic event IDs or sequences")
    if not events["src_ip"].str.startswith(("198.18.", "198.19.")).all() or not events["dst_ip"].str.startswith(("198.18.", "198.19.")).all():
        raise ValueError("Non-benchmark IP range detected")
    if not (events["amount_sats"] > events["fee_sats"]).all():
        raise ValueError("Invalid amount/fee relationship")
    scenario_counts = dict(sorted(labels["scenario_id"].value_counts().to_dict().items()))
    if set(scenario_counts) != set(SCENARIOS) or set(scenario_counts.values()) != {250}:
        raise ValueError("Unexpected scenario-label distribution")
    summary = DatasetSummary(len(events), len(labels), len(events) - len(labels), int(manifest["seed"]), _sha256(events_path), _sha256(labels_path), scenario_counts)
    (dataset_dir / "validation_report.json").write_text(json.dumps({"status": "PASS", **asdict(summary)}, indent=2) + "\n", encoding="utf-8")
    return summary


def _entropy(values: deque[int]) -> float:
    if not values:
        return 0.0
    counts = Counter(values)
    total = len(values)
    return -sum((count / total) * math.log2(count / total) for count in counts.values())


def _time_split(timestamp: pd.Timestamp, minimum: pd.Timestamp, maximum: pd.Timestamp) -> str:
    span = maximum - minimum
    fraction = (timestamp - minimum) / span if span.total_seconds() else 0.0
    if fraction <= 0.60:
        return "train"
    if fraction <= 0.80:
        return "validation"
    return "test"


def extract_features(dataset_dir: Path, output_dir: Path) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Create time-safe event features using only previously observed synthetic events."""
    events = pd.read_csv(dataset_dir / "events.csv", parse_dates=["observed_at"])
    labels = pd.read_csv(dataset_dir / "truth" / "labels.csv")
    events = events.sort_values(["observed_at", "event_sequence"], kind="stable").reset_index(drop=True)
    label_map = dict(zip(labels["event_id"], labels["scenario_id"], strict=True))
    minimum, maximum = events["observed_at"].min(), events["observed_at"].max()
    histories: dict[str, deque[tuple[pd.Timestamp, str, str, int]]] = defaultdict(deque)
    last_time: dict[str, pd.Timestamp] = {}
    destination_sets: dict[str, set[str]] = defaultdict(set)
    ip_sets: dict[str, set[str]] = defaultdict(set)
    sender_sets: dict[str, set[str]] = defaultdict(set)
    source_out: Counter[str] = Counter()
    target_in: Counter[str] = Counter()
    features: list[dict[str, Any]] = []
    graph = nx.DiGraph()

    for row in events.itertuples(index=False):
        now = row.observed_at
        source = row.input_wallet
        target = row.output_wallet
        history = histories[source]
        cutoff = now - pd.Timedelta(hours=24)
        while history and history[0][0] < cutoff:
            history.popleft()
        previous = last_time.get(source)
        elapsed = (now - previous).total_seconds() if previous is not None else 86_400.0
        prior_destinations = destination_sets[source]
        prior_ips = ip_sets[source]
        current_out = source_out[source]
        current_in = target_in[target]
        recent_count_10m = sum(1 for item in history if item[0] >= now - pd.Timedelta(minutes=10))
        amount = float(row.amount_sats)
        features.append({
            "event_id": row.event_id,
            "observed_at": _iso(now.to_pydatetime()),
            "input_wallet": source,
            "output_wallet": target,
            "scenario_id": label_map.get(row.event_id, "BENIGN"),
            "is_anomalous": int(row.event_id in label_map),
            "split": _time_split(now, minimum, maximum),
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
        history.append((now, target, row.src_ip, int(row.src_port)))
        last_time[source] = now
        destination_sets[source].add(target)
        ip_sets[source].add(row.src_ip)
        sender_sets[target].add(source)
        source_out[source] += 1
        target_in[target] += 1
        graph.add_edge(source, target, txid=row.txid, event_id=row.event_id)

    feature_frame = pd.DataFrame(features)
    output_dir.mkdir(parents=True, exist_ok=True)
    feature_frame.to_parquet(output_dir / "features.parquet", index=False)
    graph_summary = {
        "node_count": graph.number_of_nodes(), "edge_count": graph.number_of_edges(),
        "strongly_connected_components": nx.number_strongly_connected_components(graph),
        "feature_columns": list(FEATURE_COLUMNS),
        "split_counts": feature_frame["split"].value_counts().to_dict(),
        "split_label_counts": feature_frame.groupby("split")["is_anomalous"].sum().astype(int).to_dict(),
    }
    (output_dir / "graph_summary.json").write_text(json.dumps(graph_summary, indent=2) + "\n", encoding="utf-8")
    return feature_frame, graph_summary


def _baseline_scores(frame: pd.DataFrame, train_frame: pd.DataFrame) -> pd.Series:
    port_threshold = train_frame["src_port_norm"].mean() + 2.5 * train_frame["src_port_norm"].std(ddof=0)
    score = (
        ((frame["recent_count_10m"] >= 8) & (frame["wallet_out_count"] >= 8)).astype(int) * 15
        + ((frame["fan_out_ratio"] >= 0.75) & (frame["wallet_out_count"] >= 12)).astype(int) * 15
        + ((frame["target_unique_senders"] >= 12) & (frame["target_in_degree"] >= 12)).astype(int) * 15
        + ((frame["ip_rotation_rate"] >= 0.50) & (frame["wallet_unique_ips"] >= 8)).astype(int) * 15
        + ((frame["inter_event_seconds"] <= 180) & (frame["graph_reach_proxy"] >= 8)).astype(int) * 20
        + (frame["src_port_norm"] >= port_threshold).astype(int) * 10
    )
    return score.clip(upper=100).astype(int)


def _metric_bundle(y_true: np.ndarray, probability: np.ndarray, threshold: float = 0.65) -> dict[str, Any]:
    predicted = (probability >= threshold).astype(int)
    precision_curve, recall_curve, thresholds = precision_recall_curve(y_true, probability)
    del precision_curve, recall_curve, thresholds
    top_k = min(100, len(probability))
    ranked = np.argsort(probability)[::-1][:top_k]
    false_positives = int(((predicted == 1) & (y_true == 0)).sum())
    return {
        "pr_auc": round(float(average_precision_score(y_true, probability)), 6),
        "roc_auc": round(float(roc_auc_score(y_true, probability)), 6),
        "precision_at_100": round(float(y_true[ranked].mean()), 6),
        "recall_at_100": round(float(y_true[ranked].sum() / max(1, y_true.sum())), 6),
        "precision_at_threshold": round(float(precision_score(y_true, predicted, zero_division=0)), 6),
        "recall_at_threshold": round(float(recall_score(y_true, predicted, zero_division=0)), 6),
        "f1_at_threshold": round(float(f1_score(y_true, predicted, zero_division=0)), 6),
        "brier_score": round(float(brier_score_loss(y_true, probability)), 6),
        "false_positives_per_1000": round(false_positives * 1000 / max(1, len(y_true)), 6),
        "confusion_matrix": confusion_matrix(y_true, predicted, labels=[0, 1]).tolist(),
    }


def _select_threshold(y_true: np.ndarray, probability: np.ndarray) -> tuple[float, list[dict[str, Any]]]:
    table: list[dict[str, Any]] = []
    for threshold in np.arange(0.50, 1.00, 0.05):
        metrics = _metric_bundle(y_true, probability, float(threshold))
        table.append({"threshold": round(float(threshold), 2), **metrics})
    gates = [
        row for row in table
        if row["precision_at_threshold"] >= 0.80 and row["recall_at_threshold"] >= 0.55
        and row["false_positives_per_1000"] <= 25
    ]
    return (gates[0]["threshold"] if gates else max(table, key=lambda row: row["precision_at_threshold"])["threshold"]), table


def verify_run_artifacts(run_dir: Path) -> list[str]:
    """Return missing mandatory training artifacts, or an empty list when the run is complete."""
    return [relative for relative in REQUIRED_RUN_ARTIFACTS if not (run_dir / relative).is_file()]


def train_and_evaluate(dataset_dir: Path, run_dir: Path, seed: int = SEED) -> dict[str, Any]:
    """Train CPU models and write deterministic evaluation, alert, and evidence artifacts."""
    os.environ["PYTHONHASHSEED"] = str(seed)
    os.environ["OMP_NUM_THREADS"] = "1"
    os.environ["OPENBLAS_NUM_THREADS"] = "1"
    random.seed(seed)
    np.random.seed(seed)
    summary = validate_dataset(dataset_dir)
    if run_dir.exists():
        shutil.rmtree(run_dir)
    run_dir.mkdir(parents=True)
    frame, graph_summary = extract_features(dataset_dir, run_dir)
    train = frame[frame["split"] == "train"].copy()
    validation = frame[frame["split"] == "validation"].copy()
    test = frame[frame["split"] == "test"].copy()
    for split_name, split in {"train": train, "validation": validation, "test": test}.items():
        if split["is_anomalous"].sum() == 0:
            raise ValueError(f"{split_name} split has no labelled anomaly; fixture is invalid")
    x_train, y_train = train[list(FEATURE_COLUMNS)], train["is_anomalous"].to_numpy(dtype=int)
    x_val, y_val = validation[list(FEATURE_COLUMNS)], validation["is_anomalous"].to_numpy(dtype=int)
    x_test, y_test = test[list(FEATURE_COLUMNS)], test["is_anomalous"].to_numpy(dtype=int)

    scaler = RobustScaler().fit(x_train[y_train == 0])
    isolation = IsolationForest(
        n_estimators=300, max_samples=256, contamination=0.08, max_features=1.0,
        bootstrap=False, random_state=seed, n_jobs=1,
    ).fit(scaler.transform(x_train[y_train == 0]))
    class_weight = float((y_train == 0).sum() / max(1, (y_train == 1).sum()))
    classifier = XGBClassifier(
        objective="binary:logistic", n_estimators=400, max_depth=5, learning_rate=0.05,
        subsample=0.85, colsample_bytree=0.85, min_child_weight=3, reg_lambda=1.0,
        eval_metric="aucpr", random_state=seed, n_jobs=1, scale_pos_weight=class_weight,
    ).fit(x_train, y_train)

    def score(split: pd.DataFrame, x_values: pd.DataFrame) -> pd.DataFrame:
        result = split.copy()
        probability = classifier.predict_proba(x_values)[:, 1]
        raw_novelty = -isolation.score_samples(scaler.transform(x_values))
        train_novelty = -isolation.score_samples(scaler.transform(x_train))
        lower, upper = float(train_novelty.min()), float(train_novelty.max())
        novelty = np.clip((raw_novelty - lower) / max(1e-9, upper - lower), 0, 1)
        graph_raw = result["graph_reach_proxy"].to_numpy(dtype=float)
        graph_score = np.clip((graph_raw - graph_raw.min()) / max(1e-9, graph_raw.max() - graph_raw.min()), 0, 1)
        result["ml_probability"] = probability
        result["novelty_score"] = novelty
        result["graph_risk_score"] = graph_score
        result["baseline_score"] = _baseline_scores(result, train)
        result["risk_score"] = np.round(100 * np.clip(0.75 * probability + 0.15 * novelty + 0.10 * graph_score, 0, 1)).astype(int)
        return result

    validation_scored = score(validation, x_val)
    threshold, threshold_table = _select_threshold(y_val, validation_scored["ml_probability"].to_numpy())
    test_scored = score(test, x_test)
    test_metrics = _metric_bundle(y_test, test_scored["ml_probability"].to_numpy(), threshold)
    validation_metrics = _metric_bundle(y_val, validation_scored["ml_probability"].to_numpy(), threshold)
    queue = test_scored[test_scored["risk_score"] >= 65].copy()
    queue = queue.sort_values(["risk_score", "ml_probability"], ascending=False).head(250)

    # XGBoost exposes exact TreeSHAP feature contributions via pred_contribs.
    # The last contribution column is the bias term and is intentionally omitted.
    shap_values = (
        classifier.get_booster().predict(DMatrix(queue[list(FEATURE_COLUMNS)]), pred_contribs=True)[:, :-1]
        if not queue.empty
        else np.empty((0, len(FEATURE_COLUMNS)))
    )
    alerts: list[dict[str, Any]] = []
    evidence: list[dict[str, Any]] = []
    for position, (_, row) in enumerate(queue.iterrows(), start=1):
        alert_id = f"alt_{position:05d}_{row['event_id']}"
        values = np.asarray(shap_values[position - 1])
        top_indices = np.argsort(np.abs(values))[::-1][:5]
        rule_hits = []
        if row["fan_out_ratio"] >= 0.75 and row["wallet_out_count"] >= 12:
            rule_hits.append("BR-02")
        if row["ip_rotation_rate"] >= 0.50 and row["wallet_unique_ips"] >= 8:
            rule_hits.append("BR-04")
        if row["inter_event_seconds"] <= 180 and row["graph_reach_proxy"] >= 8:
            rule_hits.append("BR-05")
        alerts.append({
            "alert_id": alert_id, "queue_rank": position, "event_id": row["event_id"],
            "entity_id": row["input_wallet"], "observed_at": row["observed_at"],
            "risk_score": int(row["risk_score"]), "ml_probability": round(float(row["ml_probability"]), 6),
            "novelty_score": round(float(row["novelty_score"]), 6),
            "graph_risk_score": round(float(row["graph_risk_score"]), 6),
            "baseline_score": int(row["baseline_score"]), "scenario_truth_hidden": "NOT_EXPOSED_TO_UI",
            "rule_hits": rule_hits, "limitations": ["Synthetic evidence only", "Human review required"],
        })
        for index in top_indices:
            feature = FEATURE_COLUMNS[int(index)]
            contribution = float(values[int(index)])
            evidence.append({
                "alert_id": alert_id, "feature": feature, "feature_value": round(float(row[feature]), 6),
                "shap_value": round(contribution, 6), "direction": "INCREASED_RISK" if contribution >= 0 else "DECREASED_RISK",
                "message": f"Synthetic feature {feature} {'increased' if contribution >= 0 else 'decreased'} the model risk score.",
            })

    models_dir = run_dir / "artifacts"
    models_dir.mkdir()
    joblib.dump(scaler, models_dir / "robust_scaler.joblib")
    joblib.dump(isolation, models_dir / "isolation_forest.joblib")
    classifier.save_model(models_dir / "xgboost_model.json")
    feature_hash = hashlib.sha256("|".join(FEATURE_COLUMNS).encode()).hexdigest()
    (run_dir / "feature_schema.json").write_text(json.dumps({"features": list(FEATURE_COLUMNS), "sha256": feature_hash}, indent=2) + "\n", encoding="utf-8")
    (run_dir / "metrics_validation.json").write_text(json.dumps(validation_metrics, indent=2) + "\n", encoding="utf-8")
    (run_dir / "metrics_test.json").write_text(json.dumps(test_metrics, indent=2) + "\n", encoding="utf-8")
    (run_dir / "threshold_table.json").write_text(json.dumps(threshold_table, indent=2) + "\n", encoding="utf-8")
    (run_dir / "alerts.json").write_text(json.dumps(alerts, indent=2) + "\n", encoding="utf-8")
    (run_dir / "evidence.json").write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    model_card = {
        "model_name": "TraceGraph AI hybrid CPU model", "dataset": asdict(summary), "seed": seed,
        "feature_schema_sha256": feature_hash, "feature_count": len(FEATURE_COLUMNS),
        "models": {
            "isolation_forest": {"n_estimators": 300, "max_samples": 256, "contamination": 0.08, "n_jobs": 1},
            "xgboost": {"n_estimators": 400, "max_depth": 5, "learning_rate": 0.05, "n_jobs": 1, "scale_pos_weight": class_weight},
        },
        "selection_threshold": threshold, "validation_metrics": validation_metrics, "test_metrics": test_metrics,
        "queue_alert_count": len(alerts), "graph_summary": graph_summary,
        "responsible_use": "Synthetic-only decision support. Alerts require human review and do not infer identity, ownership, wrongdoing, or real-world risk.",
    }
    (run_dir / "model_card.json").write_text(json.dumps(model_card, indent=2) + "\n", encoding="utf-8")
    return model_card
