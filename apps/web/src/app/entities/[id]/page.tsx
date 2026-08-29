'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { entities } from '@/data/entities';
import { syntheticEvents } from '@/data/events';
import { getSeverity, getRiskBarClass, formatTimestamp } from '@/lib/utils';
import { ArrowLeft, Building2, ShieldAlert, Activity, Cpu } from 'lucide-react';

export default function EntityDetailPage() {
  const params = useParams();
  const entityId = (params?.id as string) ?? 'Entity-7F3A';

  const entity = entities.find((e) => e.id === entityId) ?? entities[0];
  const severity = getSeverity(entity.riskScore);

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <Link
          href="/entities"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Entities Explorer
        </Link>
      </div>

      <section className="card p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-blue">{entity.type}</span>
              <span
                className={
                  severity === 'HIGH'
                    ? 'badge badge-high'
                    : severity === 'MEDIUM'
                    ? 'badge badge-medium'
                    : 'badge badge-low'
                }
              >
                {severity} RISK
              </span>
            </div>
            <h1 className="text-xl font-bold font-mono text-white tracking-tight">{entity.id}</h1>
            <p className="text-xs text-[var(--text-secondary)]">Synthetic wallet cluster identifier</p>
          </div>

          <div className="flex items-center gap-3 bg-[var(--bg-card-elevated)] p-4 rounded-lg border border-[var(--border)]">
            <div
              className="score-ring"
              style={{
                borderColor: entity.riskScore >= 75 ? '#EF4444' : entity.riskScore >= 50 ? '#F59E0B' : '#22C55E',
                color: entity.riskScore >= 75 ? '#EF4444' : entity.riskScore >= 50 ? '#F59E0B' : '#22C55E',
              }}
            >
              {entity.riskScore}
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Risk Score</div>
              <div className="text-[10px] text-[var(--accent-purple)] font-mono">Synthetically scored</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="card-elevated p-3">
            <span className="text-[var(--text-muted)] block text-[11px]">Total Events</span>
            <span className="font-mono text-base font-bold text-white mt-1 block">{entity.transactions}</span>
          </div>
          <div className="card-elevated p-3">
            <span className="text-[var(--text-muted)] block text-[11px]">Unique Counterparties</span>
            <span className="font-mono text-base font-bold text-[var(--accent-cyan)] mt-1 block">
              {entity.counterparties}
            </span>
          </div>
          <div className="card-elevated p-3">
            <span className="text-[var(--text-muted)] block text-[11px]">Monitoring Status</span>
            <span className="font-mono text-base font-bold text-[var(--accent-amber)] mt-1 block">
              {entity.status}
            </span>
          </div>
          <div className="card-elevated p-3">
            <span className="text-[var(--text-muted)] block text-[11px]">Last Observed</span>
            <span className="font-mono text-xs text-white mt-1 block">{entity.lastSeen}</span>
          </div>
        </div>
      </section>

      {/* RELATED SYNTHETIC EVENTS */}
      <section className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Associated Synthetic Events</h2>
        <div className="data-table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {syntheticEvents.slice(0, 4).map((evt) => (
                <tr key={evt.id}>
                  <td className="font-mono text-xs text-[var(--accent-blue)]">{evt.eventId}</td>
                  <td className="font-mono text-xs text-[var(--text-muted)]">{formatTimestamp(evt.timestamp)}</td>
                  <td className="font-mono text-xs text-[var(--accent-cyan)]">{evt.sender}</td>
                  <td className="font-mono text-xs text-[var(--text-secondary)]">{evt.receiver}</td>
                  <td className="font-mono text-xs text-white">{evt.amountBtc} BTC</td>
                  <td className="font-mono text-xs font-bold text-[var(--accent-red)]">{evt.riskScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
