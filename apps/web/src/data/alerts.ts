export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertStatus = 'Open' | 'Investigating' | 'Resolved';
export type ReviewState = 'UNREVIEWED' | 'REVIEWED' | 'ESCALATED' | 'DISMISSED';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  entity: string;
  transactionId: string;
  riskScore: number;
  timestamp: string;
  reason: string;
}

export const alerts: Alert[] = [
  {
    id: 'ALT-0001',
    severity: 'Critical',
    status: 'Open',
    title: 'Unusual transaction burst',
    entity: 'Entity-7F3A',
    transactionId: 'TX-8A91C2',
    riskScore: 94,
    timestamp: '2026-08-28 14:32:18',
    reason:
      'Transaction frequency and network activity significantly exceed the normal synthetic baseline.',
  },
  {
    id: 'ALT-0002',
    severity: 'High',
    status: 'Investigating',
    title: 'Suspicious entity activity',
    entity: 'Entity-19BC',
    transactionId: 'TX-41D7A9',
    riskScore: 87,
    timestamp: '2026-08-28 13:47:02',
    reason:
      'Entity shows unusual counterparty relationships and address reuse.',
  },
  {
    id: 'ALT-0003',
    severity: 'High',
    status: 'Open',
    title: 'Network correlation anomaly',
    entity: 'Entity-A52D',
    transactionId: 'TX-73BC11',
    riskScore: 82,
    timestamp: '2026-08-28 12:21:45',
    reason:
      'Network-layer observations correlate with an unusual transaction pattern.',
  },
  {
    id: 'ALT-0004',
    severity: 'Medium',
    status: 'Investigating',
    title: 'Elevated transaction volume',
    entity: 'Entity-4C82',
    transactionId: 'TX-92FA10',
    riskScore: 71,
    timestamp: '2026-08-28 11:08:31',
    reason:
      'Transaction volume is above the expected synthetic baseline.',
  },
  {
    id: 'ALT-0005',
    severity: 'Medium',
    status: 'Resolved',
    title: 'Unusual peer activity',
    entity: 'Entity-B814',
    transactionId: 'TX-51AC83',
    riskScore: 66,
    timestamp: '2026-08-28 09:54:16',
    reason:
      'Peer connection behavior temporarily deviated from the expected pattern.',
  },
  {
    id: 'ALT-0006',
    severity: 'Low',
    status: 'Resolved',
    title: 'Minor timing deviation',
    entity: 'Entity-2D91',
    transactionId: 'TX-30DE74',
    riskScore: 42,
    timestamp: '2026-08-28 08:42:09',
    reason:
      'Transaction timing differs slightly from the historical pattern.',
  },
];

// Extended alert shape used by the Alerts page (matches API contract shape)
export interface MockAlert {
  alert_id: string;
  queue_rank: number;
  risk_score: number;
  entity_id: string;
  source_wallet: string;
  description: string;
  top_reason: string;
  model_signal: string;
  review_state: ReviewState;
  observed_at: string;
}

