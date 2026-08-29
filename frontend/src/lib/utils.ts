import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SeverityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export function getSeverity(score: number): SeverityLevel {
  if (score >= 75) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

export function getRiskBarClass(score: number): string {
  if (score >= 75) return 'risk-bar-fill-high';
  if (score >= 50) return 'risk-bar-fill-medium';
  return 'risk-bar-fill-low';
}

export function getReviewStateClass(state: string): string {
  switch (state) {
    case 'ESCALATED':
      return 'badge badge-high';
    case 'REVIEWED':
      return 'badge badge-low';
    case 'DISMISSED':
      return 'badge badge-neutral';
    default:
      return 'badge badge-neutral';
  }
}

export function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return ts;
  }
}

export function featureDisplayName(name: string): string {
  const map: Record<string, string> = {
    amount_btc: 'Amount (BTC)',
    transaction_count: 'Transaction Count',
    input_count: 'Input Count',
    output_count: 'Output Count',
    transaction_fee: 'Transaction Fee',
    input_output_ratio: 'Input / Output Ratio',
    unique_counterparties: 'Unique Counterparties',
    address_reuse_count: 'Address Reuse Count',
    entity_degree: 'Entity Degree',
    network_connections: 'Network Connections',
    peer_count: 'Peer Count',
    connection_rate: 'Connection Rate',
    transaction_frequency: 'Transaction Frequency',
    time_since_previous: 'Time Since Previous',
    burst_score: 'Burst Score',
    novelty_score: 'Novelty Score (IF)',
    network_block_correlation: 'Block Correlation',
    entity_risk_history: 'Entity Risk History',
  };
  return map[name] ?? name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function riskColor(score: number): string {
  if (score >= 75) return 'var(--accent-red)';
  if (score >= 50) return 'var(--accent-amber)';
  return 'var(--accent-green)';
}

export function severityBadgeClass(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
      return 'badge badge-high';
    case 'MEDIUM':
      return 'badge badge-medium';
    case 'LOW':
      return 'badge badge-low';
    default:
      return 'badge badge-neutral';
  }
}
