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
import { CustomSelect } from '@/components/ui/CustomSelect';

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

  const [isBatchIngestedView, setIsBatchIngestedView] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'ALL' || urlParams.get('source') === 'batch') {
        setViewMode('ALL');
      }
      if (urlParams.get('source') === 'batch') {
        setIsBatchIngestedView(true);
      }
    }

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

  // Sync strictly with live stream detected alerts in LIVE mode; use historical in ALL mode
  const alertSource = useMemo(() => {
    if (viewMode === 'LIVE') {
      return detectedAlerts;
    }
    if (historicalAlerts.length > 0) {
      return historicalAlerts;
    }
    return (MOCK_ALERTS as unknown as ApiAlertListItem[]);
  }, [viewMode, detectedAlerts, historicalAlerts]);

  const isUsingFallbackData =
    !isBackendConnected && detectedAlerts.length === 0 && historicalAlerts.length === 0;

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
      typology: a.typology,
      typology_confidence: a.typology_confidence,
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
      {isUsingFallbackData && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-800">
            Backend service unavailable — displaying sample data.
          </p>
        </div>
      )}

      {viewMode === 'LIVE' && detectedAlerts.length === 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 flex items-center justify-between text-xs text-blue-900 shadow-sm">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-blue-600 animate-pulse" />
            <span>
              <strong>Awaiting live stream data.</strong> Start the stream from the Dashboard or switch to <strong>All Alerts</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setViewMode('ALL')}
            className="font-bold text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
          >
            View All Alerts ({historicalAlerts.length})
          </button>
        </div>
      )}

      {isBatchIngestedView && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 flex items-center justify-between text-xs text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Batch ingestion complete</strong> — showing priority alerts from your uploaded dataset.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            BATCH INGESTED
          </span>
        </div>
      )}

      {/* HEADER */}

      <section className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Alert Explorer</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 border border-red-200">
              <span className={`h-2 w-2 rounded-full bg-red-500 ${isPlaying ? 'animate-pulse' : ''}`} />
              LIVE PRIORITY QUEUE SYNCED
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Priority queue ranked by multi-model risk inference ({detectedAlerts.length} flagged / {processedCount} evaluated)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('LIVE')}
            className={`btn py-2 px-4 text-xs font-bold ${
              viewMode === 'LIVE'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'btn-ghost text-slate-600'
            }`}
          >
            Live Stream ({detectedAlerts.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ALL')}
            className={`btn py-2 px-4 text-xs font-bold ${
              viewMode === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'btn-ghost text-slate-600'
            }`}
          >
            All Alerts ({historicalAlerts.length})
          </button>
        </div>
      </section>

      {/* TABS */}
      <section className="border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => changeTab(tab.value)}
                className={[
                  'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all',
                  active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900',
                ].join(' ')}
              >
                <span>{tab.label}</span>
                <span
                  className={[
                    'rounded-full px-2 py-0.5 font-mono text-[11px] font-bold',
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500',
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
      <section className="card p-5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* SEARCH */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search alert ID, wallet, model signal, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 h-10 text-xs"
            />
          </div>

          {/* SEVERITY */}
          <CustomSelect
            value={severityFilter}
            onChange={(val) => setSeverityFilter(val)}
            options={[
              { value: 'ALL', label: 'Severity: All' },
              { value: 'HIGH', label: 'High (≥75)' },
              { value: 'MEDIUM', label: 'Medium (50–74)' },
              { value: 'LOW', label: 'Low (<50)' },
            ]}
          />

          {/* STATUS */}
          <CustomSelect
            value={reviewStateFilter}
            onChange={(val) => setReviewStateFilter(val)}
            options={[
              { value: 'ALL', label: 'Status: All' },
              { value: 'UNREVIEWED', label: 'Unreviewed' },
              { value: 'REVIEWED', label: 'Reviewed' },
              { value: 'ESCALATED', label: 'Escalated' },
              { value: 'DISMISSED', label: 'Dismissed' },
            ]}
          />

          {/* MODEL SIGNAL */}
          <CustomSelect
            value={signalFilter}
            onChange={(val) => setSignalFilter(val)}
            options={[
              { value: 'ALL', label: 'Signal: All Signals' },
              { value: 'IF', label: 'Isolation Forest' },
              { value: 'XGB', label: 'XGBoost' },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <span className="text-slate-500 font-bold shrink-0">Min Risk Score:</span>
            <span className="font-mono font-bold text-slate-900 w-6">{minScore}</span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>

          {(search || severityFilter !== 'ALL' || reviewStateFilter !== 'ALL' || signalFilter !== 'ALL' || minScore > 0 || activeTab !== 'ALL') && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-bold transition-colors ml-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* TABLE */}
      <section className="card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Alert Queue Results</h2>
          <span className="font-mono text-xs text-slate-500">
            Showing {filteredAlerts.length} of {alertDataPool.length} alerts
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-900">
              {viewMode === 'LIVE' ? 'No live stream alerts detected yet' : 'No alerts match filters'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              {viewMode === 'LIVE'
                ? `Evaluated ${processedCount} live transactions so far. High-risk anomaly alerts will automatically pop up here in real time as the stream runs.`
                : 'Try resetting filters or adjusting search parameters.'}
            </p>
            {viewMode === 'LIVE' ? (
              <div className="flex items-center justify-center gap-3 mt-4">
                <Link href="/" className="btn btn-primary text-xs font-bold">
                  Go to Dashboard Stream &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => setViewMode('ALL')}
                  className="btn btn-ghost border border-slate-200 text-xs font-bold"
                >
                  View Benchmark Alerts ({historicalAlerts.length})
                </button>
              </div>
            ) : (
              <button type="button" onClick={resetFilters} className="btn btn-primary mt-4 text-xs font-bold">
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="data-table-wrap overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Severity</th>
                  <th>Typology</th>
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
                  const typLabel = alert.typology ? alert.typology.replace('_', ' ') : 'PEEL CHAIN';
                  const typConf = alert.typology_confidence || 87;

                  return (
                    <tr key={alert.alert_id}>
                      <td className="font-mono text-xs font-bold text-slate-400">#{alert.queue_rank}</td>
                      <td>
                        <span
                          className={
                            severity === 'HIGH'
                              ? 'badge badge-high'
                              : severity === 'MEDIUM'
                              ? 'badge badge-medium'
                              : 'badge badge-low'
                          }
                        >
                          {severity}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                          {typLabel} {typConf}%
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-900 font-bold">{alert.alert_id.slice(0, 18)}…</td>

                      <td className="font-mono text-xs text-blue-600 font-medium">{alert.source_wallet}</td>
                      <td className="max-w-[240px] truncate text-xs text-slate-500">
                        {alert.description}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{alert.risk_score}</span>
                          <div className="risk-bar-track w-12">
                            <div
                              className={`h-full ${getRiskBarClass(alert.risk_score)}`}
                              style={{ width: `${alert.risk_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-[11px] text-purple-600 font-medium">{alert.model_signal}</td>
                      <td className="font-mono text-[11px] text-slate-400">{formatTimestamp(alert.observed_at)}</td>
                      <td>
                        <span className={getReviewStateClass(alert.review_state)}>{alert.review_state}</span>
                      </td>
                      <td>
                        <Link
                          href={`/investigation/${alert.alert_id}`}
                          className="btn btn-ghost py-1 px-3 text-xs text-blue-600 hover:bg-blue-50 font-bold"
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