export const MOCK_ALERTS: MockAlert[] = [
  {
    alert_id: 'alt_00001_syn_evt_004201',
    queue_rank: 1,
    risk_score: 96,
    entity_id: 'syn_w_0042',
    source_wallet: 'SYN-WAL-0042',
    description: 'Rapid-hop pattern: 11 sequential hops in 4 min',
    top_reason: 'Burst score + graph reach proxy elevated',
    model_signal: 'IF Novelty + XGBoost 0.97',
    review_state: 'UNREVIEWED',
    observed_at: '2026-08-28T14:32:18Z',
  },
  {
    alert_id: 'alt_00002_syn_evt_004202',
    queue_rank: 2,
    risk_score: 93,
    entity_id: 'syn_w_0019',
    source_wallet: 'SYN-WAL-0019',
    description: 'Fan-out: 1 source → 34 synthetic destinations',
    top_reason: 'Unique counterparties far above baseline',
    model_signal: 'XGBoost 0.94',
    review_state: 'UNREVIEWED',
    observed_at: '2026-08-28T13:47:02Z',
  },
  {
    alert_id: 'alt_00003_syn_evt_004203',
    queue_rank: 3,
    risk_score: 91,
    entity_id: 'syn_w_0087',
    source_wallet: 'SYN-WAL-0087',
    description: 'Structuring: 17 near-threshold amounts in 8 min',
    top_reason: 'Amount pattern + burst score elevated',
    model_signal: 'IF Novelty + XGBoost 0.92',
    review_state: 'ESCALATED',
    observed_at: '2026-08-28T12:21:45Z',
  },
  {
    alert_id: 'alt_00004_syn_evt_004204',
    queue_rank: 4,
    risk_score: 88,
    entity_id: 'syn_w_0103',
    source_wallet: 'SYN-WAL-0103',
    description: 'IP rotation: 28 unique source IPs in 6 min',
    top_reason: 'Network IP rotation far above baseline',
    model_signal: 'XGBoost 0.89',
    review_state: 'UNREVIEWED',
    observed_at: '2026-08-28T11:08:31Z',
  },
  {
    alert_id: 'alt_00005_syn_evt_004205',
    queue_rank: 5,
    risk_score: 84,
    entity_id: 'syn_w_0055',
    source_wallet: 'SYN-WAL-0055',
    description: 'Peel chain: 9 sequential outputs with decreasing amounts',
    top_reason: 'Input/output ratio + graph depth elevated',
    model_signal: 'IF Novelty + XGBoost 0.85',
    review_state: 'REVIEWED',
    observed_at: '2026-08-28T09:54:16Z',
  },
  {
    alert_id: 'alt_00006_syn_evt_004206',
    queue_rank: 6,
    risk_score: 79,
    entity_id: 'syn_w_0071',
    source_wallet: 'SYN-WAL-0071',
    description: 'Fan-in: 22 synthetic senders → 1 destination',
    top_reason: 'High input count + low time-between events',
    model_signal: 'XGBoost 0.80',
    review_state: 'UNREVIEWED',
    observed_at: '2026-08-28T09:01:33Z',
  },
  {
    alert_id: 'alt_00007_syn_evt_004207',
    queue_rank: 7,
    risk_score: 73,
    entity_id: 'syn_w_0033',
    source_wallet: 'SYN-WAL-0033',
    description: 'Source port shift: elevated latency deviation',
    top_reason: 'Port diversity + network block correlation',
    model_signal: 'XGBoost 0.74',
    review_state: 'UNREVIEWED',
    observed_at: '2026-08-28T08:42:09Z',
  },
  {
    alert_id: 'alt_00008_syn_evt_004208',
    queue_rank: 8,
    risk_score: 68,
    entity_id: 'syn_w_0091',
    source_wallet: 'SYN-WAL-0091',
    description: 'Elevated transaction frequency above baseline',
    top_reason: 'Transaction frequency + time-since-previous low',
    model_signal: 'XGBoost 0.69',
    review_state: 'DISMISSED',
    observed_at: '2026-08-28T07:55:21Z',
  },
  {
    alert_id: 'alt_00009_syn_evt_004209',
    queue_rank: 9,
    risk_score: 61,
    entity_id: 'syn_w_0018',
    source_wallet: 'SYN-WAL-0018',
    description: 'Address reuse pattern detected',
    top_reason: 'Address reuse count above synthetic norm',
    model_signal: 'XGBoost 0.62',
    review_state: 'UNREVIEWED',
    observed_at: '2026-08-28T07:12:05Z',
  },
  {
    alert_id: 'alt_00010_syn_evt_004210',
    queue_rank: 10,
    risk_score: 54,
    entity_id: 'syn_w_0064',
    source_wallet: 'SYN-WAL-0064',
    description: 'Moderate novelty score with peer count spike',
    top_reason: 'Isolation Forest novelty + peer count',
    model_signal: 'IF Novelty 0.55',
    review_state: 'UNREVIEWED',
    observed_at: '2026-08-28T06:44:17Z',
  },
  {
    alert_id: 'alt_00011_syn_evt_004211',
    queue_rank: 11,
    risk_score: 48,
    entity_id: 'syn_w_0022',
    source_wallet: 'SYN-WAL-0022',
    description: 'Slight timing deviation from normal pattern',
    top_reason: 'Time-since-previous deviation',
    model_signal: 'XGBoost 0.49',
    review_state: 'REVIEWED',
    observed_at: '2026-08-28T06:10:52Z',
  },
  {
    alert_id: 'alt_00012_syn_evt_004212',
    queue_rank: 12,
    risk_score: 41,
    entity_id: 'syn_w_0077',
    source_wallet: 'SYN-WAL-0077',
    description: 'Low-risk background variation flagged',
    top_reason: 'Entity risk history slightly elevated',
    model_signal: 'XGBoost 0.42',
    review_state: 'DISMISSED',
    observed_at: '2026-08-28T05:33:08Z',
  },
];