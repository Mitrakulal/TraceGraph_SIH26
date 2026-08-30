'use client';

/**
 * Dynamic 1,000-Event Live Stream Dashboard — TraceGraph AI
 *
 * Real-time continuous evaluation of 1,000 synthetic transactions (70% normal : 30% suspicious ratio).
 * Evaluates each transaction one-by-one via the live model API.
 * Dynamically updates:
 *   - Events Analyzed counter (1 → 1,000)
 *   - Unique Entities monitored
 *   - High-Risk Alerts queue (auto-ranked by risk score descending)
 *   - Dynamic Activity Timeline
 *   - Dynamic Risk Distribution
 *
 * Stream state is preserved across page navigation via global StreamContext.
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Building2,
  Cpu,
  ArrowUpRight,
  ShieldAlert,
  Radio,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Zap,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { getSeverity, getRiskBarClass, getReviewStateClass } from '@/lib/utils';
import { useStream } from '@/context/StreamContext';

const DONUT_COLORS = ['#EF4444', '#F59E0B', '#22C55E'];

export default function DashboardPage() {
  const {
    processedCount,
    totalEvents,
    uniqueEntitiesCount,
    highRiskAlertsCount,
    evidenceRecordsCount,
    detectedAlerts,
    activityTimeline,
    riskDistribution,
    latestScoredEvent,
    isPlaying,
    isDone,
    speed,
    toggleStream,
    resetStream,
    stepStream,
    setSpeed,
  } = useStream();

  // Dynamic Risk Donut Data
  const pieData = useMemo(() => {
    const totalScored = riskDistribution.high + riskDistribution.medium + riskDistribution.low;
    if (totalScored === 0) {
      return [
        { name: 'HIGH', value: 0 },
        { name: 'MEDIUM', value: 0 },
        { name: 'LOW', value: 0 },
      ];
    }
    return [
      { name: 'HIGH (≥75)', value: riskDistribution.high },
      { name: 'MEDIUM (50-74)', value: riskDistribution.medium },
      { name: 'LOW (<50)', value: riskDistribution.low },
    ];
  }, [riskDistribution]);

  // Fallback initial timeline if stream is just beginning
  const chartData = useMemo(() => {
    if (activityTimeline.length > 0) return activityTimeline;
    return [
      { time: '00:00', transactions: 0, alerts: 0 },
      { time: '04:00', transactions: 0, alerts: 0 },
    ];
  }, [activityTimeline]);

  const progressPercent = totalEvents > 0 ? (processedCount / totalEvents) * 100 : 0;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* STREAM CONTROL & STATUS BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-purple-500/30 bg-purple-950/25 px-4 py-3 text-xs text-purple-200">
        <div className="flex items-center gap-2.5 font-mono">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 ${isPlaying ? 'animate-ping' : ''}`}></span>
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isPlaying ? 'bg-purple-500' : 'bg-gray-500'}`}></span>
          </span>
          <span className="font-bold tracking-wider uppercase">
            {isDone ? '1,000-EVENT BENCHMARK COMPLETE' : isPlaying ? 'LIVE EVALUATION STREAM ACTIVE · 70:30 RATIO' : 'STREAM PAUSED · STATE PRESERVED'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-purple-300/80 font-mono text-[11px]">
            700 Normal (70%) : 300 Suspicious (30%)
          </span>
          <Link
            href="/inspector"
            className="hidden sm:flex items-center gap-1 font-semibold text-[var(--accent-cyan)] hover:underline"
          >
            Live Model Inspector <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* STREAM CONTROL BAR */}
      <section className="card flex flex-wrap items-center gap-3 px-5 py-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleStream}
            className={`btn py-1.5 px-3 text-xs flex items-center gap-1.5 font-semibold ${
              isPlaying ? 'btn-primary' : 'bg-[var(--accent-green)] text-black hover:opacity-90'
            }`}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            {isPlaying ? 'Pause Stream' : 'Resume Stream'}
          </button>

          <button
            type="button"
            onClick={stepStream}
            disabled={isPlaying || isDone}
            className="btn btn-ghost border border-[var(--border)] py-1.5 px-2.5 text-xs flex items-center gap-1 disabled:opacity-40"
            title="Evaluate next single transaction"
          >
            <FastForward className="h-3.5 w-3.5" /> Step +1
          </button>

          <button
            type="button"
            onClick={resetStream}
            className="btn btn-ghost border border-[var(--border)] py-1.5 px-2.5 text-xs flex items-center gap-1"
            title="Reset to event 0 and re-evaluate"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restart 1K
          </button>
        </div>

        {/* SPEED SELECTOR */}
        <div className="flex items-center gap-1.5 border-l border-[var(--border)] pl-3">
          <span className="text-[var(--text-muted)] text-[11px]">Speed:</span>
          {[1, 4, 10].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`py-0.5 px-2 rounded font-mono text-[11px] font-bold transition-all ${
                speed === s
                  ? 'bg-[var(--accent-blue)] text-white'
                  : 'bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* PROGRESS BAR */}
        <div className="flex min-w-[180px] flex-1 items-center gap-2.5">
          <div className="risk-bar-track flex-1 h-2">
            <div
              className="h-full bg-[var(--accent-blue)] transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-[11px] font-bold text-white whitespace-nowrap">
            {processedCount} / {totalEvents} events
          </span>
        </div>

        {/* LATEST EVALUATED EVENT PILL */}
        {latestScoredEvent && (
          <div className="hidden xl:flex items-center gap-1.5 font-mono text-[11px] bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] px-2.5 py-1 rounded">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                latestScoredEvent.risk_score >= 65 ? 'bg-[var(--accent-red)] animate-ping' : 'bg-[var(--accent-green)]'
              }`}
            />
            <span className="text-[var(--text-muted)]">last:</span>
            <span className="text-white font-bold">risk {latestScoredEvent.risk_score}</span>
            <span className="text-[var(--accent-cyan)] max-w-[110px] truncate">{latestScoredEvent.event_id}</span>
          </div>
        )}
      </section>

      {/* PAGE TITLE */}
      <section className="flex flex-col gap-1 border-b border-[var(--border)] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Live Operations Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Real-time transaction surveillance & dynamic risk queue evaluation over 1,000 synthetic benchmark events
        </p>
      </section>

      {/* DYNAMIC KPI CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="stat-label">Events Analyzed</span>
            <Activity className="h-4 w-4 text-[var(--accent-blue)]" />
          </div>
          <div className="mt-3">
            <div className="stat-value font-mono">
              {processedCount.toLocaleString()} <span className="text-xs text-[var(--text-muted)] font-normal">/ {totalEvents.toLocaleString()}</span>
            </div>
            <div className="stat-delta text-[var(--accent-green)]">
              {progressPercent.toFixed(1)}% benchmark evaluated
            </div>
          </div>
        </div>

        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="stat-label">Entities Discovered</span>
            <Building2 className="h-4 w-4 text-[var(--accent-cyan)]" />
          </div>
          <div className="mt-3">
            <div className="stat-value font-mono">{uniqueEntitiesCount.toLocaleString()}</div>
            <div className="stat-delta text-[var(--text-secondary)]">Dynamic wallet clusters</div>
          </div>
        </div>

        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="stat-label">High-Risk Alerts</span>
            <AlertTriangle className="h-4 w-4 text-[var(--accent-red)]" />
          </div>
          <div className="mt-3">
            <div className="stat-value text-[var(--accent-red)] font-mono">{highRiskAlertsCount}</div>
            <div className="stat-delta text-[var(--accent-red)]">Detected (score ≥ 65)</div>
          </div>
        </div>

        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="stat-label">Evidence Records</span>
            <Cpu className="h-4 w-4 text-[var(--accent-purple)]" />
          </div>
          <div className="mt-3">
            <div className="stat-value font-mono">{evidenceRecordsCount}</div>
            <div className="stat-delta text-[var(--accent-purple)]">TreeSHAP factors computed</div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT GRID: DYNAMIC ALERTS QUEUE (LEFT) + LIVE CHARTS (RIGHT) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DYNAMIC PRIORITY QUEUE (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-[var(--border)] px-5 py-4 gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[var(--accent-red)]" />
                <h2 className="text-base font-semibold text-white">Live Priority Alerts Queue</h2>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  (Auto-ranked by Risk Score)
                </span>
              </div>
              <Link
                href="/alerts"
                className="flex items-center gap-1 text-xs font-medium text-[var(--accent-blue)] hover:underline"
              >
                Full Alert View <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="data-table-wrap overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Severity</th>
                    <th>Alert / Event ID</th>
                    <th>Source Entity</th>
                    <th>Risk Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {detectedAlerts.slice(0, 7).map((alert, idx) => {
                    const severity = getSeverity(alert.risk_score);
                    return (
                      <tr key={alert.alert_id} className="row-enter">
                        <td className="font-mono text-xs font-bold text-[var(--text-muted)]">
                          #{idx + 1}
                        </td>
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
                        <td>
                          <div className="font-mono text-xs text-white font-medium">
                            {alert.alert_id.slice(0, 14)}…
                          </div>
                          <div className="font-mono text-[10px] text-[var(--text-muted)]">
                            {alert.event_id}
                          </div>
                        </td>
                        <td className="font-mono text-xs text-[var(--accent-cyan)] max-w-[130px] truncate">
                          {alert.source_wallet}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">
                              {alert.risk_score}
                            </span>
                            <div className="risk-bar-track w-10 opacity-80">
                              <div
                                className={`h-full ${getRiskBarClass(alert.risk_score)}`}
                                style={{ width: `${alert.risk_score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <Link
                            href={`/investigation/${alert.alert_id}`}
                            className="btn btn-ghost py-1 px-2 text-xs text-[var(--accent-blue)] border border-[var(--border-subtle)] hover:border-[var(--accent-blue)]"
                          >
                            Investigate
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {detectedAlerts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[var(--text-muted)]">
                        Streaming transactions… no anomalies flagged yet in current batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DYNAMIC CHARTS & INSPECTOR TEASER (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* DYNAMIC ACTIVITY TIMELINE */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Dynamic Activity Timeline
                </h3>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Progressive transaction vs anomaly rate over streaming window
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-[var(--accent-blue)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-blue)]" /> Events
                </span>
                <span className="flex items-center gap-1 text-[var(--accent-red)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-red)]" /> Alerts
                </span>
              </div>
            </div>

            <div className="h-[170px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#5F6978" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#5F6978" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151A21',
                      borderColor: '#252B34',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="transactions"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorTx)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    stroke="#EF4444"
                    fillOpacity={1}
                    fill="url(#colorAlerts)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DYNAMIC RISK DISTRIBUTION DONUT */}
          <div className="card p-5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Risk Breakdown
                </h3>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Evaluated severity spectrum ({processedCount} transactions)
                </p>
              </div>
            </div>

            <div className="h-[130px] w-full my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={56}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151A21',
                      borderColor: '#252B34',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-2 text-center">
              <div>
                <div className="text-[10px] text-[var(--text-muted)]">HIGH (≥75)</div>
                <div className="font-mono text-sm font-bold text-[var(--accent-red)]">
                  {riskDistribution.high}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)]">MED (50-74)</div>
                <div className="font-mono text-sm font-bold text-[var(--accent-amber)]">
                  {riskDistribution.medium}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)]">LOW (&lt;50)</div>
                <div className="font-mono text-sm font-bold text-[var(--accent-green)]">
                  {riskDistribution.low}
                </div>
              </div>
            </div>
          </div>

          {/* INSPECTOR CALLOUT */}
          <div className="p-4 rounded-lg bg-[var(--bg-card-elevated)] border border-[var(--border)] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                Live Model Ingest Inspector
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Test custom transactions with the 8-stage prediction lifecycle
              </p>
            </div>
            <Link href="/inspector" className="btn btn-primary py-1.5 px-3 text-xs flex items-center gap-1 shrink-0">
              Open Inspector <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}