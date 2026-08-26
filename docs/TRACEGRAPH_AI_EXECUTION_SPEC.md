# TraceGraph AI — Execution Specification
## Current Trained Implementation and Vibe-Coding Contract

| Field | Fixed value |
|---|---|
| SIH problem statement | **SIH26146 — AI-Powered Monitoring & Analysis of Bitcoin Transaction Traffic** |
| Repository | `Mitrakulal/TraceGraph_SIH26` |
| Current implementation | Standalone Python 3 CPU-only training and artifact pipeline |
| Current model run | `sih26146-cpu-demo-2026-v1` |
| Current fixture | `sih26146-synthetic-60000-v2` |
| Data class | `SYNTHETIC_ONLY` |
| Seed | `2026` |
| Network access | Forbidden by product contract; no blockchain, wallet, IP, or API lookup exists |
| Specification status | **Authoritative for the current repository commit** |

> **Non-negotiable boundary.** TraceGraph AI is a synthetic investigation simulator. It never accepts, fetches, enriches, resolves, or evaluates real blockchain, wallet, IP, financial, identity, or personal data. An alert is a synthetic review priority, not a claim of wrongdoing, ownership, identity, or criminality.

---

## 1. What Is Implemented Now

The repository contains a fully trained CPU model and the deterministic code that created it. It does not yet contain the planned React dashboard, Node/tRPC API, SQLite case workspace, file-upload page, login, or `predict.py` command. These are future product layers and must not be represented as completed functionality.

| Capability | Status | Exact implementation / artifact |
|---|---|---|
| Deterministic synthetic fixture generation | Implemented | `src/tracegraph/pipeline.py::generate_dataset` |
| Synthetic fixture validation | Implemented | `src/tracegraph/pipeline.py::validate_dataset` |
| Chronological 60/20/20 data split | Implemented | `src/tracegraph/pipeline.py::_time_split` |
| Time-safe relationship/graph proxy features | Implemented | `src/tracegraph/pipeline.py::extract_features` |
| Rules baseline | Implemented | `src/tracegraph/pipeline.py::_baseline_scores` |
| Isolation Forest novelty model | Trained and committed | `artifacts/runs/.../artifacts/isolation_forest.joblib` |
| XGBoost classifier | Trained and committed | `artifacts/runs/.../artifacts/xgboost_model.json` |
| Native XGBoost TreeSHAP contributions | Implemented | `Booster.predict(..., pred_contribs=True)` |
| Ranked alert and evidence artifacts | Trained and committed | `alerts.json`, `evidence.json` |
| Model card and held-out metrics | Trained and committed | `model_card.json`, `metrics_*.json` |
| CLI inference against a new CSV | **Planned, not implemented** | Must be added as `scripts/predict.py` under Section 11 |
| Dashboard/API/database | **Planned, not implemented** | Must consume only existing artifact contracts |

---

## 2. Repository Contract

```text
TraceGraph_SIH26/
├── README.md
├── requirements.txt
├── pyproject.toml
├── src/tracegraph/
│   ├── __init__.py
│   └── pipeline.py                 # Authoritative generator, validator, features, models, scoring
├── scripts/
│   └── train_model.py              # Existing generate → validate → train → evaluate entry point
├── data/generated/
│   └── sih26146-synthetic-60000-v2/
│       ├── events.csv              # 60,000 synthetic source events
│       ├── manifest.json           # Fixture provenance and SHA-256
│       ├── data_summary.json
│       ├── validation_report.json
│       └── truth/labels.csv        # Training/evaluation only; never display in investigator UI
├── artifacts/runs/sih26146-cpu-demo-2026-v1/
│   ├── artifacts/
│   │   ├── robust_scaler.joblib
│   │   ├── isolation_forest.joblib
│   │   └── xgboost_model.json
│   ├── features.parquet
│   ├── feature_schema.json
│   ├── graph_summary.json
│   ├── metrics_validation.json
│   ├── metrics_test.json
│   ├── threshold_table.json
│   ├── model_card.json
│   ├── alerts.json
│   └── evidence.json
├── tests/
│   ├── test_pipeline.py
│   └── test_artifact_contract.py
└── docs/
    ├── TRACEGRAPH_AI_EXECUTION_SPEC.md
    └── SIH26146TraceGraphAI_model.md
```

**Ownership rule:** `pipeline.py` is the single source of truth for feature names, model settings, risk scoring, dataset validation, and artifact paths. Do not duplicate those constants in UI/API code; import or read the emitted JSON contracts instead.

