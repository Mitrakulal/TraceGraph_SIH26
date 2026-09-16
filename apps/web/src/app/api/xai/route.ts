import { NextResponse } from 'next/server';

/**
 * Offline Investigator Explanation Endpoint.
 *
 * This route performs NO outbound network calls. It composes a deterministic,
 * template-based natural-language explanation from SHAP evidence and alert
 * context supplied by the caller. This preserves the system's offline,
 * air-gapped guarantee.
 */

const FEATURE_LABELS: Record<string, string> = {
  amount_log: 'transaction amount',
  fee_rate: 'fee rate',
  latency_log: 'network latency',
  peer_count_hint: 'peer count',
  src_port_norm: 'source port pattern',
  inter_event_seconds: 'time gap between transactions',
  recent_count_10m: 'transaction burst rate (10 min window)',
  wallet_out_count: 'outgoing transaction count',
  wallet_unique_destinations: 'number of distinct destination wallets',
  wallet_unique_ips: 'number of distinct IP addresses used',
  ip_rotation_rate: 'IP rotation rate',
  fan_out_ratio: 'fan-out ratio',
  target_unique_senders: 'number of distinct senders to target',
  source_out_degree: 'source wallet out-degree',
  target_in_degree: 'target wallet in-degree',
  degree_ratio: 'in/out degree ratio',
  graph_reach_proxy: 'graph reach',
  script_type_code: 'script type',
};

const RULE_LABELS: Record<string, string> = {
  'BR-02': 'fan-out ratio above expected range',
  'BR-04': 'high IP rotation',
  'BR-05': 'rapid successive relationship activity',
};

function describeFeature(key: string): string {
  return FEATURE_LABELS[key] ?? key;
}

export async function POST(req: Request) {
  try {
    const { context } = await req.json();

    const alertId = context?.alertId ?? 'unknown';
    const wallet = context?.sourceWallet ?? 'unknown';
    const riskScore = context?.riskScore ?? 'unknown';
    const evidence = Array.isArray(context?.evidence) ? context.evidence.slice(0, 5) : [];
    const ruleHits: string[] = Array.isArray(context?.ruleHits) ? context.ruleHits : [];
    const nodeCount = context?.graphSummary?.nodeCount ?? context?.graphNodes?.length ?? 0;
    const edgeCount = context?.graphSummary?.edgeCount ?? context?.graphEdges?.length ?? 0;

    const lines: string[] = [];

    lines.push(`**Alert ${alertId}** — review priority score **${riskScore}/100**.`);
    lines.push('');
    lines.push(`**Entity under review:** \`${wallet}\``);
    lines.push('');

    if (evidence.length > 0) {
      lines.push('**Why this was prioritised (top contributing factors):**');
      evidence.forEach((item: { feature?: string; feature_value?: number; direction?: string }) => {
        const label = describeFeature(item?.feature ?? '');
        const direction = item?.direction === 'INCREASED_RISK' ? 'raised' : 'lowered';
        const value = typeof item?.feature_value === 'number' ? ` (observed value: ${item.feature_value})` : '';
        lines.push(`- ${label}${value} — ${direction} the priority score`);
      });
      lines.push('');
    }

    if (ruleHits.length > 0) {
      lines.push('**Rule checks triggered:**');
      ruleHits.forEach((code) => {
        lines.push(`- \`${code}\` — ${RULE_LABELS[code] ?? 'rule threshold exceeded'}`);
      });
      lines.push('');
    }

    if (nodeCount > 0 || edgeCount > 0) {
      lines.push(`**Graph context:** ${nodeCount} nodes and ${edgeCount} edges in the current view.`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('*Synthetic data only. This score indicates review priority, not wrongdoing. Human review is required.*');

    return NextResponse.json({ reply: lines.join('\n') });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
