'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MOCK_ALERTS } from '@/data/alerts';
import { getSeverity, getRiskBarClass, getReviewStateClass, formatTimestamp } from '@/lib/utils';
import { Search, ArrowUpRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { api, ApiAlertListItem } from '@/lib/api';

export default function InvestigationQueuePage() {
  const [liveAlerts, setLiveAlerts] = useState<ApiAlertListItem[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    async function loadQueue() {
      const res = await api.getAlerts({ page_size: 15, sort: 'RISK_DESC' });
      if (res && res.items && res.items.length > 0) {
        setLiveAlerts(res.items);
        setIsBackendConnected(true);
      }
    }
    loadQueue();
  }, []);

  const alertList = isBackendConnected && liveAlerts.length > 0
    ? liveAlerts.map((a, idx) => ({
        alert_id: a.alert_id,
        source_wallet: a.source_wallet,
        description: a.top_reason,
        risk_score: a.risk_score,
        model_signal: 'IF + XGBoost Ensemble',
        queue_rank: idx + 1,
        review_state: a.review_state,
      }))
    : MOCK_ALERTS;

  return (
    <div className="w-full space-y-6 pb-8">
      {/* HEADER */}
      <section className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Investigation Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Active synthetic cases requiring analyst review and decision making
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full">
          {isBackendConnected ? 'LIVE BACKEND QUEUE' : 'HUMAN IN THE LOOP'}
        </span>
      </section>

      {/* CASES CARDS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alertList.map((alert) => {
          const severity = getSeverity(alert.risk_score);
          return (
            <div
              key={alert.alert_id}
              className="card p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400 font-bold">#{alert.queue_rank}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={getReviewStateClass(alert.review_state)}>{alert.review_state}</span>
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
                </div>

                <div>
                  <h3 className="font-mono text-sm font-bold text-blue-600 tracking-tight">
                    {alert.source_wallet}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {alert.description}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5 text-xs space-y-1">
                  <div className="text-[11px] text-slate-400 font-bold">Model Signal:</div>
                  <div className="font-mono text-slate-900 text-[11px] font-medium">{alert.model_signal}</div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Risk Score</div>
                  <div className="font-mono text-lg font-extrabold text-slate-900">{alert.risk_score}</div>
                </div>

                <Link
                  href={`/investigation/${alert.alert_id}`}
                  className="btn btn-primary text-xs py-1.5 px-3 font-bold"
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