---

## 3. Data Contract

### 3.1 Fixture Identity

| Item | Value |
|---|---|
| Dataset ID | `sih26146-synthetic-60000-v2` |
| Generator | `tracegraph-synthetic-generator` version `2.0.0` |
| Seed | `2026` |
| Event count | 60,000 |
| Benign events | 58,000 |
| Labelled anomalous events | 2,000 |
| Scenario count | 8, 250 labelled events each |
| Event SHA-256 | `0ada9cf18cc56cf16ebea0d88038b40c5ef2fef998d16b03a2c4ee0ecccb4963` |
| Label SHA-256 | `5e78160f6ad0f532155e630bff30d72039f6a836e470bab9fc7aff2a181a7fbc` |
| Synthetic IP range | `198.18.0.0/15` only |

The corrected version 2 fixture places independent synthetic scenario groups across the timeline so all three splits contain labels: **train 1,400**, **validation 320**, and **test 280**. This is required for a valid supervised evaluation and replaces the earlier fixture design that concentrated labels at the end of the timeline.

### 3.2 Canonical `events.csv` Header

The importer must require this exact order and reject any added, missing, renamed, or reordered field:

```text
event_id,observed_at,txid,input_wallet,output_wallet,amount_sats,fee_sats,script_type,src_ip,src_port,dst_ip,dst_port,latency_ms,peer_count_hint,event_sequence
```

| Field | Constraint | Used as model feature? |
|---|---|---|
| `event_id` | `syn_evt_*`; unique | No; event join key |
| `observed_at` | UTC timestamp | Indirectly; time-safe history window |
| `txid` | `syn_tx_` plus 32 hex characters | No; relationship record only |
| `input_wallet`, `output_wallet` | `syn_w_` plus 16 hex characters | Indirectly; history and graph proxy |
| `amount_sats`, `fee_sats` | `amount_sats > fee_sats >= 0` | Yes |
| `script_type` | `P2PKH`, `P2SH`, `P2WPKH`, `P2WSH`, `TAPROOT` | Yes, encoded as `script_type_code` |
| `src_ip`, `dst_ip` | Must be in `198.18.0.0/15` | Indirectly; synthetic IP count/rotation |
| `src_port` | 1024–65535 | Yes, normalized |
| `dst_port` | Exactly 8333 | No; validation only |
| `latency_ms` | 1–60,000 | Yes, log transformed |
| `peer_count_hint` | 1–128 | Yes |
| `event_sequence` | Unique positive integer | No; stable chronological tiebreaker |

### 3.3 Scenarios

| Scenario ID | Generated synthetic pattern | Signals the current model can learn |
|---|---|---|
| `STRUCTURING` | Near-threshold repeated values | Amount pattern, event frequency |
| `PEEL_CHAIN` | Sequential decreasing wallet chain | Degree and timing relationships |
| `RAPID_HOP` | Short-gap multi-hop path | Inter-event time, graph reach proxy |
| `FAN_OUT` | One wallet to many recipients | Fan-out ratio, destination count |
| `FAN_IN` | Many senders to one wallet | In-degree and sender count |
| `PORT_SHIFT` | Unusual source-port and latency behavior | Port normalization, latency feature |
| `IP_ROTATION` | Frequent synthetic source-IP rotation | IP count and rotation rate |
| `MIXER_LIKE_CLUSTER` | Dense similar-amount many-to-many pattern | Graph/relationship proxy features |

---

## 4. Exact Current Training Pipeline

The only supported training command is below. It is deterministic when run with the pinned requirements and seed 2026.

```bash
cd TraceGraph_SIH26
python3 -m pip install -r requirements.txt
PYTHONPATH=src python3 scripts/train_model.py --regenerate
PYTHONPATH=src pytest
```

The command performs this exact sequence:

1. `generate_dataset` deletes and recreates `data/generated/sih26146-synthetic-60000-v2/` from seed 2026.
2. `validate_dataset` verifies synthetic-only classification, SHA-256, canonical columns, uniqueness, benchmark IP range, amount/fee relation, and scenario count.
3. `extract_features` sorts events by `observed_at,event_sequence` and calculates features using prior observed events only.
4. `_time_split` assigns chronological train, validation, and test partitions at 60%, 80%, and 100% of the event-time span.
5. Isolation Forest fits **only the benign rows in the training partition**.
6. XGBoost fits on training features and the evaluator-only synthetic labels.
7. Validation selects an operating probability threshold from 0.50–0.95 in 0.05 increments.
8. Held-out test metrics are written once. The code does not refit after observing the test result.
9. The worker writes model artifacts, feature schema, metrics, alerts, and five feature contributions per queued alert.

