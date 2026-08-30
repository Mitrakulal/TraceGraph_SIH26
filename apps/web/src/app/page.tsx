'use client';

/**
 * Dynamic 1,000-Event Live Stream Dashboard — TraceGraph AI
 * Studio Light Theme (Clean Fintech Aesthetics)
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
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Zap,
  ChevronRight,
  TrendingUp,
  Sparkles,
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

import { getSeverity, getRiskBarClass } from '@/lib/utils';
import { useStream } from '@/context/StreamContext';

const DONUT_COLORS = ['#EF4444', '#F59E0B', '#10B981'];

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
      {/* TOP HEADER & STREAM STATUS BAR */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Live Surveillance Console
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <span className={`h-2 w-2 rounded-full bg-emerald-500 ${isPlaying ? 'animate-pulse' : ''}`} />
              {isDone ? 'COMPLETED' : isPlaying ? 'LIVE STREAMING' : 'PAUSED'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time transaction surveillance & dynamic risk evaluation across 1,000 synthetic benchmark events (70:30 ratio)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/inspector"
            className="btn btn-primary text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Zap className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
            Live Ingest Inspector
          </Link>
          <Link
            href="/alerts"
            className="btn btn-ghost text-xs flex items-center gap-1.5"
          >
            All Alerts ({detectedAlerts.length})
          </Link>
        </div>
      </section>

      {/* STREAM CONTROLLER CARD */}
      <section className="card p-5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleStream}
            className={`btn py-2 px-4 text-xs flex items-center gap-2 font-bold ${
              isPlaying
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            {isPlaying ? 'Pause Evaluation' : 'Resume Evaluation'}
          </button>

          <button
            type="button"
            onClick={stepStream}
            disabled={isPlaying || isDone}
            className="btn btn-ghost py-2 px-3 text-xs flex items-center gap-1.5 disabled:opacity-40"
            title="Evaluate next single transaction"
          >
            <FastForward className="h-3.5 w-3.5 text-slate-600" /> Step +1
          </button>

          <button
            type="button"
            onClick={resetStream}
            className="btn btn-ghost py-2 px-3 text-xs flex items-center gap-1.5"
            title="Reset to event 0 and re-evaluate"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-600" /> Restart 1K
          </button>
        </div>

        {/* Speed Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full">
          <span className="text-slate-400 text-[11px] font-bold px-2">Speed:</span>
          {[1, 4, 10].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`py-1 px-3 rounded-full text-xs font-bold transition-all ${
                speed === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Live Progress Bar & Numbers */}
        <div className="flex min-w-[220px] flex-1 items-center gap-3">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
            {processedCount} / {totalEvents} ({progressPercent.toFixed(0)}%)
          </span>
        </div>

        {/* Latest Scored Pill */}
        {latestScoredEvent && (
          <div className="hidden xl:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full font-mono">
            <span
              className={`h-2 w-2 rounded-full ${
                latestScoredEvent.risk_score >= 65 ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
            <span className="text-slate-400">Score:</span>
            <span className={`font-bold ${latestScoredEvent.risk_score >= 65 ? 'text-red-600' : 'text-emerald-600'}`}>
              {latestScoredEvent.risk_score}
            </span>
            <span className="text-slate-500 max-w-[100px] truncate">{latestScoredEvent.event_id}</span>
          </div>
        )}
      </section>

      {/* DYNAMIC KPI CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Events Analyzed */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Events Analyzed</span>
            <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {processedCount.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {totalEvents.toLocaleString()}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" /> {progressPercent.toFixed(1)}% benchmark evaluated
            </div>
          </div>
        </div>

        {/* Entities Discovered */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Entities Discovered</span>
            <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {uniqueEntitiesCount.toLocaleString()}
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-500">
              Dynamic wallet clusters identified
            </div>
          </div>
        </div>

        {/* High-Risk Alerts */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">High-Risk Alerts</span>
            <div className="h-8 w-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-red-600 font-mono">
              {highRiskAlertsCount}
            </div>
            <div className="mt-1 text-xs font-semibold text-red-600">
              Score ≥ 65 (Human Review Required)
            </div>
          </div>
        </div>

        {/* Evidence Records */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">TreeSHAP Explainability</span>
            <div className="h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {evidenceRecordsCount}
            </div>
            <div className="mt-1 text-xs font-semibold text-purple-600">
              Factor attributions calculated
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT GRID: DYNAMIC ALERTS QUEUE (LEFT) + LIVE CHARTS (RIGHT) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DYNAMIC PRIORITY QUEUE (7 COLS) */}
        <div className="lg:col-span-7 min-w-0 space-y-6">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-6 py-4 gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <h2 className="text-base font-bold text-slate-900">Live Priority Alerts Queue</h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Auto-Ranked
                </span>
              </div>
              <Link
                href="/alerts"
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
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
                      <tr key={alert.alert_id}>
                        <td className="font-mono text-xs font-bold text-slate-400">
                          #{idx + 1}
                        </td>
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
                        <td className="max-w-[150px]">
                          <div className="font-mono text-xs text-slate-900 font-bold truncate" title={alert.alert_id}>
                            {alert.alert_id.slice(0, 14)}…
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 truncate max-w-[140px]" title={alert.event_id}>
                            {alert.event_id}
                          </div>
                        </td>
                        <td className="font-mono text-xs text-blue-600 font-medium max-w-[120px] truncate" title={alert.source_wallet}>
                          {alert.source_wallet}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {alert.risk_score}
                            </span>
                            <div className="risk-bar-track w-12">
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
                            className="btn btn-ghost py-1 px-3 text-xs text-blue-600 hover:bg-blue-50 font-semibold"
                          >
                            Investigate
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {detectedAlerts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
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
        <div className="lg:col-span-5 min-w-0 space-y-6">
          {/* DYNAMIC ACTIVITY TIMELINE */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Surveillance Activity Timeline
                </h3>
                <p className="text-xs text-slate-400">
                  Transaction volume vs model alert rate over 24h timeline
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-blue-600 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-blue-600" /> Events
                </span>
                <span className="flex items-center gap-1 text-red-500 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Alerts
                </span>
              </div>
            </div>

            <div className="h-[170px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="transactions"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTx)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAlerts)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DYNAMIC RISK DISTRIBUTION DONUT */}
          <div className="card p-6 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Risk Spectrum
                </h3>
                <p className="text-xs text-slate-400">
                  Severity distribution ({processedCount} evaluated transactions)
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
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">HIGH (≥75)</div>
                <div className="font-mono text-base font-extrabold text-red-600">
                  {riskDistribution.high}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">MED (50-74)</div>
                <div className="font-mono text-base font-extrabold text-amber-500">
                  {riskDistribution.medium}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">LOW (&lt;50)</div>
                <div className="font-mono text-base font-extrabold text-emerald-600">
                  {riskDistribution.low}
                </div>
              </div>
            </div>
          </div>

          {/* INSPECTOR CALLOUT */}
          <div className="p-5 rounded-3xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-md">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                Live Ingest & Model Inspector
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Inspect 18 historical features & TreeSHAP attributions
              </p>
            </div>
            <Link
              href="/inspector"
              className="btn bg-white text-slate-900 hover:bg-slate-100 py-1.5 px-3.5 text-xs font-bold flex items-center gap-1 shrink-0"
            >
              Open <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}