"""Synthetic 1K Stream API Router — 70:30 Normal:Anomaly Benchmark Sequence.

Generates a curated 1,000-event synthetic transaction stream with:
  - 700 benign events (70%)
  - 300 suspicious / anomaly events (30%)
distributed across real timestamps and scenarios for live client evaluation.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any
import pandas as pd
from pydantic import BaseModel
from fastapi import APIRouter, Query

from app.core.config import RUN_DIR, RUN_ID
from app.schemas.common import DataEnvelope
from app.storage.artifact_store import store

router = APIRouter()


class StreamEventItem(BaseModel):
    """Single synthetic event in the 1K stream pool."""

    event_id: str
    observed_at: str
    source_wallet: str
    target_wallet: str
    amount_log: float
    is_scenario_anomaly: bool
    scenario_hint: str | None = None


class StreamPayload(BaseModel):
    """Payload for GET /api/v1/stream/events."""

    run_id: str
    total_events: int
    normal_count: int
    anomaly_count: int
    ratio_description: str
    events: list[StreamEventItem]
    data_classification: str = "SYNTHETIC_ONLY"


_CACHED_STREAM: list[StreamEventItem] | None = None


def _build_1k_stream() -> list[StreamEventItem]:
    """Curate exactly 700 benign and 300 anomalous events in time order."""
    global _CACHED_STREAM
    if _CACHED_STREAM is not None:
        return _CACHED_STREAM

    run_dir = Path(RUN_DIR)
    features_path = run_dir / "features.parquet"
    if not features_path.is_file():
        return []

    cols = ["event_id", "observed_at", "input_wallet", "output_wallet", "amount_log", "is_anomalous"]
    df = pd.read_parquet(features_path, columns=cols)

    # Separate normal (is_anomalous == 0) and anomaly (is_anomalous == 1)
    df_normal = df[df["is_anomalous"] == 0]
    df_anomaly = df[df["is_anomalous"] == 1]

    # Sample exactly 700 normal and 300 anomaly deterministically
    sample_normal = df_normal.sample(n=min(700, len(df_normal)), random_state=42)
    sample_anomaly = df_anomaly.sample(n=min(300, len(df_anomaly)), random_state=42)

    import random
    import numpy as np

    rng = random.Random(42)
    np_rng = np.random.RandomState(42)

    records_normal = sample_normal.to_dict(orient="records")
    records_anomaly = sample_anomaly.to_dict(orient="records")

    # Generate realistic timestamps across 24h:
    # 1. Normal traffic follows a natural diurnal bell curve (peak midday/afternoon)
    events_with_time: list[tuple[int, int, int, dict[str, Any]]] = []
    for row in records_normal:
        h = int(np.clip(np_rng.normal(13.5, 4.8), 0, 23))
        m = rng.randint(0, 59)
        s = rng.randint(0, 59)
        events_with_time.append((h, m, s, row))

    # 2. Anomalies occur in realistic attack burst waves throughout the day
    burst_centers = [7, 10, 13, 16, 19, 22]
    for row in records_anomaly:
        center = rng.choice(burst_centers)
        h = int(np.clip(np_rng.normal(center, 1.1), 0, 23))
        m = rng.randint(0, 59)
        s = rng.randint(0, 59)
        events_with_time.append((h, m, s, row))

    # Sort chronologically by (hour, minute, second)
    events_with_time.sort(key=lambda x: (x[0], x[1], x[2]))

    items: list[StreamEventItem] = []
    for h, m, s, row in events_with_time:
        stream_timestamp = f"2026-03-01T{h:02d}:{m:02d}:{s:02d}Z"
        items.append(
            StreamEventItem(
                event_id=row["event_id"],
                observed_at=stream_timestamp,
                source_wallet=row["input_wallet"],
                target_wallet=row["output_wallet"],
                amount_log=round(float(row["amount_log"]), 4),
                is_scenario_anomaly=bool(row["is_anomalous"] == 1),
            )
        )

    _CACHED_STREAM = items
    return items


@router.get("/stream/events", response_model=DataEnvelope[StreamPayload])
def get_stream_events(
    limit: int = Query(default=1000, ge=10, le=2000),
) -> DataEnvelope[StreamPayload]:
    """Return the curated 1,000-event synthetic stream for live dashboard evaluation."""
    all_events = _build_1k_stream()
    selected = all_events[:limit]
    anomaly_count = sum(1 for e in selected if e.is_scenario_anomaly)
    normal_count = len(selected) - anomaly_count

    payload = StreamPayload(
        run_id=RUN_ID,
        total_events=len(selected),
        normal_count=normal_count,
        anomaly_count=anomaly_count,
        ratio_description=f"{normal_count} Normal ({round(normal_count/max(1,len(selected))*100)}%) : {anomaly_count} Suspicious ({round(anomaly_count/max(1,len(selected))*100)}%)",
        events=selected,
        data_classification="SYNTHETIC_ONLY",
    )
    return DataEnvelope(data=payload)
