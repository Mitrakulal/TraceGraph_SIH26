// Demo scenarios — based on the scenarios.json fixture in packages/fixtures/.
// Selecting a scenario updates synthetic events, signals, risk score, and explanation.
// No actual ML inference is performed in the browser.

export interface ScenarioEvent {
  id: string;
  from: string;
  to: string;
  amount: string;
  timestamp: string;
  note: string;
}

export interface ScenarioSignal {
  label: string;
  value: string;
  elevated: boolean;
}

export interface Scenario {
  key: string;
  displayName: string;
  description: string;
  expectedReviewBand: 'LOW_PRIORITY' | 'REVIEW_PRIORITY';
  riskScore: number;
  explanation: string;
  signals: ScenarioSignal[];
  events: ScenarioEvent[];
}

export const SCENARIOS: Scenario[] = [
  {
    key: 'normal',
    displayName: 'Normal',
    description: 'Stable timing, limited destinations, and low IP rotation.',
    expectedReviewBand: 'LOW_PRIORITY',
    riskScore: 12,
    explanation:
      'This synthetic entity exhibits stable transaction timing, low counterparty diversity, and no unusual network observations. The Isolation Forest assigns a low novelty score and XGBoost assigns a low classification probability. No review action required.',
    signals: [
      { label: 'Burst Score', value: '0.04', elevated: false },
      { label: 'Unique Counterparties', value: '3', elevated: false },
      { label: 'IP Rotation', value: '1 IP', elevated: false },
      { label: 'Transaction Freq', value: '0.8 / min', elevated: false },
      { label: 'XGBoost P(anomaly)', value: '0.08', elevated: false },
    ],
    events: [
      { id: 'EVT-001', from: 'SYN-WAL-N01', to: 'SYN-WAL-N02', amount: '0.12 BTC', timestamp: '14:00:00', note: 'Normal' },
      { id: 'EVT-002', from: 'SYN-WAL-N01', to: 'SYN-WAL-N03', amount: '0.08 BTC', timestamp: '14:04:30', note: 'Normal' },
      { id: 'EVT-003', from: 'SYN-WAL-N01', to: 'SYN-WAL-N02', amount: '0.11 BTC', timestamp: '14:10:15', note: 'Normal' },
    ],
  },
  {
    key: 'structuring',
    displayName: 'Structuring',
    description: 'Repeated near-threshold amounts sent in rapid succession.',
    expectedReviewBand: 'REVIEW_PRIORITY',
    riskScore: 91,
    explanation:
      'This entity submitted 17 synthetic transactions within 8 minutes, all just below a recurring amount threshold. The burst score and transaction frequency are significantly elevated. Isolation Forest novelty score is 0.89, XGBoost probability 0.92. Consistent with structuring behaviour in the synthetic dataset.',
    signals: [
      { label: 'Burst Score', value: '0.91', elevated: true },
      { label: 'Transaction Freq', value: '2.1 / min', elevated: true },
      { label: 'Amount Pattern', value: 'Near-threshold ×17', elevated: true },
      { label: 'IP Rotation', value: '2 IPs', elevated: false },
      { label: 'XGBoost P(anomaly)', value: '0.92', elevated: true },
    ],
    events: [
      { id: 'EVT-001', from: 'SYN-WAL-S01', to: 'SYN-WAL-S02', amount: '0.499 BTC', timestamp: '14:00:01', note: 'Near threshold' },
      { id: 'EVT-002', from: 'SYN-WAL-S01', to: 'SYN-WAL-S03', amount: '0.499 BTC', timestamp: '14:00:28', note: 'Near threshold' },
      { id: 'EVT-003', from: 'SYN-WAL-S01', to: 'SYN-WAL-S04', amount: '0.498 BTC', timestamp: '14:00:55', note: 'Near threshold' },
      { id: 'EVT-004', from: 'SYN-WAL-S01', to: 'SYN-WAL-S05', amount: '0.499 BTC', timestamp: '14:01:20', note: 'Near threshold' },
      { id: 'EVT-005', from: 'SYN-WAL-S01', to: 'SYN-WAL-S06', amount: '0.499 BTC', timestamp: '14:01:48', note: 'Near threshold' },
    ],
  },
  {
    key: 'peel_chain',
    displayName: 'Peel Chain',
    description: 'Sequential decreasing transfers through a synthetic wallet chain.',
    expectedReviewBand: 'REVIEW_PRIORITY',
    riskScore: 84,
    explanation:
      'A chain of 9 sequential synthetic wallets each receiving and immediately forwarding a slightly smaller amount. Input/output ratio is elevated and graph reach proxy shows a depth of 9 hops. Isolation Forest novelty 0.83, XGBoost 0.85.',
    signals: [
      { label: 'Graph Depth', value: '9 hops', elevated: true },
      { label: 'Input/Output Ratio', value: '1:1 × 9', elevated: true },
      { label: 'Burst Score', value: '0.74', elevated: true },
      { label: 'Unique Counterparties', value: '9', elevated: true },
      { label: 'XGBoost P(anomaly)', value: '0.85', elevated: true },
    ],
    events: [
      { id: 'EVT-001', from: 'SYN-WAL-P01', to: 'SYN-WAL-P02', amount: '2.10 BTC', timestamp: '14:00:00', note: 'Hop 1' },
      { id: 'EVT-002', from: 'SYN-WAL-P02', to: 'SYN-WAL-P03', amount: '2.09 BTC', timestamp: '14:00:22', note: 'Hop 2' },
      { id: 'EVT-003', from: 'SYN-WAL-P03', to: 'SYN-WAL-P04', amount: '2.07 BTC', timestamp: '14:00:45', note: 'Hop 3' },
      { id: 'EVT-004', from: 'SYN-WAL-P04', to: 'SYN-WAL-P05', amount: '2.05 BTC', timestamp: '14:01:11', note: 'Hop 4' },
      { id: 'EVT-005', from: 'SYN-WAL-P05', to: 'SYN-WAL-P06', amount: '2.02 BTC', timestamp: '14:01:38', note: 'Hop 5' },
    ],
  },
  {
    key: 'rapid_hop',
    displayName: 'Rapid Hop',
    description: 'Rapid consecutive transfers through several synthetic wallets.',
    expectedReviewBand: 'REVIEW_PRIORITY',
    riskScore: 96,
    explanation:
      'Eleven sequential hops completed within 4 minutes. Time-since-previous is extremely low at ~22 seconds average. Burst score 0.91, Isolation Forest novelty 0.91, XGBoost 0.97. This is the highest-priority synthetic alert in the queue.',
    signals: [
      { label: 'Burst Score', value: '0.91', elevated: true },
      { label: 'Time Since Previous', value: '22 s avg', elevated: true },
      { label: 'Graph Depth', value: '11 hops', elevated: true },
      { label: 'Transaction Freq', value: '2.75 / min', elevated: true },
      { label: 'XGBoost P(anomaly)', value: '0.97', elevated: true },
    ],
    events: [
      { id: 'EVT-001', from: 'SYN-WAL-R01', to: 'SYN-WAL-R02', amount: '1.50 BTC', timestamp: '14:00:00', note: 'Hop 1' },
      { id: 'EVT-002', from: 'SYN-WAL-R02', to: 'SYN-WAL-R03', amount: '1.49 BTC', timestamp: '14:00:21', note: 'Hop 2' },
      { id: 'EVT-003', from: 'SYN-WAL-R03', to: 'SYN-WAL-R04', amount: '1.48 BTC', timestamp: '14:00:43', note: 'Hop 3' },
      { id: 'EVT-004', from: 'SYN-WAL-R04', to: 'SYN-WAL-R05', amount: '1.47 BTC', timestamp: '14:01:04', note: 'Hop 4' },
      { id: 'EVT-005', from: 'SYN-WAL-R05', to: 'SYN-WAL-R06', amount: '1.46 BTC', timestamp: '14:01:26', note: 'Hop 5' },
    ],
  },
  {
    key: 'fan_out',
    displayName: 'Fan Out',
    description: 'One synthetic wallet distributing to many recipients in a short window.',
    expectedReviewBand: 'REVIEW_PRIORITY',
    riskScore: 93,
    explanation:
      'One synthetic source wallet sent to 34 unique synthetic destinations within 6 minutes. Unique counterparties and output count are both far above the synthetic baseline. XGBoost probability 0.94.',
    signals: [
      { label: 'Unique Counterparties', value: '34', elevated: true },
      { label: 'Output Count', value: '34', elevated: true },
      { label: 'Transaction Freq', value: '5.7 / min', elevated: true },
      { label: 'Burst Score', value: '0.83', elevated: true },
      { label: 'XGBoost P(anomaly)', value: '0.94', elevated: true },
    ],
    events: [
      { id: 'EVT-001', from: 'SYN-WAL-F01', to: 'SYN-WAL-F02', amount: '0.03 BTC', timestamp: '14:00:00', note: 'Fan-out' },
      { id: 'EVT-002', from: 'SYN-WAL-F01', to: 'SYN-WAL-F03', amount: '0.03 BTC', timestamp: '14:00:10', note: 'Fan-out' },
      { id: 'EVT-003', from: 'SYN-WAL-F01', to: 'SYN-WAL-F04', amount: '0.03 BTC', timestamp: '14:00:20', note: 'Fan-out' },
      { id: 'EVT-004', from: 'SYN-WAL-F01', to: 'SYN-WAL-F05', amount: '0.03 BTC', timestamp: '14:00:30', note: 'Fan-out' },
      { id: 'EVT-005', from: 'SYN-WAL-F01', to: 'SYN-WAL-F06', amount: '0.03 BTC', timestamp: '14:00:40', note: 'Fan-out' },
    ],
  },
  {
    key: 'fan_in',
    displayName: 'Fan In',
    description: 'Many synthetic senders converging funds to a single recipient wallet.',
    expectedReviewBand: 'REVIEW_PRIORITY',
    riskScore: 79,
    explanation:
      'Twenty-two synthetic wallets sent small amounts to a single destination within 4 minutes. High input count and low time-between-events. XGBoost probability 0.80.',
    signals: [
      { label: 'Input Count', value: '22', elevated: true },
      { label: 'Unique Counterparties', value: '22 senders', elevated: true },
      { label: 'Time Since Previous', value: '11 s avg', elevated: true },
      { label: 'Burst Score', value: '0.76', elevated: true },
      { label: 'XGBoost P(anomaly)', value: '0.80', elevated: true },
    ],
    events: [
      { id: 'EVT-001', from: 'SYN-WAL-I01', to: 'SYN-WAL-I99', amount: '0.05 BTC', timestamp: '14:00:00', note: 'Fan-in' },
      { id: 'EVT-002', from: 'SYN-WAL-I02', to: 'SYN-WAL-I99', amount: '0.04 BTC', timestamp: '14:00:11', note: 'Fan-in' },
      { id: 'EVT-003', from: 'SYN-WAL-I03', to: 'SYN-WAL-I99', amount: '0.06 BTC', timestamp: '14:00:22', note: 'Fan-in' },
      { id: 'EVT-004', from: 'SYN-WAL-I04', to: 'SYN-WAL-I99', amount: '0.05 BTC', timestamp: '14:00:33', note: 'Fan-in' },
      { id: 'EVT-005', from: 'SYN-WAL-I05', to: 'SYN-WAL-I99', amount: '0.04 BTC', timestamp: '14:00:44', note: 'Fan-in' },
    ],
  },
  {
    key: 'ip_rotation',
    displayName: 'IP Rotation',
    description: 'High rate of synthetic source-IP rotation for a single wallet.',
    expectedReviewBand: 'REVIEW_PRIORITY',
    riskScore: 88,
    explanation:
      'A single synthetic wallet appeared from 28 unique synthetic source IP addresses within 6 minutes. Network connections and block correlation are significantly elevated. XGBoost probability 0.89.',
    signals: [
      { label: 'Unique Source IPs', value: '28', elevated: true },
      { label: 'Connection Rate', value: '4.7 / min', elevated: true },
      { label: 'Block Correlation', value: '0.81', elevated: true },
      { label: 'Peer Count', value: '28', elevated: true },
      { label: 'XGBoost P(anomaly)', value: '0.89', elevated: true },
    ],
    events: [
      { id: 'EVT-001', from: 'SYN-WAL-IP01 [192.168.x.1]', to: 'SYN-WAL-IP99', amount: '0.21 BTC', timestamp: '14:00:00', note: 'IP 1' },
      { id: 'EVT-002', from: 'SYN-WAL-IP01 [10.0.x.2]', to: 'SYN-WAL-IP99', amount: '0.19 BTC', timestamp: '14:00:13', note: 'IP 2' },
      { id: 'EVT-003', from: 'SYN-WAL-IP01 [172.16.x.3]', to: 'SYN-WAL-IP99', amount: '0.22 BTC', timestamp: '14:00:25', note: 'IP 3' },
      { id: 'EVT-004', from: 'SYN-WAL-IP01 [192.168.x.4]', to: 'SYN-WAL-IP99', amount: '0.20 BTC', timestamp: '14:00:38', note: 'IP 4' },
      { id: 'EVT-005', from: 'SYN-WAL-IP01 [10.0.x.5]', to: 'SYN-WAL-IP99', amount: '0.18 BTC', timestamp: '14:00:51', note: 'IP 5' },
    ],
  },
  {
    key: 'source_port_shift',
    displayName: 'Source Port Shift',
    description: 'Unusual source-port and elevated latency deviating from background traffic.',
    expectedReviewBand: 'REVIEW_PRIORITY',
    riskScore: 73,
    explanation:
      'Source port diversity for this synthetic node is unusually high, combined with latency deviations from the background traffic model. Network block correlation is elevated. XGBoost probability 0.74.',
    signals: [
      { label: 'Port Diversity', value: '43 unique', elevated: true },
      { label: 'Latency Deviation', value: '+2.3σ', elevated: true },
      { label: 'Block Correlation', value: '0.71', elevated: true },
      { label: 'Peer Count', value: '12', elevated: false },
      { label: 'XGBoost P(anomaly)', value: '0.74', elevated: true },
    ],
    events: [
      { id: 'EVT-001', from: 'SYN-WAL-SP01 [:44721]', to: 'SYN-WAL-SP02', amount: '0.44 BTC', timestamp: '14:00:00', note: 'Port shift' },
      { id: 'EVT-002', from: 'SYN-WAL-SP01 [:58832]', to: 'SYN-WAL-SP02', amount: '0.41 BTC', timestamp: '14:01:15', note: 'Port shift' },
      { id: 'EVT-003', from: 'SYN-WAL-SP01 [:33194]', to: 'SYN-WAL-SP03', amount: '0.43 BTC', timestamp: '14:02:30', note: 'Port shift' },
      { id: 'EVT-004', from: 'SYN-WAL-SP01 [:61027]', to: 'SYN-WAL-SP02', amount: '0.42 BTC', timestamp: '14:03:45', note: 'Port shift' },
      { id: 'EVT-005', from: 'SYN-WAL-SP01 [:49318]', to: 'SYN-WAL-SP04', amount: '0.40 BTC', timestamp: '14:05:00', note: 'Port shift' },
    ],
  },
];
