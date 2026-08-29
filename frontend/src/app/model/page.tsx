'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, Cpu, ShieldCheck, Layers } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { REAL_MODEL_CARD, MODEL_METRICS } from '@/data/model';
import { featureDisplayName } from '@/lib/utils';

const PERFORMANCE_CHART_DATA = [
  {
    metric: 'PR-AUC',
    score: (MODEL_METRICS?.test?.pr_auc ?? 0.999) * 100,
  },
  {
    metric: 'ROC-AUC',
    score: (MODEL_METRICS?.test?.roc_auc ?? 0.999) * 100,
  },
  {
    metric: 'Precision',
    score: (MODEL_METRICS?.test?.precision_at_threshold ?? 0.947) * 100,
  },
  {
    metric: 'Recall',
    score: (MODEL_METRICS?.test?.recall_at_threshold ?? 0.931) * 100,
  },
  {
    metric: 'F1',
    score: (MODEL_METRICS?.test?.f1_at_threshold ?? 0.939) * 100,
  },
];

export default function ModelIntelligencePage() {
  const featureList = REAL_MODEL_CARD?.feature_list ?? [];

  return (
    <div className="w-full space-y-8 pb-12">
      {/* PAGE HEADER */}
      <section className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Model Intelligence</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Two-stage anomaly detection & risk classification pipeline architecture
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--accent-purple)] bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-md">
            RUN ID: sih26146-cpu-demo-2026-v1
          </span>
        </div>
      </section>

      {/* MODEL OVERVIEW */}
      <section className="card p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-[var(--accent-blue)] font-semibold">
              Pipeline Architecture
            </div>
            <h2 className="mt-1 text-xl font-bold text-white">
              {REAL_MODEL_CARD?.model_name ?? 'Isolation Forest + XGBoost'}
            </h2>
            <p className="mt-2 text-xs text-[var(--text-secondary)] max-w-xl">
              Combines unsupervised novelty detection (Isolation Forest) with supervised tree ensemble classification (XGBoost) to generate explainable 0–100 review priority scores.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-[var(--border)] pt-4 lg:pt-0 lg:pl-6">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Time-Safe Features</div>
              <div className="mt-1 font-mono text-lg font-bold text-white">
                {featureList.length || 18}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Compute Mode</div>
              <div className="mt-1 text-sm font-semibold text-[var(--accent-green)]">CPU Only</div>
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Alert Threshold</div>
              <div className="mt-1 font-mono text-lg font-bold text-[var(--accent-amber)]">65</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (STAGES) */}
      <section className="card p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-white">Two-Stage Model Signal Breakdown</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Complementary signals from unsupervised and supervised models are merged into a unified review score.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* ISOLATION FOREST */}
          <div className="card-elevated p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Stage 1: Isolation Forest</h3>
              <span className="font-mono text-xs text-[var(--accent-purple)] font-semibold">15% Weight</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Unsupervised anomaly detection trained on background synthetic events to isolate novel behavioral outliers without needing labeled fraud examples.
            </p>
            <div className="border-t border-[var(--border)] pt-3 flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Output Signal:</span>
              <span className="font-mono text-white font-semibold">Novelty Score (0 - 1)</span>
            </div>
          </div>

          {/* XGBOOST */}
          <div className="card-elevated p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Stage 2: XGBoost Classifier</h3>
              <span className="font-mono text-xs text-[var(--accent-blue)] font-semibold">85% Weight</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Supervised gradient boosted trees trained on synthetic benchmark patterns (structuring, peel chain, rapid hop, fan-out/fan-in) with native TreeSHAP explainability.
            </p>
            <div className="border-t border-[var(--border)] pt-3 flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Output Signal:</span>
              <span className="font-mono text-white font-semibold">Anomaly Probability (0 - 1)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card-elevated)] p-4 text-center md:flex-row md:text-left">
          <div>
            <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Merged Output</div>
            <div className="text-xs font-semibold text-white">Model Signals Combined into Review Priority Score</div>
          </div>
          <ArrowRight className="hidden h-4 w-4 text-[var(--text-muted)] md:block" />
          <div className="font-mono text-lg font-bold text-[var(--accent-red)]">0 – 100 Risk Score</div>
        </div>
      </section>

      {/* TEST PERFORMANCE */}
      <section className="card p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-white">Held-Out Test Set Performance</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Benchmark performance metrics evaluated on held-out synthetic test set
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PERFORMANCE_CHART_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="metric" stroke="#5F6978" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5F6978" fontSize={11} domain={[90, 100]} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151A21',
                    borderColor: '#252B34',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                  {PERFORMANCE_CHART_DATA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="#3B82F6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="card-elevated p-3">
              <span className="text-[11px] text-[var(--text-muted)]">PR-AUC</span>
              <div className="font-mono text-lg font-bold text-white mt-1">
                {(MODEL_METRICS?.test?.pr_auc ?? 0.999).toFixed(5)}
              </div>
            </div>
            <div className="card-elevated p-3">
              <span className="text-[11px] text-[var(--text-muted)]">Precision @ Threshold</span>
              <div className="font-mono text-lg font-bold text-white mt-1">
                {((MODEL_METRICS?.test?.precision_at_threshold ?? 0.947) * 100).toFixed(2)}%
              </div>
            </div>
            <div className="card-elevated p-3">
              <span className="text-[11px] text-[var(--text-muted)]">Recall @ Threshold</span>
              <div className="font-mono text-lg font-bold text-white mt-1">
                {((MODEL_METRICS?.test?.recall_at_threshold ?? 0.931) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE IMPORTANCE */}
      <section className="card p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">Global Feature Importance</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Relative contribution of each extracted feature across the synthetic dataset
          </p>
        </div>

        <div className="space-y-3">
          {featureList.map((feature) => {
            const pct = (feature.importance * 100).toFixed(1);
            const barWidth = Math.min(feature.importance * 350, 100);

            return (
              <div key={feature.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white">{featureDisplayName(feature.name)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{feature.group}</span>
                    <span className="font-mono text-white font-bold w-12 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent-blue)] transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DETECTION PIPELINE STEP-BY-STEP */}
      <section className="card p-6 space-y-5">
        <h2 className="text-base font-semibold text-white">End-to-End Pipeline Workflow</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ['01', 'Synthetic Events', '60,000 input events'],
            ['02', 'Feature Extraction', '18 time-safe features'],
            ['03', 'Model Scoring', 'IF + XGBoost ensemble'],
            ['04', 'Risk Score', '0–100 review priority'],
            ['05', 'Human Review', 'Analyst case decision'],
          ].map(([step, title, desc]) => (
            <div key={step} className="card-elevated p-4 space-y-2">
              <div className="font-mono text-xs text-[var(--accent-blue)] font-bold">{step}</div>
              <div className="text-xs font-bold text-white">{title}</div>
              <div className="text-[11px] text-[var(--text-muted)]">{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}