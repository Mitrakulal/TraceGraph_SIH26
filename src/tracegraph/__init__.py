"""Offline synthetic TraceGraph AI training package."""

from .pipeline import generate_dataset, train_and_evaluate, verify_run_artifacts

__all__ = ["generate_dataset", "train_and_evaluate", "verify_run_artifacts"]
