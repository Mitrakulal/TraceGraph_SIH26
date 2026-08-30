'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { MOCK_ALERTS } from '@/data/alerts';
import {
  getSeverity,
  getRiskBarClass,
  getReviewStateClass,
  formatTimestamp,
} from '@/lib/utils';
import { Search, RotateCcw, ArrowUpRight, ShieldAlert, Filter, Radio } from 'lucide-react';
import { api, ApiAlertListItem } from '@/lib/api';
import { useStream } from '@/context/StreamContext';

type AlertTab = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';

export default function AlertsPage() {
  const { detectedAlerts, processedCount, totalEvents, isPlaying } = useStream();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [reviewStateFilter, setReviewStateFilter] = useState('ALL');
  const [signalFilter, setSignalFilter] = useState('ALL');
  const [minScore, setMinScore] = useState(0);
  const [activeTab, setActiveTab] = useState<AlertTab>('ALL');
  const [historicalAlerts, setHistoricalAlerts] = useState<ApiAlertListItem[]>([]);
  const [viewMode, setViewMode] = useState<'LIVE' | 'ALL'>('LIVE');
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    async function loadAlerts() {
      const res = await api.getAlerts({
        page_size: 100,
        sort: 'RISK_DESC',
      });

      if (res && res.items) {
        setHistoricalAlerts(res.items);
        setIsBackendConnected(true);
      }
    }
    loadAlerts();
  }, []);

  const changeTab = (tab: AlertTab) => {
    setActiveTab(tab);
  };

  // Sync with live stream detected alerts if available; fallback to historical
  const alertSource = useMemo(() => {
    if (viewMode === 'LIVE' && detectedAlerts.length > 0) {
      return detectedAlerts;
    }
    if (historicalAlerts.length > 0) {
      return historicalAlerts;
    }
    return (MOCK_ALERTS as unknown as ApiAlertListItem[]);
  }, [viewMode, detectedAlerts, historicalAlerts]);

  const alertDataPool = useMemo(() => {
    return alertSource.map((a, idx) => ({
      alert_id: a.alert_id,
      event_id: a.event_id,
      observed_at: a.observed_at,
      source_wallet: a.source_wallet,
      target_wallet: a.target_wallet,
      risk_score: a.risk_score,
      ml_probability: a.ml_probability,
      novelty_score: a.novelty_score,
      graph_risk_score: a.graph_risk_score,
      priority_band: a.priority_band,
      review_state: a.review_state,
      top_reason: a.top_reason,
      description: a.top_reason,
      model_signal: a.graph_risk_score > 0.4 ? 'Graph + XGBoost' : 'Isolation Forest + XGBoost',
      queue_rank: idx + 1,
      entity_id: a.source_wallet,
    }));
  }, [alertSource]);

  const filteredAlerts = useMemo(() => {
    return alertDataPool.filter((alert) => {
      const severity = getSeverity(alert.risk_score);

      /* TAB */
      if (activeTab !== 'ALL' && severity !== activeTab) {
        return false;
      }

      /* SEVERITY */
      if (severityFilter !== 'ALL' && severity !== severityFilter) {
        return false;
      }

      /* STATUS */
      if (reviewStateFilter !== 'ALL' && alert.review_state !== reviewStateFilter) {
        return false;
      }

      /* MODEL SIGNAL */
      if (signalFilter !== 'ALL') {
        if (signalFilter === 'IF' && !alert.model_signal.includes('IF')) return false;
        if (signalFilter === 'XGB' && !alert.model_signal.includes('XGBoost')) return false;
      }

      /* MINIMUM SCORE */
      if (alert.risk_score < minScore) {
        return false;
      }

      /* SEARCH */
      if (search.trim()) {
        const query = search.toLowerCase();
        const match =
          alert.alert_id.toLowerCase().includes(query) ||
          alert.source_wallet.toLowerCase().includes(query) ||
          alert.description.toLowerCase().includes(query) ||
          alert.top_reason.toLowerCase().includes(query) ||
          alert.model_signal.toLowerCase().includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [alertDataPool, search, severityFilter, reviewStateFilter, signalFilter, minScore, activeTab]);

  const resetFilters = () => {
    setSearch('');
    setSeverityFilter('ALL');
    setReviewStateFilter('ALL');
    setSignalFilter('ALL');
    setMinScore(0);
    setActiveTab('ALL');
  };

  const tabs = [
    { value: 'ALL' as const, label: 'All Alerts', count: alertDataPool.length },
    {
      value: 'HIGH' as const,
      label: 'High Risk',
      count: alertDataPool.filter((a) => getSeverity(a.risk_score) === 'HIGH').length,
    },
    {
      value: 'MEDIUM' as const,
      label: 'Medium Risk',
      count: alertDataPool.filter((a) => getSeverity(a.risk_score) === 'MEDIUM').length,
    },
    {
      value: 'LOW' as const,
      label: 'Low Risk',
      count: alertDataPool.filter((a) => getSeverity(a.risk_score) === 'LOW').length,
    },
  ];

  return (
    <div className="w-full space-y-6 pb-8">
      {/* HEADER */}
      <section className="flex flex-col gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Alert Explorer</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-red)]/30 bg-red-950/40 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-red)]">
              <span className={`h-1.5 w-1.5 rounded-full bg-[var(--accent-red)] ${isPlaying ? 'animate-pulse' : ''}`} />
              LIVE PRIORITY QUEUE SYNCED
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Dynamic priority queue auto-ranked by live XGBoost + Isolation Forest inference ({detectedAlerts.length} flagged out of {processedCount} evaluated transactions)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('LIVE')}
            className={`btn py-1.5 px-3 text-xs ${
              viewMode === 'LIVE'
                ? 'btn-primary'
                : 'btn-ghost border border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            Live Stream Queue ({detectedAlerts.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ALL')}
            className={`btn py-1.5 px-3 text-xs ${
              viewMode === 'ALL'
                ? 'btn-primary'
                : 'btn-ghost border border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            All Benchmark ({historicalAlerts.length})
          </button>
        </div>
      </section>

      {/* TABS */}
      <section className="border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => changeTab(tab.value)}
                className={[
                  'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'border-[var(--accent-blue)] text-white'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-white',
                ].join(' ')}
              >
                <span>{tab.label}</span>
                <span
                  className={[
                    'rounded px-1.5 py-0.5 font-mono text-[11px]',
                    active
                      ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] font-bold'
                      : 'bg-[var(--bg-card-elevated)] text-[var(--text-muted)]',
                  ].join(' ')}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* FILTERS */}
      <section className="card p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {/* SEARCH */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search alert ID, wallet, model signal, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 h-9 text-xs"
            />
          </div>

          {/* SEVERITY */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input h-9 text-xs"
          >
            <option value="ALL">Severity: All</option>
            <option value="HIGH">High (≥75)</option>
            <option value="MEDIUM">Medium (50–74)</option>
            <option value="LOW">Low (&lt;50)</option>
          </select>

          {/* STATUS */}
          <select
            value={reviewStateFilter}
            onChange={(e) => setReviewStateFilter(e.target.value)}
            className="input h-9 text-xs"
          >
            <option value="ALL">Status: All</option>
            <option value="UNREVIEWED">Unreviewed</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ESCALATED">Escalated</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-3 text-xs">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <span className="text-[var(--text-secondary)] shrink-0">Min Risk Score:</span>
            <span className="font-mono font-bold text-white w-6">{minScore}</span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-[var(--accent-blue)]"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Filter className="h-3.5 w-3.5" />
              <span>Model Signal:</span>
              <select
                value={signalFilter}
                onChange={(e) => setSignalFilter(e.target.value)}
                className="input h-7 py-0 text-xs w-28 inline-block"
              >
                <option value="ALL">All Signals</option>
                <option value="IF">Isolation Forest</option>
                <option value="XGB">XGBoost</option>
              </select>
            </div>

            {(search || severityFilter !== 'ALL' || reviewStateFilter !== 'ALL' || signalFilter !== 'ALL' || minScore > 0 || activeTab !== 'ALL') && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* TABLE */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Alert Queue Results</h2>
          <span className="font-mono text-xs text-[var(--text-secondary)]">
            Showing {filteredAlerts.length} of {alertDataPool.length} alerts
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-white">No alerts match filters</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Try resetting filters or adjusting search parameters.</p>
            <button type="button" onClick={resetFilters} className="btn btn-primary mt-4 text-xs">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="data-table-wrap overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Severity</th>
                  <th>Alert ID</th>
                  <th>Entity / Wallet</th>
                  <th>Description</th>
                  <th>Risk Score</th>
                  <th>Model Signal</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => {
                  const severity = getSeverity(alert.risk_score);
                  return (
                    <tr key={alert.alert_id}>
                      <td className="font-mono text-xs text-[var(--text-muted)]">#{alert.queue_rank}</td>
                      <td>
                        <span
                          className={
                            severity === 'HIGH'
                              ? 'text-[var(--accent-red)] font-semibold'
                              : severity === 'MEDIUM'
                              ? 'text-[var(--accent-amber)] font-semibold'
                              : 'text-[var(--accent-green)] font-semibold'
                          }
                        >
                          {severity}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-white font-medium">{alert.alert_id.slice(0, 18)}…</td>
                      <td className="font-mono text-xs text-[var(--accent-cyan)]">{alert.source_wallet}</td>
                      <td className="max-w-[240px] truncate text-xs text-[var(--text-secondary)]">
                        {alert.description}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">{alert.risk_score}</span>
                          <div className="risk-bar-track w-12 opacity-80">
                            <div
                              className={`h-full ${getRiskBarClass(alert.risk_score)}`}
                              style={{ width: `${alert.risk_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-[11px] text-[var(--accent-purple)]">{alert.model_signal}</td>
                      <td className="font-mono text-[11px] text-[var(--text-muted)]">{formatTimestamp(alert.observed_at)}</td>
                      <td>
                        <span className={getReviewStateClass(alert.review_state)}>{alert.review_state}</span>
                      </td>
                      <td>
                        <Link
                          href={`/investigation/${alert.alert_id}`}
                          className="btn btn-ghost py-1 px-2.5 text-xs text-[var(--accent-blue)]"
                        >
                          Investigate <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}