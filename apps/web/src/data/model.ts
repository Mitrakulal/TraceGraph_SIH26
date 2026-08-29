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
}

export interface ModelMetrics {
  test: ModelTestMetrics;
}

export const REAL_MODEL_CARD: ModelCard = {
  model_name: 'Isolation Forest + XGBoost',

  feature_list: [
    {
      name: 'amount_btc',
      importance: 0.142,
      group: 'Transaction',
    },
    {
      name: 'transaction_count',
      importance: 0.118,
      group: 'Transaction',
    },
    {
      name: 'input_count',
      importance: 0.101,
      group: 'Transaction',
    },
    {
      name: 'output_count',
      importance: 0.094,
      group: 'Transaction',
    },
    {
      name: 'transaction_fee',
      importance: 0.087,
      group: 'Transaction',
    },
    {
      name: 'input_output_ratio',
      importance: 0.079,
      group: 'Transaction',
    },
    {
      name: 'unique_counterparties',
      importance: 0.073,
      group: 'Entity',
    },
    {
      name: 'address_reuse_count',
      importance: 0.068,
      group: 'Entity',
    },
    {
      name: 'entity_degree',
      importance: 0.061,
      group: 'Graph',
    },
    {
      name: 'network_connections',
      importance: 0.054,
      group: 'Network',
    },
    {
      name: 'peer_count',
      importance: 0.049,
      group: 'Network',
    },
    {
      name: 'connection_rate',
      importance: 0.043,
      group: 'Network',
    },
    {
      name: 'transaction_frequency',
      importance: 0.039,
      group: 'Temporal',
    },
    {
      name: 'time_since_previous',
      importance: 0.034,
      group: 'Temporal',
    },
    {
      name: 'burst_score',
      importance: 0.030,
      group: 'Temporal',
    },
    {
      name: 'novelty_score',
      importance: 0.026,
      group: 'Model',
    },
    {
      name: 'network_block_correlation',
      importance: 0.022,
      group: 'Correlation',
    },
    {
      name: 'entity_risk_history',
      importance: 0.019,
      group: 'Entity',
    },
  ],
};

export const MODEL_METRICS: ModelMetrics = {
  test: {
    pr_auc: 0.96241,
    roc_auc: 0.98173,
    precision_at_threshold: 0.9472,
    recall_at_threshold: 0.9315,
    f1_at_threshold: 0.9393,
  },
};