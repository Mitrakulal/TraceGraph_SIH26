// Dataset metadata and artifact information.
// References the synthetic dataset from: services/ml/data/generated/sih26146-synthetic-60000-v2/

export interface DatasetArtifact {
  filename: string;
  description: string;
  evaluatorOnly: boolean;
  size?: string;
}

export interface DatasetInfo {
  name: string;
  version: string;
  runId: string;
  dataClassification: string;
  eventCount: number;
  alertCount: number;
  evidenceCount: number;
  limitation: string;
  artifacts: DatasetArtifact[];
}

export const DATASET_INFO: DatasetInfo = {
  name: 'SIH26146 Synthetic Benchmark Dataset',
  version: 'sih26146-synthetic-60000-v2',
  runId: 'sih26146-cpu-demo-2026-v1',
  dataClassification: 'SYNTHETIC_ONLY',
  eventCount: 60000,
  alertCount: 250,
  evidenceCount: 1250,
  limitation:
    'Held-out controlled synthetic benchmark only; not a real-world accuracy claim. All wallets, IPs, and transaction IDs are synthetic.',
  artifacts: [
    {
      filename: 'events.csv',
      description: '60,000 synthetic Bitcoin-style transaction events with 18 extracted features',
      evaluatorOnly: false,
      size: '~14 MB',
    },
    {
      filename: 'manifest.json',
      description: 'Dataset manifest with version, schema, and generation parameters',
      evaluatorOnly: false,
      size: '< 1 KB',
    },
    {
      filename: 'labels.csv',
      description: 'Ground-truth anomaly labels for the synthetic dataset. Used during training and evaluation only.',
      evaluatorOnly: true,
      size: '~1 MB',
    },
    {
      filename: 'alerts.json',
      description: '250 pre-computed synthetic alerts from the trained model run',
      evaluatorOnly: false,
      size: '~120 KB',
    },
    {
      filename: 'evidence.json',
      description: '1,250 SHAP evidence records — one per alert feature contribution',
      evaluatorOnly: false,
      size: '~80 KB',
    },
    {
      filename: 'model_card.json',
      description: 'Model card with feature list, importance scores, and metadata',
      evaluatorOnly: false,
      size: '< 10 KB',
    },
    {
      filename: 'metrics_test.json',
      description: 'Held-out test set metrics: PR-AUC, ROC-AUC, Precision, Recall, F1',
      evaluatorOnly: false,
      size: '< 1 KB',
    },
  ],
};

export const DATASET_FEATURE_GROUPS: Record<string, string[]> = {
  Transaction: [
    'amount_btc',
    'transaction_count',
    'input_count',
    'output_count',
    'transaction_fee',
    'input_output_ratio',
  ],
  Entity: [
    'unique_counterparties',
    'address_reuse_count',
    'entity_risk_history',
  ],
  Graph: ['entity_degree'],
  Network: ['network_connections', 'peer_count', 'connection_rate'],
  Temporal: ['transaction_frequency', 'time_since_previous', 'burst_score'],
  Model: ['novelty_score'],
  Correlation: ['network_block_correlation'],
};
