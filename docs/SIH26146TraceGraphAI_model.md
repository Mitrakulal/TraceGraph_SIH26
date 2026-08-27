# SIH26146 TraceGraph AI — Model Specification
## Exact Contract for the Currently Trained CPU Model

| Model property | Current value |
|---|---|
| Model run directory | `services/ml/artifacts/runs/sih26146-cpu-demo-2026-v1/` |
| Dataset | `sih26146-synthetic-60000-v2` |
| Dataset seed | `2026` |
| Events / labels | 60,000 / 2,000 synthetic only |
| Model architecture | Isolation Forest novelty signal + XGBoost binary classifier + deterministic graph proxy |
| CPU requirement | CPU only; `n_jobs=1`; no GPU required |
| Training entry point | `cd services/ml && PYTHONPATH=src python3 scripts/train_model.py --regenerate` |
| Current inference command | **Not implemented yet**; exact required interface is in Section 9 |

> **Model limitation.** This is a trained model for the repository’s controlled synthetic scenarios. It does not analyze real Bitcoin transactions, wallets, IP addresses, identities, or crime. It must only prioritize synthetic records for human review.

---

## 1. Saved Model Files

| File | Load method | Role |
|---|---|---|
| `services/ml/artifacts/runs/.../artifacts/robust_scaler.joblib` | `joblib.load` | Scales feature vectors before Isolation Forest scoring |
| `services/ml/artifacts/runs/.../artifacts/isolation_forest.joblib` | `joblib.load` | Produces a novelty signal based on benign training patterns |
| `services/ml/artifacts/runs/.../artifacts/xgboost_model.json` | `XGBClassifier().load_model` | Produces the supervised synthetic-anomaly probability |
| `feature_schema.json` | JSON read | Locks the exact ordered 18-feature contract |
| `model_card.json` | JSON read | Provenance, model settings, metrics, and limitations |

The trained files are committed to Git and are not placeholders. The Isolation Forest file is approximately 3.97 MB, and the XGBoost JSON model plus feature schema form the reproducible classifier contract.

---

## 2. Input Requirements

The model is **not** a one-row classifier. It needs chronological context to calculate wallet history, relationship, IP-rotation, and graph proxy features. Therefore the accepted input is a batch CSV plus a valid synthetic-only manifest, not a manually typed transaction.

```text
<input-dataset>/
  manifest.json
  events.csv
```

The CSV must have this exact header:

```text
event_id,observed_at,txid,input_wallet,output_wallet,amount_sats,fee_sats,script_type,src_ip,src_port,dst_ip,dst_port,latency_ms,peer_count_hint,event_sequence
```

The manifest must contain `data_classification: "SYNTHETIC_ONLY"`, a matching SHA-256, and generator information. Any non-synthetic identifier or IP outside `198.18.0.0/15` is invalid by contract.

---

## 3. Feature Schema

The model reads these features in this exact order. The order must match `feature_schema.json`; changing it invalidates the trained model.

```text
amount_log
fee_rate
latency_log
peer_count_hint
src_port_norm
inter_event_seconds
recent_count_10m
wallet_out_count
wallet_unique_destinations
wallet_unique_ips
ip_rotation_rate
fan_out_ratio
target_unique_senders
source_out_degree
target_in_degree
degree_ratio
graph_reach_proxy
script_type_code
```

| Feature group | Features | Why it exists |
|---|---|---|
| Raw metadata transforms | `amount_log`, `fee_rate`, `latency_log`, `peer_count_hint`, `src_port_norm`, `script_type_code` | Normalizes values from the event record |
| Time history | `inter_event_seconds`, `recent_count_10m`, `wallet_out_count` | Measures velocity and burst behavior using past observations only |
| Relationship history | `wallet_unique_destinations`, `wallet_unique_ips`, `ip_rotation_rate`, `fan_out_ratio`, `target_unique_senders` | Captures synthetic wallet/IP relationship patterns |
| Graph proxy | `source_out_degree`, `target_in_degree`, `degree_ratio`, `graph_reach_proxy` | Captures already-observed directed transfer structure |

Forbidden feature columns are `is_anomalous`, `scenario_id`, `severity_truth`, reviewer state, alert score, and all future information. Including any one of these is label leakage.

---

## 4. Training Contract

### 4.1 Split

Events are time sorted. The first 60% of timeline is train, the next 20% validation, and the final 20% test. The generated fixture assigns independent scenario wallet groups across time segments.

| Split | Event rows | Synthetic labels | Permitted use |
|---|---:|---:|---|
| Train | 36,200 | 1,400 | Fit scaler, Isolation Forest, and XGBoost |
| Validation | 11,920 | 320 | Choose operating probability threshold |
| Test | 11,880 | 280 | Final frozen evaluation only |

### 4.2 Models

