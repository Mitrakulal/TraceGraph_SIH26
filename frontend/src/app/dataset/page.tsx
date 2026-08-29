'use client';

import React from 'react';
import { DATASET_INFO, DATASET_FEATURE_GROUPS } from '@/data/dataset';
import { Database, FileText, Lock, ShieldAlert, CheckCircle } from 'lucide-react';

export default function DatasetPage() {
  return (
    <div className="w-full space-y-6 pb-12">
      {/* HEADER */}
      <section className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Synthetic Dataset Explorer</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Benchmark dataset parameters, feature schema, and artifact manifest
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--accent-purple)] bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-md">
            OFFLINE · SYNTHETIC DATASET
          </span>
        </div>
      </section>

      {/* OVERVIEW STATS */}
      <section className="card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{DATASET_INFO.name}</h2>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
              Version: {DATASET_INFO.version} | Run ID: {DATASET_INFO.runId}
            </p>
          </div>
          <span className="badge badge-purple">{DATASET_INFO.dataClassification}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="card-elevated p-3">
            <span className="text-[var(--text-muted)] block text-[11px]">Synthetic Events</span>
            <span className="font-mono text-lg font-bold text-white mt-1 block">
              {DATASET_INFO.eventCount.toLocaleString()}
            </span>
          </div>
          <div className="card-elevated p-3">
            <span className="text-[var(--text-muted)] block text-[11px]">Queued Alerts</span>
            <span className="font-mono text-lg font-bold text-[var(--accent-red)] mt-1 block">
              {DATASET_INFO.alertCount}
            </span>
          </div>
          <div className="card-elevated p-3">
            <span className="text-[var(--text-muted)] block text-[11px]">SHAP Evidence Records</span>
            <span className="font-mono text-lg font-bold text-[var(--accent-cyan)] mt-1 block">
              {DATASET_INFO.evidenceCount}
            </span>
          </div>
          <div className="card-elevated p-3">
            <span className="text-[var(--text-muted)] block text-[11px]">Features Extracted</span>
            <span className="font-mono text-lg font-bold text-[var(--accent-green)] mt-1 block">
              18 Features
            </span>
          </div>
        </div>

        <div className="rounded border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-300">
          <strong>Dataset Limitation Note:</strong> {DATASET_INFO.limitation}
        </div>
      </section>

      {/* ARTIFACTS MANIFEST */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[var(--accent-blue)]" />
            <h2 className="text-base font-semibold text-white">Dataset Artifact Manifest</h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Artifacts stored in <code className="font-mono text-white">services/ml/artifacts/</code>
          </span>
        </div>

        <div className="data-table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Artifact File</th>
                <th>Description</th>
                <th>Access Level</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {DATASET_INFO.artifacts.map((art) => (
                <tr key={art.filename}>
                  <td className="font-mono text-xs font-bold text-white flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    {art.filename}
                  </td>
                  <td className="text-xs text-[var(--text-secondary)]">{art.description}</td>
                  <td>
                    {art.evaluatorOnly ? (
                      <span className="badge badge-high flex items-center gap-1 font-mono text-[10px]">
                        <Lock className="h-3 w-3" /> EVALUATOR ONLY — NOT EXPOSED TO INVESTIGATORS
                      </span>
                    ) : (
                      <span className="badge badge-low flex items-center gap-1 text-[10px]">
                        <CheckCircle className="h-3 w-3" /> INVESTIGATOR VISIBLE
                      </span>
                    )}
                  </td>
                  <td className="font-mono text-xs text-[var(--text-muted)]">{art.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FEATURE GROUPS */}
      <section className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Extracted Feature Schema (18 Time-Safe Features)</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(DATASET_FEATURE_GROUPS).map(([group, features]) => (
            <div key={group} className="card-elevated p-4 space-y-2">
              <div className="font-semibold text-xs text-[var(--accent-blue)] uppercase tracking-wider">
                {group} Features
              </div>
              <ul className="space-y-1 text-xs text-[var(--text-secondary)] font-mono">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--border)]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
