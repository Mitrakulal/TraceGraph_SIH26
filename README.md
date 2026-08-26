# TraceGraph AI — SIH26146

TraceGraph AI is a **CPU-only, offline, synthetic-data-only** model-training project for SIH26146. It generates synthetic Bitcoin-style transaction and IP metadata, extracts time-safe relationship and graph proxy features, trains an Isolation Forest plus XGBoost classifier, produces explainable synthetic alert artifacts, and saves evaluation metrics.

> The repository rejects the intended use of real wallets, real IP addresses, real blockchain data, identity resolution, or enforcement decisions. Every identifier and event in the generated fixture is synthetic.

## Authoritative Specifications

Read these before modifying code or asking a coding agent to extend the project:

- [`docs/TRACEGRAPH_AI_EXECUTION_SPEC.md`](docs/TRACEGRAPH_AI_EXECUTION_SPEC.md) defines the current implementation, exact data/model/artifact contracts, what is planned versus implemented, and vibe-coding rules.
- [`docs/SIH26146TraceGraphAI_model.md`](docs/SIH26146TraceGraphAI_model.md) defines the trained model, metrics, saved files, risk score, and required future inference interface.

## Quick Start

```bash
python3 -m pip install -r requirements.txt
PYTHONPATH=src python3 scripts/train_model.py --regenerate
PYTHONPATH=src pytest
```

The command generates `data/generated/sih26146-synthetic-60000-v2/` and trains the models into `artifacts/runs/sih26146-cpu-demo-2026-v1/`.

## Produced Artifacts

| File | Purpose |
|---|---|
| `data/generated/.../events.csv` | 60,000 synthetic metadata events |
| `data/generated/.../truth/labels.csv` | Evaluator-only labels for 2,000 synthetic anomalies |
| `artifacts/.../model_card.json` | Dataset provenance, configuration, validation and test metrics |
| `artifacts/.../metrics_*.json` | Frozen validation/test evaluation metrics |
| `artifacts/.../alerts.json` | Ranked synthetic review queue; truth labels are hidden |
| `artifacts/.../evidence.json` | Per-alert Tree SHAP evidence |
| `artifacts/.../artifacts/` | RobustScaler, Isolation Forest, and XGBoost model files |

## Model Design

The pipeline uses time-safe features calculated from events already observed at scoring time. The 30-day synthetic timeline is split by time into train (first 60%), validation (next 20%), and test (final 20%); every synthetic scenario has independent wallet groups in every split. The system uses rules only as a transparent baseline. Its ML signals are a novelty score from Isolation Forest and a supervised probability from XGBoost. The final risk score weights ML probability at 75%, novelty at 15%, and graph reach proxy at 10%; it retains XGBoost native TreeSHAP feature contributions for each queued synthetic alert with risk score at least 65.

## Verification

```bash
PYTHONPATH=src pytest
```

Tests assert generator determinism, synthetic-only validation, stable field contracts, and absence of label columns from the model feature schema.