| Model | Exact configuration | Output |
|---|---|---|
| RobustScaler | Fit only on benign train feature rows | Scaled feature matrix for novelty model |
| Isolation Forest | 300 trees; `max_samples=256`; contamination 0.08; seed 2026; single CPU thread | `novelty_score` normalized against train values |
| XGBoost classifier | 400 estimators; depth 5; learning rate 0.05; subsample/column sample 0.85; min child weight 3; L2 1.0; seed 2026; single CPU thread; class weight 24.857142857142858 | `ml_probability` in `[0,1]` |

### 4.3 Baseline Rules

Rules are a transparent comparison value, not the main model. The current code can score burst behavior, fan-out, fan-in, IP rotation, rapid relation activity, and unusual source-port behavior. Their combined score is capped at 100 and saved as `baseline_score`.

---

## 5. Scoring and Explanation Contract

### 5.1 Risk Score

```text
risk_score = round(100 * clamp(
    0.75 * ml_probability
  + 0.15 * novelty_score
  + 0.10 * graph_risk_score,
  0,
  1
))
```

The evaluation operating probability threshold is `0.50`. The default review queue uses `risk_score >= 65`, sorts by risk score then ML probability, and stores at most 250 alerts for the committed demo run.

### 5.2 Explanation

For each queued alert, XGBoost computes native TreeSHAP contributions via `pred_contribs=True`. The pipeline stores the five largest absolute feature contributions. Every evidence object has:

```json
{
  "alert_id": "alt_...",
  "feature": "ip_rotation_rate",
  "feature_value": 0.82,
  "shap_value": 1.42,
  "direction": "INCREASED_RISK",
  "message": "Synthetic feature ip_rotation_rate increased the model risk score."
}
```

The application must always display the limitation: **“Synthetic evidence only. Human review required.”**

---

## 6. Completed Training Results

| Metric | Validation | Held-out synthetic test |
|---|---:|---:|
| PR-AUC | 0.999990 | 0.999962 |
| ROC-AUC | 1.000000 | 0.999999 |
| Precision at 100 | 1.000000 | 1.000000 |
| Recall at 100 | 0.312500 | 0.357143 |
| Precision at threshold | 0.996885 | 0.982456 |
| Recall at threshold | 1.000000 | 1.000000 |
| F1 at threshold | 0.998440 | 0.991150 |
| False positives / 1,000 events | 0.083893 | 0.420875 |

These outcomes are high because test patterns are generated from known controlled synthetic scenario families. They are proof that the code can train and evaluate correctly on this fixture, **not** a claim about a real deployment.

---

## 7. Current Outputs

| Output | Meaning | Current count |
|---|---|---:|
| `features.parquet` | Feature frame created from the test run | 60,000 event feature rows |
| `alerts.json` | Ranked synthetic review queue | 250 |
| `evidence.json` | Five TreeSHAP contributions per queue alert | 1,250 |
| `metrics_validation.json` | Threshold-selection performance | 1 metric bundle |
| `metrics_test.json` | Final held-out performance | 1 metric bundle |
| `threshold_table.json` | Metrics for thresholds 0.50–0.95 | 10 candidate rows |
| `graph_summary.json` | Directed relationship proxy summary | 11,999 nodes / 58,989 edges |

---

## 8. How To Reproduce Training

```bash
cd TraceGraph_SIH26/services/ml
python3 -m pip install -r requirements.txt
PYTHONPATH=src python3 scripts/train_model.py --regenerate
PYTHONPATH=src pytest
```

Expected acceptance result: the run recreates the fixture, validates it, writes all required artifacts, prints validation/test metrics, yields a non-empty 250-alert queue, and passes the three repository tests.

---

## 9. Required Future Prediction Interface

The training command is not an end-user inference command. Implement this next so the model can score a new **synthetic batch** without retraining:

```bash
cd services/ml
PYTHONPATH=src python3 scripts/predict.py \
  --input path/to/synthetic_fixture/events.csv \
  --manifest path/to/synthetic_fixture/manifest.json \
  --model-run artifacts/runs/sih26146-cpu-demo-2026-v1 \
  --output artifacts/predictions/predictions.json
```

The script must perform these operations in order: validate manifest and source CSV; create the same 18 features with past-only context; load `robust_scaler.joblib`, `isolation_forest.joblib`, and `xgboost_model.json`; verify the feature schema hash; calculate novelty, ML probability, graph score, and risk score; generate five TreeSHAP contributions; write prediction and evidence JSON. It must never generate a new dataset, retrain either model, access the internet, consume labels, or process real data.

---

## 10. Model Change Rules

| Change | Mandatory follow-up |
|---|---|
| Feature change or reordering | Retrain all models; update feature hash, tests, model card, metrics, and specs |
| Generator/scenario change | Increment dataset version; regenerate hashes; retrain and update metrics/specs |
| XGBoost or IF hyperparameter change | New run ID; retrain; update model card and report exact configuration |
| Risk formula/queue threshold change | Update scoring tests, threshold table, alert artifacts, and both specifications |
| UI/API addition | Read existing JSON outputs; never expose labels/truth fields |

No model change is complete until the three unit tests pass, all required run artifacts exist, and the model documentation is updated in the same commit.
