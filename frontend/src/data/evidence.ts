// Feature contributions (SHAP-like values) and model signals per alert
// These are precomputed synthetic values — no ML inference in the frontend.

export interface FeatureContribution {
  feature: string;
  displayName: string;
  value: number; // positive = increases risk, negative = decreases risk
  group: string;
}

export interface ModelEvidence {
  isolationForestNovelty: number; // 0–1 scale
  xgboostProbability: number;     // 0–1 scale
  graphReachProxy: number;        // 0–1 scale (synthetic graph depth)
  combinedRiskScore: number;      // 0–100
}

export interface AlertEvidence {
  alertId: string;
  modelEvidence: ModelEvidence;
  featureContributions: FeatureContribution[];
}

export const alertEvidence: AlertEvidence[] = [
  {
    alertId: 'alt_00001_syn_evt_004201',
    modelEvidence: {
      isolationForestNovelty: 0.91,
      xgboostProbability: 0.97,
      graphReachProxy: 0.88,
      combinedRiskScore: 96,
    },
    featureContributions: [
      { feature: 'burst_score', displayName: 'Burst Score', value: 0.38, group: 'Temporal' },
      { feature: 'transaction_frequency', displayName: 'Transaction Frequency', value: 0.29, group: 'Temporal' },
      { feature: 'entity_degree', displayName: 'Graph Reach', value: 0.21, group: 'Graph' },
      { feature: 'unique_counterparties', displayName: 'Unique Counterparties', value: 0.17, group: 'Entity' },
      { feature: 'time_since_previous', displayName: 'Time Since Previous', value: 0.14, group: 'Temporal' },
      { feature: 'peer_count', displayName: 'Peer Count', value: 0.09, group: 'Network' },
      { feature: 'amount_btc', displayName: 'Amount (BTC)', value: -0.05, group: 'Transaction' },
    ],
  },
  {
    alertId: 'alt_00002_syn_evt_004202',
    modelEvidence: {
      isolationForestNovelty: 0.78,
      xgboostProbability: 0.94,
      graphReachProxy: 0.81,
      combinedRiskScore: 93,
    },
    featureContributions: [
      { feature: 'unique_counterparties', displayName: 'Unique Counterparties', value: 0.41, group: 'Entity' },
      { feature: 'output_count', displayName: 'Output Count', value: 0.28, group: 'Transaction' },
      { feature: 'entity_degree', displayName: 'Graph Reach', value: 0.19, group: 'Graph' },
      { feature: 'transaction_count', displayName: 'Transaction Count', value: 0.14, group: 'Transaction' },
      { feature: 'connection_rate', displayName: 'Connection Rate', value: 0.08, group: 'Network' },
      { feature: 'amount_btc', displayName: 'Amount (BTC)', value: -0.07, group: 'Transaction' },
    ],
  },
  {
    alertId: 'alt_00003_syn_evt_004203',
    modelEvidence: {
      isolationForestNovelty: 0.89,
      xgboostProbability: 0.92,
      graphReachProxy: 0.71,
      combinedRiskScore: 91,
    },
    featureContributions: [
      { feature: 'amount_btc', displayName: 'Amount Pattern', value: 0.34, group: 'Transaction' },
      { feature: 'burst_score', displayName: 'Burst Score', value: 0.25, group: 'Temporal' },
      { feature: 'transaction_count', displayName: 'Transaction Count', value: 0.21, group: 'Transaction' },
      { feature: 'transaction_frequency', displayName: 'Transaction Frequency', value: 0.18, group: 'Temporal' },
      { feature: 'time_since_previous', displayName: 'Time Since Previous', value: 0.12, group: 'Temporal' },
      { feature: 'entity_risk_history', displayName: 'Entity Risk History', value: -0.04, group: 'Entity' },
    ],
  },
  {
    alertId: 'alt_00004_syn_evt_004204',
    modelEvidence: {
      isolationForestNovelty: 0.72,
      xgboostProbability: 0.89,
      graphReachProxy: 0.63,
      combinedRiskScore: 88,
    },
    featureContributions: [
      { feature: 'network_connections', displayName: 'Network Connections', value: 0.36, group: 'Network' },
      { feature: 'peer_count', displayName: 'Peer Count', value: 0.27, group: 'Network' },
      { feature: 'connection_rate', displayName: 'Connection Rate', value: 0.22, group: 'Network' },
      { feature: 'network_block_correlation', displayName: 'Block Correlation', value: 0.13, group: 'Correlation' },
      { feature: 'time_since_previous', displayName: 'Time Since Previous', value: 0.09, group: 'Temporal' },
      { feature: 'amount_btc', displayName: 'Amount (BTC)', value: -0.06, group: 'Transaction' },
    ],
  },
  {
    alertId: 'alt_00005_syn_evt_004205',
    modelEvidence: {
      isolationForestNovelty: 0.83,
      xgboostProbability: 0.85,
      graphReachProxy: 0.79,
      combinedRiskScore: 84,
    },
    featureContributions: [
      { feature: 'input_output_ratio', displayName: 'Input / Output Ratio', value: 0.32, group: 'Transaction' },
      { feature: 'entity_degree', displayName: 'Graph Reach', value: 0.24, group: 'Graph' },
      { feature: 'output_count', displayName: 'Output Count', value: 0.19, group: 'Transaction' },
      { feature: 'transaction_fee', displayName: 'Transaction Fee', value: 0.14, group: 'Transaction' },
      { feature: 'amount_btc', displayName: 'Amount (BTC)', value: 0.08, group: 'Transaction' },
      { feature: 'entity_risk_history', displayName: 'Entity Risk History', value: -0.06, group: 'Entity' },
    ],
  },
];

// Fallback evidence for alert IDs not in the list above
export const defaultEvidence: AlertEvidence = {
  alertId: 'default',
  modelEvidence: {
    isolationForestNovelty: 0.61,
    xgboostProbability: 0.69,
    graphReachProxy: 0.54,
    combinedRiskScore: 68,
  },
  featureContributions: [
    { feature: 'transaction_frequency', displayName: 'Transaction Frequency', value: 0.22, group: 'Temporal' },
    { feature: 'unique_counterparties', displayName: 'Unique Counterparties', value: 0.16, group: 'Entity' },
    { feature: 'entity_degree', displayName: 'Graph Reach', value: 0.13, group: 'Graph' },
    { feature: 'amount_btc', displayName: 'Amount (BTC)', value: 0.09, group: 'Transaction' },
    { feature: 'peer_count', displayName: 'Peer Count', value: 0.07, group: 'Network' },
    { feature: 'entity_risk_history', displayName: 'Entity Risk History', value: -0.05, group: 'Entity' },
  ],
};

export function getAlertsEvidence(alertId: string): AlertEvidence {
  return alertEvidence.find((e) => e.alertId === alertId) ?? {
    ...defaultEvidence,
    alertId,
  };
}
