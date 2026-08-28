"""Tests for services/ml/scripts/predict.py."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Paths — all relative to the services/ml/ directory
# ---------------------------------------------------------------------------

ML_DIR = Path(__file__).resolve().parent.parent  # services/ml/
PREDICT_SCRIPT = ML_DIR / "scripts" / "predict.py"
FIXTURE_DIR = ML_DIR / "data" / "generated" / "sih26146-synthetic-60000-v2"
EVENTS_CSV = FIXTURE_DIR / "events.csv"
MANIFEST_JSON = FIXTURE_DIR / "manifest.json"
MODEL_RUN_DIR = ML_DIR / "artifacts" / "runs" / "sih26146-cpu-demo-2026-v1"
SRC_DIR = ML_DIR / "src"


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _run_predict(extra_args: list[str], output_path: Path) -> subprocess.CompletedProcess:
    """Run predict.py as a subprocess with PYTHONPATH=src."""
    cmd = [
        sys.executable,
        str(PREDICT_SCRIPT),
        "--input", str(EVENTS_CSV),
        "--manifest", str(MANIFEST_JSON),
        "--model-run", str(MODEL_RUN_DIR),
        "--output", str(output_path),
        *extra_args,
    ]
    return subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        env={**__import__("os").environ, "PYTHONPATH": str(SRC_DIR)},
    )


# ---------------------------------------------------------------------------
# Skip condition — skip all tests if required fixtures/artifacts are absent
# ---------------------------------------------------------------------------

SKIP_REASON = "Committed ML fixtures or artifacts not present — run train_model.py first."
SKIP = not EVENTS_CSV.is_file() or not MODEL_RUN_DIR.is_dir()


@pytest.mark.skipif(SKIP, reason=SKIP_REASON)
class TestPredictHappyPath:
    """Predict.py produces a valid output JSON from the committed fixture."""

    def test_happy_path_produces_output(self, tmp_path: Path) -> None:
        out = tmp_path / "predictions.json"
        result = _run_predict([], out)
        assert result.returncode == 0, f"predict.py failed:\n{result.stderr}"
        assert out.is_file(), "Output file was not created."

    def test_output_json_structure(self, tmp_path: Path) -> None:
        out = tmp_path / "predictions.json"
        _run_predict([], out)
        payload = json.loads(out.read_text(encoding="utf-8"))

        assert payload["data_classification"] == "SYNTHETIC_ONLY"
        assert payload["input_event_count"] == 60_000
        assert payload["risk_queue_threshold"] == 65
        assert "limitation" in payload
        assert isinstance(payload["alerts"], list)
        assert isinstance(payload["evidence"], list)

    def test_output_has_alerts_and_evidence(self, tmp_path: Path) -> None:
        out = tmp_path / "predictions.json"
        _run_predict([], out)
        payload = json.loads(out.read_text(encoding="utf-8"))

        assert payload["alert_count"] > 0, "Expected at least one alert."
        assert payload["evidence_count"] > 0, "Expected at least one evidence record."

    def test_alert_fields_are_contract_safe(self, tmp_path: Path) -> None:
        """Verify required alert fields are present and forbidden truth labels are absent."""
        out = tmp_path / "predictions.json"
        _run_predict([], out)
        payload = json.loads(out.read_text(encoding="utf-8"))

        required = {
            "alert_id", "event_id", "risk_score", "ml_probability",
            "novelty_score", "graph_risk_score", "limitations", "synthetic_notice",
        }
        forbidden = {"is_anomalous", "scenario_id", "severity_truth", "scenario_truth_hidden"}

        content_str = out.read_text(encoding="utf-8")
        for field in forbidden:
            assert field not in content_str, f"Forbidden field '{field}' found in output."

        assert payload["alerts"], "Alert list is empty."
        first_alert = payload["alerts"][0]
        for field in required:
            assert field in first_alert, f"Required alert field '{field}' missing."

    def test_alert_risk_scores_in_range(self, tmp_path: Path) -> None:
        out = tmp_path / "predictions.json"
        _run_predict([], out)
        payload = json.loads(out.read_text(encoding="utf-8"))

        for alert in payload["alerts"]:
            assert 0 <= alert["risk_score"] <= 100, (
                f"risk_score {alert['risk_score']} out of [0, 100] range."
            )
            assert alert["risk_score"] >= 65, (
                f"Alert with risk_score {alert['risk_score']} below queue threshold."
            )

    def test_evidence_has_five_items_per_alert(self, tmp_path: Path) -> None:
        out = tmp_path / "predictions.json"
        _run_predict([], out)
        payload = json.loads(out.read_text(encoding="utf-8"))

        from collections import Counter
        counts = Counter(ev["alert_id"] for ev in payload["evidence"])
        for alert in payload["alerts"]:
            assert counts[alert["alert_id"]] == 5, (
                f"Alert {alert['alert_id']} should have 5 evidence items, "
                f"got {counts[alert['alert_id']]}."
            )

    def test_evidence_directions_are_valid(self, tmp_path: Path) -> None:
        out = tmp_path / "predictions.json"
        _run_predict([], out)
        payload = json.loads(out.read_text(encoding="utf-8"))
        valid_directions = {"INCREASED_RISK", "DECREASED_RISK"}
        for ev in payload["evidence"]:
            assert ev["direction"] in valid_directions, (
                f"Invalid direction: {ev['direction']!r}"
            )


@pytest.mark.skipif(SKIP, reason=SKIP_REASON)
class TestPredictValidation:
    """Predict.py rejects invalid inputs."""

    def test_rejects_missing_manifest(self, tmp_path: Path) -> None:
        out = tmp_path / "predictions.json"
        cmd = [
            sys.executable,
            str(PREDICT_SCRIPT),
            "--input", str(EVENTS_CSV),
            "--manifest", str(tmp_path / "nonexistent_manifest.json"),
            "--model-run", str(MODEL_RUN_DIR),
            "--output", str(out),
        ]
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            env={**__import__("os").environ, "PYTHONPATH": str(SRC_DIR)},
        )
        assert result.returncode != 0

    def test_rejects_non_synthetic_manifest(self, tmp_path: Path) -> None:
        bad_manifest = tmp_path / "bad_manifest.json"
        bad_manifest.write_text(
            json.dumps({"data_classification": "REAL_DATA"}),
            encoding="utf-8",
        )
        out = tmp_path / "predictions.json"
        cmd = [
            sys.executable,
            str(PREDICT_SCRIPT),
            "--input", str(EVENTS_CSV),
            "--manifest", str(bad_manifest),
            "--model-run", str(MODEL_RUN_DIR),
            "--output", str(out),
        ]
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            env={**__import__("os").environ, "PYTHONPATH": str(SRC_DIR)},
        )
        assert result.returncode != 0
        assert "SYNTHETIC_ONLY" in result.stderr or "SYNTHETIC_ONLY" in result.stdout

    def test_rejects_wrong_csv_header(self, tmp_path: Path) -> None:
        bad_csv = tmp_path / "events.csv"
        bad_csv.write_text(
            "event_id,wrong_column,another_bad_col\nsyn_evt_001,foo,bar\n",
            encoding="utf-8",
        )
        # Use the real manifest (classification check passes) but bad CSV
        out = tmp_path / "predictions.json"
        cmd = [
            sys.executable,
            str(PREDICT_SCRIPT),
            "--input", str(bad_csv),
            "--manifest", str(MANIFEST_JSON),
            "--model-run", str(MODEL_RUN_DIR),
            "--output", str(out),
        ]
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            env={**__import__("os").environ, "PYTHONPATH": str(SRC_DIR)},
        )
        assert result.returncode != 0

    def test_rejects_missing_model_artifacts(self, tmp_path: Path) -> None:
        fake_run = tmp_path / "fake_run"
        fake_run.mkdir()
        (fake_run / "artifacts").mkdir()
        out = tmp_path / "predictions.json"
        cmd = [
            sys.executable,
            str(PREDICT_SCRIPT),
            "--input", str(EVENTS_CSV),
            "--manifest", str(MANIFEST_JSON),
            "--model-run", str(fake_run),
            "--output", str(out),
        ]
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            env={**__import__("os").environ, "PYTHONPATH": str(SRC_DIR)},
        )
        assert result.returncode != 0
