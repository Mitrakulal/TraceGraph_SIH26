'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Building2,
  Cpu,
  ArrowUpRight,
  ShieldAlert,
  Radio,
  Layers,
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

import { MOCK_ALERTS } from '@/data/alerts';
import { dashboardStats, transactionActivity, alertSummary } from '@/data/dashboard';
import {
  getSeverity,
  getRiskBarClass,
  getReviewStateClass,
  formatTimestamp,
} from '@/lib/utils';
import { api, DashboardSummary, ApiAlertListItem } from '@/lib/api';

const DONUT_COLORS = ['#EF4444', '#F59E0B', '#22C55E'];

const pieData = alertSummary.map((item) => ({
  name: item.severity,
  value: item.count,
}));

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<ApiAlertListItem[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [sumRes, alertsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getAlerts({ page_size: 5, sort: 'RISK_DESC' }),
      ]);

      if (sumRes) {
        setSummary(sumRes);
        setIsBackendConnected(true);
      }
      if (alertsRes && alertsRes.items) {
        setLiveAlerts(alertsRes.items);
      }
    }
    loadData();
  }, []);

  const totalEvents = summary?.total_events ?? dashboardStats.transactionsProcessed;
  const activeAlertsCount = summary?.total_alerts ?? dashboardStats.activeAlerts;
  const evidenceCount = summary?.evidence_record_count ?? dashboardStats.highRiskEntities;

  const priorityAlerts = isBackendConnected && liveAlerts.length > 0
    ? liveAlerts
    : MOCK_ALERTS.slice(0, 5);

  return (
    <div className="w-full space-y-6 pb-8">
      {/* GLOBAL STATUS BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-purple-500/20 bg-purple-950/20 px-4 py-3 text-xs text-purple-300">
        <div className="flex items-center gap-2 font-mono">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
          </span>
          <span className="font-semibold tracking-wider">
            {isBackendConnected ? 'LIVE BACKEND API CONNECTED · SYNTHETIC DATA ONLY' : 'OFFLINE · SYNTHETIC DATA ONLY'}
          </span>
        </div>
        <span className="text-purple-400/80">
          Synthetic benchmark run: <code className="font-mono text-purple-200">{summary?.run_id ?? 'sih26146-cpu-demo-2026-v1'}</code>
        </span>
      </div>

      {/* PAGE HEADER */}
      <section className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Analysis of synthetic Bitcoin-style transaction traffic and model-generated risk signals
        </p>
      </section>

      {/* KPI CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="stat-label">Events Analyzed</span>
            <Activity className="h-4 w-4 text-[var(--accent-blue)]" />
          </div>
          <div className="mt-3">
            <div className="stat-value">{totalEvents.toLocaleString()}</div>
            <div className="stat-delta text-[var(--accent-green)]">60,000 benchmark dataset</div>
          </div>
        </div>

        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="stat-label">Entities Identified</span>
            <Building2 className="h-4 w-4 text-[var(--accent-cyan)]" />
          </div>
          <div className="mt-3">
            <div className="stat-value">{dashboardStats.monitoredEntities.toLocaleString()}</div>
            <div className="stat-delta text-[var(--text-secondary)]">Synthetic wallet clusters</div>
          </div>
        </div>

        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="stat-label">High-Risk Alerts</span>
            <AlertTriangle className="h-4 w-4 text-[var(--accent-red)]" />
          </div>
          <div className="mt-3">
            <div className="stat-value text-[var(--accent-red)]">{activeAlertsCount}</div>
            <div className="stat-delta text-[var(--accent-red)]">Requires human review</div>
          </div>
        </div>

        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="stat-label">Evidence Records</span>
            <Cpu className="h-4 w-4 text-[var(--accent-purple)]" />
          </div>
          <div className="mt-3">
            <div className="stat-value">{evidenceCount}</div>
            <div className="stat-delta text-[var(--accent-purple)]">XGBoost TreeSHAP computed</div>
          </div>
        </div>
      </section>

      {/* CHARTS ROW */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ACTIVITY CHART */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Synthetic Event Activity</h2>
              <p className="text-xs text-[var(--text-muted)]">Timeline of events vs model-flagged anomalies</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-[var(--accent-blue)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-blue)]" /> Transactions
              </span>
              <span className="flex items-center gap-1.5 text-[var(--accent-red)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-red)]" /> Anomaly Alerts
              </span>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transactionActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <XAxis dataKey="time" stroke="#5F6978" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5F6978" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151A21',
                    borderColor: '#252B34',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="transactions" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTx)" />
                <Area type="monotone" dataKey="alerts" stroke="#EF4444" fillOpacity={1} fill="url(#colorAlerts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RISK DISTRIBUTION DONUT */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Risk Distribution</h2>
            <p className="text-xs text-[var(--text-muted)]">Alert severity breakdown</p>
          </div>

          <div className="my-2 h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
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
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 text-center">
            {pieData.map((item, idx) => (
              <div key={item.name}>
                <div className="text-[11px] text-[var(--text-muted)]">{item.name}</div>
                <div className="font-mono text-sm font-semibold" style={{ color: DONUT_COLORS[idx] }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOWER ROW: PRIORITY ALERTS & SYNTHETIC NETWORK ACTIVITY */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* PRIORITY ALERTS TABLE */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[var(--accent-red)]" />
              <h2 className="text-base font-semibold text-white">Priority Alerts</h2>
            </div>
            <Link
              href="/alerts"
              className="flex items-center gap-1 text-xs font-medium text-[var(--accent-blue)] hover:underline"
            >
              View all queue <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="data-table-wrap overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Alert ID</th>
                  <th>Entity</th>
                  <th>Description</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {priorityAlerts.map((alert: any) => {
                  const alertId = alert.alert_id || alert.id;
                  const sourceWallet = alert.source_wallet || alert.entity;
                  const description = alert.top_reason || alert.description || alert.reason;
                  const score = alert.risk_score ?? alert.riskScore;
                  const reviewState = alert.review_state || alert.status || 'UNREVIEWED';
                  const severity = getSeverity(score);

                  return (
                    <tr key={alertId}>
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
                      <td className="font-mono text-xs text-[var(--text-primary)]">
                        {alertId.slice(0, 16)}…
                      </td>
                      <td className="font-mono text-xs text-[var(--accent-cyan)]">{sourceWallet}</td>
                      <td className="max-w-[200px] truncate text-xs text-[var(--text-secondary)]">
                        {description}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">{score}</span>
                          <div className="risk-bar-track w-12 opacity-80">
                            <div
                              className={`h-full ${getRiskBarClass(score)}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={getReviewStateClass(reviewState)}>{reviewState}</span>
                      </td>
                      <td>
                        <Link
                          href={`/investigation/${alertId}`}
                          className="btn btn-ghost py-1 px-2.5 text-xs text-[var(--accent-blue)]"
                        >
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SYNTHETIC NETWORK ACTIVITY VISUALIZATION */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Synthetic Peer Network</h2>
              <Radio className="h-4 w-4 text-[var(--accent-cyan)] animate-pulse" />
            </div>
            <p className="text-xs text-[var(--text-muted)]">Lightweight topological activity overview</p>
          </div>

          <div className="my-4 relative h-[180px] w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-elevated)] overflow-hidden flex items-center justify-center">
            {/* SVG Network Graph */}
            <svg className="w-full h-full" viewBox="0 0 300 180">
              <line x1="50" y1="90" x2="110" y2="40" stroke="#252B34" strokeWidth="1.5" />
              <line x1="50" y1="90" x2="110" y2="140" stroke="#252B34" strokeWidth="1.5" />
              <line x1="110" y1="40" x2="190" y2="40" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="110" y1="140" x2="190" y2="140" stroke="#252B34" strokeWidth="1.5" />
              <line x1="190" y1="40" x2="250" y2="90" stroke="#EF4444" strokeWidth="2" />
              <line x1="190" y1="140" x2="250" y2="90" stroke="#252B34" strokeWidth="1.5" />

              <circle cx="50" cy="90" r="12" fill="#151A21" stroke="#3B82F6" strokeWidth="2" />
              <circle cx="110" cy="40" r="10" fill="#151A21" stroke="#EF4444" strokeWidth="2" />
              <circle cx="110" cy="140" r="10" fill="#151A21" stroke="#22D3EE" strokeWidth="2" />
              <circle cx="190" cy="40" r="12" fill="#151A21" stroke="#EF4444" strokeWidth="2.5" />
              <circle cx="190" cy="140" r="10" fill="#151A21" stroke="#22C55E" strokeWidth="2" />
              <circle cx="250" cy="90" r="14" fill="#151A21" stroke="#8B5CF6" strokeWidth="2" />

              <text x="50" y="93" fill="#E7EAF0" fontSize="8" textAnchor="middle" fontFamily="monospace">N1</text>
              <text x="110" y="43" fill="#EF4444" fontSize="8" textAnchor="middle" fontFamily="monospace">HIGH</text>
              <text x="110" y="143" fill="#E7EAF0" fontSize="8" textAnchor="middle" fontFamily="monospace">N3</text>
              <text x="190" y="43" fill="#EF4444" fontSize="8" textAnchor="middle" fontFamily="monospace">ALERT</text>
              <text x="190" y="143" fill="#E7EAF0" fontSize="8" textAnchor="middle" fontFamily="monospace">N5</text>
              <text x="250" y="93" fill="#E7EAF0" fontSize="8" textAnchor="middle" fontFamily="monospace">N6</text>
            </svg>
          </div>

          <div className="space-y-1.5 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Active Peer Nodes:</span>
              <span className="font-mono text-white">48 Nodes</span>
            </div>
            <div className="flex justify-between">
              <span>Suspicious Cluster:</span>
              <span className="font-mono text-[var(--accent-red)]">Cluster #0042</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}