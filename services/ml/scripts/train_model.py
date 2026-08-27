"""Generate, validate, train, and report the offline TraceGraph AI model."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from tracegraph.pipeline import generate_dataset, train_and_evaluate, validate_dataset


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the deterministic CPU-only TraceGraph AI model.")
    parser.add_argument("--dataset", type=Path, default=Path("data/generated/sih26146-synthetic-60000-v2"))
    parser.add_argument("--run", type=Path, default=Path("artifacts/runs/sih26146-cpu-demo-2026-v1"))
    parser.add_argument("--regenerate", action="store_true", help="Regenerate the committed synthetic fixture before training.")
    args = parser.parse_args()
    if args.regenerate or not (args.dataset / "manifest.json").exists():
        summary = generate_dataset(args.dataset)
        print("Generated synthetic fixture:")
        print(json.dumps(summary.__dict__, indent=2))
    validated = validate_dataset(args.dataset)
    print("Validated synthetic fixture:")
    print(json.dumps(validated.__dict__, indent=2))
    model_card = train_and_evaluate(args.dataset, args.run)
    print("Training completed:")
    print(json.dumps({
        "validation": model_card["validation_metrics"], "test": model_card["test_metrics"],
        "queue_alert_count": model_card["queue_alert_count"], "run": str(args.run),
    }, indent=2))


if __name__ == "__main__":
    main()
