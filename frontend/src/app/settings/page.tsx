'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, RotateCcw, Shield, Moon, Bell, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const [compactDensity, setCompactDensity] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(65);
  const [defaultRiskLevel, setDefaultRiskLevel] = useState('HIGH');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const savedThreshold = localStorage.getItem('tracegraph_alert_threshold');
    if (savedThreshold) setAlertThreshold(Number(savedThreshold));

    const savedRisk = localStorage.getItem('tracegraph_default_risk');
    if (savedRisk) setDefaultRiskLevel(savedRisk);
  }, []);

  const handleSave = () => {
    localStorage.setItem('tracegraph_alert_threshold', String(alertThreshold));
    localStorage.setItem('tracegraph_default_risk', defaultRiskLevel);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const handleReset = () => {
    setAlertThreshold(65);
    setDefaultRiskLevel('HIGH');
    setCompactDensity(false);
    setAutoRefresh(true);
    localStorage.removeItem('tracegraph_alert_threshold');
    localStorage.removeItem('tracegraph_default_risk');
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[var(--bg-card-elevated)] border border-[var(--accent-green)] px-4 py-3 text-xs font-semibold text-[var(--accent-green)] shadow-2xl">
          Settings saved to local storage!
        </div>
      )}

      {/* HEADER */}
      <section className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Dashboard preferences and local configuration
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--accent-purple)] bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-md">
            FRONTEND CONFIG ONLY
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DASHBOARD PREFERENCES */}
        <section className="card p-6 space-y-5">
          <div className="border-b border-[var(--border)] pb-3 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[var(--accent-blue)]" />
            <h2 className="text-base font-semibold text-white">Review Thresholds</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)] font-medium">Alert Score Threshold</span>
                <span className="font-mono font-bold text-white">{alertThreshold}</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)]"
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                Events scoring above this value are automatically placed in the high-priority review queue.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
              <label className="text-[var(--text-secondary)] font-medium block">Default Risk Level Filter</label>
              <select
                value={defaultRiskLevel}
                onChange={(e) => setDefaultRiskLevel(e.target.value)}
                className="input h-9 text-xs"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk Only (≥75)</option>
                <option value="MEDIUM">Medium Risk & Above (≥50)</option>
              </select>
            </div>
          </div>
        </section>

        {/* INTERFACE & SYSTEM */}
        <section className="card p-6 space-y-5">
          <div className="border-b border-[var(--border)] pb-3 flex items-center gap-2">
            <Moon className="h-4 w-4 text-[var(--accent-cyan)]" />
            <h2 className="text-base font-semibold text-white">Interface & Display</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">Dark Cybersecurity SOC Theme</div>
                <div className="text-[11px] text-[var(--text-muted)]">Default theme matching SOC standards</div>
              </div>
              <span className="badge badge-blue">ACTIVE</span>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
              <div>
                <div className="font-medium text-white">Compact Table Density</div>
                <div className="text-[11px] text-[var(--text-muted)]">Reduce table cell padding</div>
              </div>
              <input
                type="checkbox"
                checked={compactDensity}
                onChange={(e) => setCompactDensity(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent-blue)] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
              <div>
                <div className="font-medium text-white">Synthetic Dataset Mode</div>
                <div className="text-[11px] text-[var(--text-muted)]">Offline synthetic simulation</div>
              </div>
              <span className="badge badge-purple font-mono text-[10px]">SYNTHETIC ONLY</span>
            </div>
          </div>
        </section>
      </div>

      {/* SAVE / RESET ACTIONS */}
      <section className="card p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-ghost text-xs flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restore Defaults
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary text-xs flex items-center gap-1.5"
        >
          <Save className="h-3.5 w-3.5" /> Save Preferences
        </button>
      </section>
    </div>
  );
}