### 4.1 CPU Reproducibility Rules

| Rule | Exact setting |
|---|---|
| Python random seed | `2026` |
| NumPy random seed | `2026` |
| `PYTHONHASHSEED` | `2026` |
| OpenMP threads | `1` |
| OpenBLAS threads | `1` |
| Isolation Forest threads | `n_jobs=1` |
| XGBoost threads | `n_jobs=1` |
| Machine profile | 4+ logical CPU cores; 16 GB RAM recommended; GPU not required |

---

## 5. Current Feature Contract

The trained model requires these **18 features in this exact order**. `feature_schema.json` stores the order and the SHA-256 `6bcd69da4ca91ccb9b685639d538cd91437616edb9c1c5fb2f4be7a96ef5fcca`.

| Order | Feature | Current implementation meaning |
|---:|---|---|
| 1 | `amount_log` | `log1p(amount_sats)` |
| 2 | `fee_rate` | `fee_sats / max(1, amount_sats)` |
| 3 | `latency_log` | `log1p(latency_ms)` |
| 4 | `peer_count_hint` | Source event value |
| 5 | `src_port_norm` | `src_port / 65535` |
| 6 | `inter_event_seconds` | Seconds since prior event for input wallet, capped at 86,400 |
| 7 | `recent_count_10m` | Prior input-wallet events in the preceding 10 minutes |
| 8 | `wallet_out_count` | Prior input-wallet events in the preceding 24 hours |
| 9 | `wallet_unique_destinations` | Distinct previous output wallets for input wallet |
| 10 | `wallet_unique_ips` | Distinct previous source IPs for input wallet |
| 11 | `ip_rotation_rate` | Distinct prior source IPs / prior 24-hour input events |
| 12 | `fan_out_ratio` | Distinct prior output wallets / prior 24-hour input events |
| 13 | `target_unique_senders` | Distinct prior input wallets for current output wallet |
| 14 | `source_out_degree` | Prior outgoing count for source wallet |
| 15 | `target_in_degree` | Prior incoming count for target wallet |
| 16 | `degree_ratio` | Prior source outgoing / `max(1, prior target incoming)` |
| 17 | `graph_reach_proxy` | Prior source outgoing + target incoming + unique destinations |
| 18 | `script_type_code` | Fixed mapping: P2PKH=0, P2SH=1, P2WPKH=2, P2WSH=3, TAPROOT=4 |

**Never add** `is_anomalous`, `scenario_id`, `severity_truth`, alert score, review status, or any truth label to the feature frame. They are leakage fields.

---

## 6. Current Models, Scores, and Explanations

| Component | Exact current behavior |
|---|---|
| Rules baseline | Calculates six visible rule checks in `_baseline_scores`; saved separately from ML probability |
| RobustScaler | Fits on benign training features; used before Isolation Forest |
| Isolation Forest | 300 estimators, `max_samples=256`, contamination 0.08, seed 2026, `n_jobs=1`; scores novelty |
| XGBoost | 400 estimators, max depth 5, learning rate 0.05, subsample 0.85, column sample 0.85, min child weight 3, L2 lambda 1.0, seed 2026, `n_jobs=1` |
| Class weighting | `scale_pos_weight=24.857142857142858`, derived from the actual training split |
| Feature explanations | XGBoost native `pred_contribs=True`; top five absolute feature contributions per queue alert |

### 6.1 Risk Score and Queue

```text
risk_score = round(100 * clamp(
    0.75 * ml_probability
  + 0.15 * novelty_score
  + 0.10 * graph_risk_score,
  0,
  1
))
```

The committed run uses an **operating probability threshold of 0.50** for evaluation metrics. Independently, the alert queue contains the top 250 test events with `risk_score >= 65`, sorted descending by `risk_score` and then `ml_probability`. The user interface must never call this a “fraud score”; use **synthetic anomaly review score**.

### 6.2 Alert Contract

`alerts.json` contains one object per ranked synthetic alert. It includes `alert_id`, queue rank, event/entity ID, observed time, risk score, ML probability, novelty score, graph risk score, baseline score, rule hits, and limitations. It deliberately stores `scenario_truth_hidden: "NOT_EXPOSED_TO_UI"`.

