'use client';

import React from 'react';
import Link from 'next/link';
import { MOCK_ALERTS } from '@/data/alerts';
import { getSeverity, getRiskBarClass, getReviewStateClass, formatTimestamp } from '@/lib/utils';
import { Search, ArrowUpRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function InvestigationQueuePage() {
  return (
    <div className="w-full space-y-6 pb-8">
      {/* HEADER */}
      <section className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Investigation Queue</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Active synthetic cases requiring analyst review and decision making
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--accent-purple)] bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-md">
            HUMAN IN THE LOOP
          </span>
        </div>
      </section>

      {/* CASES CARDS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_ALERTS.map((alert) => {
          const severity = getSeverity(alert.risk_score);
          return (
            <div
              key={alert.alert_id}
              className="card p-5 flex flex-col justify-between space-y-4 hover:border-[var(--accent-blue)] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--text-muted)]">#{alert.queue_rank}</span>
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

                <div>
                  <h3 className="font-mono text-sm font-bold text-white tracking-tight">
                    {alert.source_wallet}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {alert.description}
                  </p>
                </div>

                <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-card-elevated)] p-2.5 text-xs space-y-1">
                  <div className="text-[11px] text-[var(--text-muted)]">Model Signal:</div>
                  <div className="font-mono text-white text-[11px]">{alert.model_signal}</div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[var(--text-muted)]">Risk Score</div>
                  <div className="font-mono text-lg font-bold text-white">{alert.risk_score}</div>
                </div>

                <Link
                  href={`/investigation/${alert.alert_id}`}
                  className="btn btn-primary text-xs py-1.5 px-3"
                >
                  Investigate Case <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
