# TraceGraph AI ML Workspace

This directory contains the only authoritative Python implementation of synthetic generation, validation, feature extraction, model training, evaluation, and model artifacts.

## Current Commands

```bash
cd services/ml
python3 -m pip install -r requirements.txt
PYTHONPATH=src python3 scripts/train_model.py --regenerate
PYTHONPATH=src pytest
```

The current trained run is located at `artifacts/runs/sih26146-cpu-demo-2026-v1/`. The future `scripts/predict.py` must load that run to score a valid new synthetic batch without retraining.

The API may read safe output artifacts from this workspace. It must not duplicate feature or model code. The frontend must never import from this directory.
