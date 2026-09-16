'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, RotateCcw, Shield, Moon, Bell, Sliders } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

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
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-700 shadow-lg">
          Settings saved to local storage!
        </div>
      )}

      {/* HEADER */}
      <section className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dashboard preferences and local configuration
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DASHBOARD PREFERENCES */}
        <section className="card p-6 space-y-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Review Thresholds</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Alert Score Threshold</span>
                <span className="font-mono font-bold text-slate-900">{alertThreshold}</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                className="w-full accent-slate-900"
              />
              <p className="text-[11px] text-slate-400">
                Events scoring above this value are automatically placed in the high-priority review queue.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-slate-500 font-medium block">Default Risk Level Filter</label>
              <CustomSelect
                value={defaultRiskLevel}
                onChange={(val) => setDefaultRiskLevel(val)}
                options={[
                  { value: 'ALL', label: 'All Risk Levels' },
                  { value: 'HIGH', label: 'High Risk Only (≥75)' },
                  { value: 'MEDIUM', label: 'Medium Risk & Above (≥50)' },
                ]}
              />
            </div>
          </div>
        </section>

        {/* INTERFACE & SYSTEM */}
        <section className="card p-6 space-y-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Moon className="h-4 w-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Interface & Display</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">Studio Light Theme</div>
                <div className="text-[11px] text-slate-400">Clean fintech-grade interface</div>
              </div>
              <span className="badge badge-blue">ACTIVE</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div>
                <div className="font-medium text-slate-900">Compact Table Density</div>
                <div className="text-[11px] text-slate-400">Reduce table cell padding</div>
              </div>
              <input
                type="checkbox"
                checked={compactDensity}
                onChange={(e) => setCompactDensity(e.target.checked)}
                className="h-4 w-4 accent-slate-900 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div>
                <div className="font-medium text-slate-900">Dataset Mode</div>
                <div className="text-[11px] text-slate-400">Production-ready offline evaluation</div>
              </div>
              <span className="badge badge-blue">ACTIVE</span>
            </div>
          </div>
        </section>
      </div>

      {/* SAVE / RESET ACTIONS */}
      <section className="card p-4 flex items-center justify-between shadow-sm">
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
