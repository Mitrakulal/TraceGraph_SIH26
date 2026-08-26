# Trained Model Report — TraceGraph AI

## Run Identity

| Field | Value |
|---|---|
| Run ID | `sih26146-cpu-demo-2026-v1` |
| Dataset | `sih26146-synthetic-60000-v2` |
| Dataset seed | `2026` |
| Events | 60,000 synthetic Bitcoin/IP metadata records |
| Labelled anomalies | 2,000 across eight generated scenarios |
| Training mode | CPU-only, `n_jobs=1`, no network/data-fetch operations |
| Feature count | 18 time-safe metadata and relationship features |
| Explainability | Native XGBoost TreeSHAP feature contributions |

> **Interpretation warning.** These numbers measure how well a controlled model recognizes the project’s deliberately generated synthetic patterns. They do not establish performance on real blockchain, wallet, IP, identity, financial, or law-enforcement data, which this repository does not use or support.

## Models

| Component | Configuration |
|---|---|
| Rule baseline | Six transparent metadata/graph proxy checks, recorded separately |
| Isolation Forest | 300 trees, `max_samples=256`, `contamination=0.08`, random seed 2026 |
| XGBoost | 400 estimators, depth 5, learning rate 0.05, fixed seed and CPU thread count 1 |
| Final risk score | 75% classifier probability, 15% novelty score, 10% graph-reach proxy |

## Results

| Metric | Validation | Test |
|---|---:|---:|
| PR-AUC | 0.999990 | 0.999962 |
| ROC-AUC | 1.000000 | 0.999999 |
| Precision at 100 | 1.000000 | 1.000000 |
| Recall at 100 | 0.312500 | 0.357143 |
| Precision at chosen threshold | 0.996885 | 0.982456 |
| Recall at chosen threshold | 1.000000 | 1.000000 |
| F1 at chosen threshold | 0.998440 | 0.991150 |
| False positives / 1,000 windows | 0.083893 | 0.420875 |

The test partition contains 280 labelled anomalies, so a top-100 queue can recover at most 35.7% of all test anomalies. This is why **precision at 100** and **recall at the chosen operating threshold** are reported separately.

## Artifact Verification

The committed run contains the XGBoost model, Isolation Forest, scaler, feature parquet file, schema hash, metrics, threshold table, 250 ranked synthetic alerts, and 1,250 evidence records—five feature contributions per alert. Run artifact completeness is verified by `verify_run_artifacts` and its unit test.

## Reproduction

```bash
python3 -m pip install -r requirements.txt
PYTHONPATH=src python3 scripts/train_model.py --regenerate
PYTHONPATH=src pytest
```

The run is deterministic under the pinned dependency set, seed 2026, and CPU thread settings recorded in `src/tracegraph/pipeline.py`.
