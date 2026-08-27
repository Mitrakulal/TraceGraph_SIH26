from pathlib import Path

from tracegraph.pipeline import REQUIRED_RUN_ARTIFACTS, verify_run_artifacts


def test_required_run_artifacts_are_verified(tmp_path: Path) -> None:
    assert verify_run_artifacts(tmp_path) == list(REQUIRED_RUN_ARTIFACTS)
    for relative in REQUIRED_RUN_ARTIFACTS:
        target = tmp_path / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("fixture", encoding="utf-8")
    assert verify_run_artifacts(tmp_path) == []
