"""Live model inference service for TraceGraph AI.

Loads the committed ML artifacts (RobustScaler, IsolationForest, XGBoost)
from the current run directory and scores individual synthetic events on
demand. This proves alert scores come from real model inference on CPU
rather than hardcoded values.

Ground-truth labels (is_anomalous / scenario_id) are NEVER exposed —
only model outputs. All data is SYNTHETIC_ONLY.
"""

from __future__ import annotations

import json
import random
import time
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier

from app.core.config import RUN_ID, RUN_DIR


class ScoringService:
    """Lazy-loading singleton for live single-event model inference."""

    _instance: "ScoringService | None" = None

    def __init__(self) -> None:
        self._loaded = False
        self.scaler: Any = None
        self.isolation: Any = None
        self.classifier: XGBClassifier | None = None
        self.feature_columns: list[str] = []
        self._features_by_event: dict[str, np.ndarray] = {}
        self._novelty_range: tuple[float, float] = (0.0, 1.0)
        self._graph_range: tuple[float, float] = (0.0, 1.0)
        self._all_event_ids: list[str] = []

    @classmethod
    def instance(cls) -> "ScoringService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return

        run_dir = Path(RUN_DIR)
        artifacts_dir = run_dir / "artifacts"
        paths = [
            artifacts_dir / "robust_scaler.joblib",
            artifacts_dir / "isolation_forest.joblib",
            artifacts_dir / "xgboost_model.json",
            run_dir / "feature_schema.json",
            run_dir / "features.parquet",
        ]
        for path in paths:
            if not path.is_file():
                raise FileNotFoundError(f"Required model artifact missing: {path}")

        self.scaler = joblib.load(paths[0])
        self.isolation = joblib.load(paths[1])
        classifier = XGBClassifier()
        classifier.load_model(str(paths[2]))
        self.classifier = classifier

        schema = json.loads(paths[3].read_text(encoding="utf-8"))
        self.feature_columns = list(schema["features"])

        frame = pd.read_parquet(paths[4], columns=["event_id"] + self.feature_columns)
        self._all_event_ids = frame["event_id"].tolist()
        self._features_by_event = {
            row.event_id: np.asarray(
                [getattr(row, col) for col in self.feature_columns], dtype=float
            )
            for row in frame.itertuples(index=False)
        }

        # Novelty normalization range: benign training rows (same as pipeline).
        full = pd.read_parquet(
            paths[4],
            columns=["split", "is_anomalous"] + self.feature_columns,
        )
        benign_train = full[(full["split"] == "train") & (full["is_anomalous"] == 0)][
            self.feature_columns
        ].to_numpy(dtype=float)
        if len(benign_train) > 0:
            train_novelty = -self.isolation.score_samples(self.scaler.transform(benign_train))
            self._novelty_range = (float(train_novelty.min()), float(train_novelty.max()))

        # Graph score normalization: full-dataset range of graph_reach_proxy.
        if "graph_reach_proxy" in self.feature_columns:
            graph_col = frame["graph_reach_proxy"].to_numpy(dtype=float)
            self._graph_range = (float(graph_col.min()), float(graph_col.max()))

        self._loaded = True

    def score_event(self, event_id: str) -> dict[str, Any]:
        """Run live model inference on one synthetic event."""
        self._ensure_loaded()

        if event_id not in self._features_by_event:
            raise KeyError(f"Unknown event_id '{event_id}'")

        x = self._features_by_event[event_id].reshape(1, -1)

        started = time.perf_counter()
        probability = float(self.classifier.predict_proba(x)[:, 1][0])
        raw_novelty = float(-self.isolation.score_samples(self.scaler.transform(x))[0])
        elapsed_ms = round((time.perf_counter() - started) * 1000.0, 2)

        lower, upper = self._novelty_range
        novelty = float(np.clip((raw_novelty - lower) / max(1e-9, upper - lower), 0.0, 1.0))

        g_lower, g_upper = self._graph_range
        graph_raw = float(x[0][self.feature_columns.index("graph_reach_proxy")])
        graph_score = float(
            np.clip((graph_raw - g_lower) / max(1e-9, g_upper - g_lower), 0.0, 1.0)
        )

        risk_score = int(
            round(
                100
                * float(np.clip(0.75 * probability + 0.15 * novelty + 0.10 * graph_score, 0.0, 1.0))
            )
        )

        features_used = {
            col: round(float(self._features_by_event[event_id][i]), 6)
            for i, col in enumerate(self.feature_columns)
        }

        return {
            "event_id": event_id,
            "model_run_id": RUN_ID,
            "inference_time_ms": elapsed_ms,
            "features_used": features_used,
            "feature_count": len(self.feature_columns),
            "ml_probability": round(probability, 6),
            "novelty_score": round(novelty, 6),
            "graph_risk_score": round(graph_score, 6),
            "risk_score": risk_score,
            "risk_threshold": 65,
            "is_alert": risk_score >= 65,
            "data_classification": "SYNTHETIC_ONLY",
            "limitation": (
                "Live model inference on synthetic data only. Scores are synthetic review "
                "priorities, not claims of wrongdoing. Human review required."
            ),
        }

    def sample_events(self, background_count: int = 6, alert_count: int = 5) -> dict[str, Any]:
        """Return sample event IDs for the live-scoring picker."""
        self._ensure_loaded()

        from app.storage.artifact_store import store

        if not store.is_loaded:
            store.load()

        background = random.sample(
            self._all_event_ids, min(background_count, len(self._all_event_ids))
        )
        alert_events = [
            {"alert_id": alert["alert_id"], "event_id": alert["event_id"]}
            for alert in store.alerts_list[:alert_count]
        ]

        return {
            "background_events": background,
            "alert_events": alert_events,
            "total_events": len(self._all_event_ids),
            "data_classification": "SYNTHETIC_ONLY",
        }


def get_scoring_service() -> ScoringService:
    return ScoringService.instance()