`evidence.json` contains exactly five contribution records for every queued alert. Each record has `alert_id`, `feature`, `feature_value`, `shap_value`, `direction`, and a plain-language synthetic evidence message.

---

## 7. Completed Run Results

| Metric | Validation | Held-out test |
|---|---:|---:|
| PR-AUC | 0.999990 | 0.999962 |
| ROC-AUC | 1.000000 | 0.999999 |
| Precision at 100 | 1.000000 | 1.000000 |
| Recall at 100 | 0.312500 | 0.357143 |
| Precision at operating threshold | 0.996885 | 0.982456 |
| Recall at operating threshold | 1.000000 | 1.000000 |
| F1 at operating threshold | 0.998440 | 0.991150 |
| Brier score | 0.000181 | 0.000270 |
| False positives per 1,000 events | 0.083893 | 0.420875 |

These results are valid **only for the controlled synthetic generator used here**. They are not evidence of real-world detection accuracy. The test partition has 280 labelled synthetic anomalies, so a top-100 list can capture at most 35.7% of them; that is why recall at 100 is not used as the operating-threshold recall metric.

---

## 8. Artifact Acceptance Contract

The following files must all exist before a run can be called complete. `verify_run_artifacts` enforces this list.

```text
artifacts/robust_scaler.joblib
artifacts/isolation_forest.joblib
artifacts/xgboost_model.json
features.parquet
feature_schema.json
graph_summary.json
metrics_validation.json
metrics_test.json
threshold_table.json
model_card.json
alerts.json
evidence.json
```

The completed committed run contains 250 alerts and 1,250 evidence records. Every alert must have five associated feature-contribution records and limitations stating **Synthetic evidence only** and **Human review required**.

---

## 9. Test Contract

```bash
PYTHONPATH=src pytest
```

The current suite must pass before committing model changes.

| Test | Required proof |
|---|---|
| `test_generator_is_deterministic_and_valid` | Same seed produces identical fixture hashes; synthetic validation passes |
| `test_contracts_are_stable` | Header order and feature list remain stable; label fields remain absent |
| `test_required_run_artifacts_are_verified` | A run is incomplete unless every mandatory model artifact exists |

---

## 10. Vibe-Coding Rules

1. **Do not rename or reorder the 18 features** without retraining, updating `feature_schema.json`, and generating a new model card.
2. **Do not use a real input source.** The validator must reject data unless the manifest says `SYNTHETIC_ONLY` and generated IDs/ranges match the contract.
3. **Do not retrain in a browser request.** Training is an explicit local batch command; the dashboard only reads completed artifacts.
4. **Do not expose `truth/labels.csv` or `scenario_truth_hidden` in the investigator view.** Labels are evaluation-only.
5. **Do not replace evidence with generic AI text.** Read `evidence.json` and show actual feature contributions.
6. **Do not claim real-world accuracy.** Use the required synthetic-only limitation in every model screen and demo.
7. **Commit generated artifacts only for the named demo run.** Future experimental runs stay ignored unless explicitly promoted after tests and documentation updates.

---

## 11. Next Implementation Contract: `scripts/predict.py`

The current repository has trained artifacts but no standalone prediction command. The next coding task must create exactly this interface:

```bash
PYTHONPATH=src python3 scripts/predict.py \
  --input data/generated/sih26146-synthetic-60000-v2/events.csv \
  --model-run artifacts/runs/sih26146-cpu-demo-2026-v1 \
  --output artifacts/predictions/demo-predictions.json
```

`predict.py` must: validate the supplied synthetic fixture; build features through the same `extract_features` contract; load the scaler, Isolation Forest, and XGBoost model; calculate the same 0–100 risk score; write predictions and five contribution records; and refuse input that lacks a synthetic-only manifest. It must not train, regenerate data, contact a network, expose labels, or accept a single raw event without the required historical context.

## 12. Planned UI/API Contract

When UI implementation begins, it must read only the current artifact contracts: `model_card.json`, `alerts.json`, `evidence.json`, `graph_summary.json`, and metrics JSON. The initial screens are Overview, Alert Queue, Alert Evidence, Graph Explorer, Run History, and Model Evaluation. They are **planned**, not currently implemented.

The dashboard must display the completed run ID, fixture ID/hash, training seed, 250 alert count, evidence count, metric values, and the persistent synthetic-only boundary. A UI must never infer or display real identity, ownership, criminality, or enforcement actions.
