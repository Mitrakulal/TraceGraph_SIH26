'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SCENARIOS, Scenario } from '@/data/scenarios';
import { getSeverity, getRiskBarClass } from '@/lib/utils';
import { Play, Cpu, AlertTriangle, ArrowRight, Layers, Radio, Check } from 'lucide-react';
import { api, ScenarioItem, DemoActivateResponse } from '@/lib/api';

export default function DemoPage() {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('rapid_hop');
  const [liveScenarios, setLiveScenarios] = useState<ScenarioItem[]>([]);
  const [activateState, setActivateState] = useState<DemoActivateResponse | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadScenarios() {
      const res = await api.getScenarios();
      if (res && res.length > 0) {
        setLiveScenarios(res);
        setIsBackendConnected(true);
      }
    }
    loadScenarios();
  }, []);

  const handleSelectScenario = async (key: string) => {
    setSelectedScenarioKey(key);
    if (isBackendConnected) {
      const actRes = await api.activateScenario(key);
      if (actRes) {
        setActivateState(actRes);
        setToastMessage(`Backend activated session: ${actRes.demo_session_id.slice(0, 16)}…`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    }
  };

  const activeScenario: Scenario =
    SCENARIOS.find((s) => s.key === selectedScenarioKey) ?? SCENARIOS[3];

  const severity = getSeverity(activeScenario.riskScore);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[var(--bg-card-elevated)] border border-[var(--accent-blue)] px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-bounce">
          <Check className="h-4 w-4 text-[var(--accent-green)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <section className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Interactive Scenario Demo</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Controlled synthetic attack pattern simulation & model response catalog
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--accent-purple)] bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5 text-[var(--accent-green)] fill-[var(--accent-green)]" />
            {isBackendConnected ? 'LIVE DEMO ACTIVATION API' : 'OFFLINE JUDGE MODE'}
          </span>
        </div>
      </section>

      {/* SCENARIO SELECTOR BUTTONS */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {SCENARIOS.map((sc) => {
          const isSelected = sc.key === selectedScenarioKey;
          return (
            <button
              key={sc.key}
              type="button"
              onClick={() => handleSelectScenario(sc.key)}
              className={[
                'p-3 rounded-lg border text-left transition-all flex flex-col justify-between h-24',
                isSelected
                  ? 'bg-[var(--accent-blue-dim)] border-[var(--accent-blue)] text-white shadow-lg'
                  : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-white',
              ].join(' ')}
            >
              <div className="text-xs font-semibold leading-tight line-clamp-2">{sc.displayName}</div>
              <div className="font-mono text-[10px] opacity-80 flex items-center justify-between mt-2">
                <span>Score:</span>
                <span className={sc.riskScore >= 75 ? 'text-[var(--accent-red)] font-bold' : 'text-[var(--accent-green)] font-bold'}>
                  {sc.riskScore}
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {/* SCENARIO DETAIL & LIVE SIMULATION RESPONSE */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: SCENARIO METADATA & MODEL EXPLANATION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <span className="text-xs font-mono text-[var(--accent-blue)] uppercase tracking-wider">
                  Active Scenario: {activeScenario.key}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">{activeScenario.displayName}</h2>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={
                    severity === 'HIGH'
                      ? 'badge badge-high'
                      : severity === 'MEDIUM'
                      ? 'badge badge-medium'
                      : 'badge badge-low'
                  }
                >
                  {severity} REVIEW BAND
                </span>
                <div
                  className="score-ring h-12 w-12 text-sm"
                  style={{
                    borderColor: activeScenario.riskScore >= 75 ? '#EF4444' : '#22C55E',
                    color: activeScenario.riskScore >= 75 ? '#EF4444' : '#22C55E',
                  }}
                >
                  {activeScenario.riskScore}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Description
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">{activeScenario.description}</p>
            </div>

            <div className="rounded-lg bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] p-4 space-y-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-[var(--accent-purple)]" />
                Model Inference & Explainability Output
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {activeScenario.explanation}
              </p>
            </div>

            {activateState?.featured_alert_id && (
              <div className="flex items-center justify-between p-3 rounded-md border border-[var(--accent-blue)] bg-blue-950/20 text-xs">
                <span className="text-blue-300">Featured Alert for Active Scenario:</span>
                <Link
                  href={`/investigation/${activateState.featured_alert_id}`}
                  className="btn btn-primary py-1 px-3 text-xs flex items-center gap-1"
                >
                  Investigate Alert <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* SYNTHETIC EVENTS GENERATED BY THIS SCENARIO */}
          <div className="card overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-3 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">Synthetic Event Sequence</h3>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {activeScenario.events.length} Events Simulated
              </span>
            </div>

            <div className="data-table-wrap overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sender Wallet</th>
                    <th>Receiver Wallet</th>
                    <th>Amount</th>
                    <th>Time</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {activeScenario.events.map((evt) => (
                    <tr key={evt.id}>
                      <td className="font-mono text-xs text-[var(--text-muted)]">{evt.id}</td>
                      <td className="font-mono text-xs text-[var(--accent-cyan)]">{evt.from}</td>
                      <td className="font-mono text-xs text-[var(--text-secondary)]">{evt.to}</td>
                      <td className="font-mono text-xs font-bold text-white">{evt.amount}</td>
                      <td className="font-mono text-xs text-[var(--text-muted)]">{evt.timestamp}</td>
                      <td className="text-xs text-[var(--accent-purple)]">{evt.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: EXTRACTED SIGNALS PANEL */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-[var(--border)] pb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 text-[var(--accent-cyan)]" />
              Extracted Feature Signals
            </h3>

            <div className="space-y-3">
              {activeScenario.signals.map((sig) => (
                <div
                  key={sig.label}
                  className="flex items-center justify-between p-3 rounded bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)]"
                >
                  <div>
                    <div className="text-xs font-medium text-white">{sig.label}</div>
                    <div className="font-mono text-xs font-bold text-[var(--accent-cyan)] mt-0.5">
                      {sig.value}
                    </div>
                  </div>
                  {sig.elevated ? (
                    <span className="badge badge-high text-[10px]">ELEVATED</span>
                  ) : (
                    <span className="badge badge-low text-[10px]">NORMAL</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card-elevated p-5 text-center space-y-3">
            <h4 className="text-xs font-semibold text-white">Model Pipeline Status</h4>
            <div className="font-mono text-xs text-[var(--accent-green)] flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
              {isBackendConnected ? 'LIVE DEMO BACKEND ACTIVE' : 'SYNTHETIC PREDICTIONS READY'}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Session state: <code className="text-white">{activateState?.demo_session_id ?? 'demo_default'}</code>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
