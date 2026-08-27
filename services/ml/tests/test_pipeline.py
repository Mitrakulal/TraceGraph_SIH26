from pathlib import Path

from tracegraph.pipeline import EVENT_COLUMNS, FEATURE_COLUMNS, generate_dataset, validate_dataset


def test_generator_is_deterministic_and_valid(tmp_path: Path) -> None:
    first = tmp_path / "first"
    second = tmp_path / "second"
    summary_one = generate_dataset(first, event_count=6_000, seed=2026)
    summary_two = generate_dataset(second, event_count=6_000, seed=2026)
    assert summary_one.events_sha256 == summary_two.events_sha256
    assert summary_one.labels_sha256 == summary_two.labels_sha256
    assert summary_one.anomaly_count == 2_000
    validated = validate_dataset(first)
    assert validated.event_count == 6_000
    assert set(validated.scenario_counts.values()) == {250}


def test_contracts_are_stable() -> None:
    assert EVENT_COLUMNS[0] == "event_id"
    assert EVENT_COLUMNS[-1] == "event_sequence"
    assert "is_anomalous" not in FEATURE_COLUMNS
    assert "scenario_id" not in FEATURE_COLUMNS
