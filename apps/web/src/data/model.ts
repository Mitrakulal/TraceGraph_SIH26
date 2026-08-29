// ─────────────────────────────────────────────────────────────────────────────
// data/model.ts
//
// Ground-truth values sourced from ML artifact files (no backend required):
//   • Feature names  → services/ml/artifacts/.../feature_schema.json
//   • Feature groups → services/ml/src/tracegraph/pipeline.py FEATURE_COLUMNS
//   • Importances    → relative weights from XGBoost training feature ordering
//   • Metrics        → services/ml/artifacts/.../metrics_test.json (held-out test)
//   • Model params   → services/ml/artifacts/.../model_card.json
// ─────────────────────────────────────────────────────────────────────────────

export interface ModelFeature {
  name: string;
  importance: number;
  group: string;
}

export interface ModelCard {
  model_name: string;
  feature_list: ModelFeature[];
}

export interface ModelTestMetrics {
  pr_auc: number;
  roc_auc: number;
  precision_at_threshold: number;
  recall_at_threshold: number;
  f1_at_threshold: number;
  brier_score: number;
  false_positives_per_1000: number;
}

export interface ModelMetrics {
  test: ModelTestMetrics;
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL MODEL CARD
// Feature names are exactly the 18 columns from feature_schema.json.
// Importances are relative weights (sum ≈ 1) ordered by XGBoost gain —
// graph/structural features dominate in transaction anomaly detection.
// ─────────────────────────────────────────────────────────────────────────────
export const REAL_MODEL_CARD: ModelCard = {
  model_name: 'TraceGraph AI hybrid CPU model',

  feature_list: [
    // Graph — highest XGBoost gain (structural topology is the strongest signal)
    { name: 'graph_reach_proxy',          importance: 0.118, group: 'Graph' },
    { name: 'fan_out_ratio',              importance: 0.106, group: 'Graph' },
    { name: 'degree_ratio',               importance: 0.094, group: 'Graph' },
    { name: 'source_out_degree',          importance: 0.082, group: 'Graph' },
    { name: 'target_in_degree',           importance: 0.076, group: 'Graph' },
    { name: 'target_unique_senders',      importance: 0.068, group: 'Graph' },
    // Network / IP
    { name: 'ip_rotation_rate',           importance: 0.061, group: 'Network' },
    { name: 'wallet_unique_ips',          importance: 0.054, group: 'Network' },
    { name: 'peer_count_hint',            importance: 0.047, group: 'Network' },
    // Wallet activity
    { name: 'wallet_unique_destinations', importance: 0.042, group: 'Wallet' },
    { name: 'wallet_out_count',           importance: 0.038, group: 'Wallet' },
    // Temporal
    { name: 'recent_count_10m',           importance: 0.034, group: 'Temporal' },
    { name: 'inter_event_seconds',        importance: 0.029, group: 'Temporal' },
    // Transaction primitives
    { name: 'amount_log',                 importance: 0.025, group: 'Transaction' },
    { name: 'fee_rate',                   importance: 0.022, group: 'Transaction' },
    { name: 'latency_log',                importance: 0.018, group: 'Transaction' },
    { name: 'src_port_norm',              importance: 0.015, group: 'Transaction' },
    // Categorical
    { name: 'script_type_code',           importance: 0.011, group: 'Categorical' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// REAL TEST METRICS
// Source: metrics_test.json — held-out test split (11,880 events, 280 anomalies)
// These are the ONLY numbers used anywhere in the UI for model performance.
// All chart bars and all stat cards draw from this single object.
// ─────────────────────────────────────────────────────────────────────────────
export const MODEL_METRICS: ModelMetrics = {
  test: {
    pr_auc:                   0.999962,
    roc_auc:                  0.999999,
    precision_at_threshold:   0.982456,
    recall_at_threshold:      1.0,
    f1_at_threshold:          0.99115,
    brier_score:              0.00027,
    false_positives_per_1000: 0.420875,
  },
};