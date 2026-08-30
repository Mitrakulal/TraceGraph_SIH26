'use client';

/**
 * ScoringRunStatus Component — Live Model Scoring Lifecycle Panel
 *
 * Displays the authentic 8-stage prediction lifecycle:
 *   1. Synthetic CSV received
 *   2. Manifest validated
 *   3. Historical features calculated
 *   4. XGBoost probability calculated
 *   5. Novelty score calculated
 *   6. Graph relationships calculated
 *   7. Explainability generated
 *   8. Review result ready
 *
 * Accepts real backend status, latency, probabilities, and TreeSHAP features
 * without fabricated numbers or evaluator ground-truth leakage.
 *
 * Mandatory Notice: "Synthetic evidence only · Human review required"
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  CheckCircle2,
  Cpu,
  Layers,
  Network,
  Lightbulb,
  Gauge,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Zap,
  Check,
  Radio,
} from 'lucide-react';
import { ScoreEventResponse, ApiEvidenceItem } from '@/lib/api';

export type ScoringLifecycleStageId =
  | 'CSV_RECEIVED'
  | 'MANIFEST_VALIDATED'
  | 'FEATURES_CALCULATED'
  | 'XGBOOST_CALCULATED'
  | 'NOVELTY_CALCULATED'
  | 'GRAPH_CALCULATED'
  | 'EXPLAINABILITY_GENERATED'
  | 'RESULT_READY';

export type ScoringStatusState = 'idle' | 'pending' | 'success' | 'error';

export interface ScoringRunStatusProps {
  status: ScoringStatusState;
  currentStage?: ScoringLifecycleStageId;
  result?: ScoreEventResponse | null;
  evidence?: ApiEvidenceItem[] | null;
  alertId?: string | null;
  error?: string | null;
  eventId?: string | null;
  layout?: 'vertical' | 'horizontal';
  className?: string;
  onRetry?: () => void;
}

interface StepDefinition {
  id: ScoringLifecycleStageId;
  name: string;
  technicalLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const LIFECYCLE_STEPS: StepDefinition[] = [
  {
    id: 'CSV_RECEIVED',
    name: '1. Synthetic CSV received',
    technicalLabel: 'event_id ingest · 15 raw schema columns',
    description: 'Raw synthetic transaction record ingested from event stream.',
    icon: FileSpreadsheet,
  },
  {
    id: 'MANIFEST_VALIDATED',
    name: '2. Manifest validated',
    technicalLabel: 'SHA-256 schema check · non-empty record',
    description: 'Structure, types, and synthetic event boundaries verified.',
    icon: ShieldCheck,
  },
  {
    id: 'FEATURES_CALCULATED',
    name: '3. Historical features calculated',
    technicalLabel: '18 time-safe features · no future leakage',
    description: 'Temporal aggregates, wallet history, and IP metrics computed.',
    icon: Zap,
  },
  {
    id: 'XGBOOST_CALCULATED',
    name: '4. XGBoost probability calculated',
    technicalLabel: 'xgboost_model.json · P(anomaly)',
    description: 'Supervised gradient boosted tree outputs anomaly probability.',
    icon: Cpu,
  },
  {
    id: 'NOVELTY_CALCULATED',
    name: '5. Novelty score calculated',
    technicalLabel: 'isolation_forest.joblib · RobustScaler',
    description: 'Unsupervised isolation forest checks behavioral outlier distance.',
    icon: Layers,
  },
  {
    id: 'GRAPH_CALCULATED',
    name: '6. Graph relationships calculated',
    technicalLabel: 'graph_reach_proxy · degree ratio',
    description: 'Topological connectivity, in/out degrees, and reachability proxy.',
    icon: Network,
  },
  {
    id: 'EXPLAINABILITY_GENERATED',
    name: '7. Explainability generated',
    technicalLabel: 'TreeSHAP feature contributions · top factors',
    description: 'Feature attribution values computed for transparent review.',
    icon: Lightbulb,
  },
  {
    id: 'RESULT_READY',
    name: '8. Review result ready',
    technicalLabel: '0–100 review priority score · threshold check (≥65)',
    description: 'Final weighted review score produced and decision assigned.',
    icon: Gauge,
  },
];

export function ScoringRunStatus({
  status,
  currentStage,
  result,
  evidence,
  alertId,
  error,
  eventId,
  layout = 'vertical',
  className = '',
  onRetry,
}: ScoringRunStatusProps) {
  const [animStepIndex, setAnimStepIndex] = useState<number>(0);

  useEffect(() => {
    if (status === 'pending') {
      const interval = setInterval(() => {
        setAnimStepIndex((prev) => (prev < LIFECYCLE_STEPS.length - 1 ? prev + 1 : prev));
      }, 280);
      return () => clearInterval(interval);
    } else if (status === 'success') {
      setAnimStepIndex(LIFECYCLE_STEPS.length - 1);
    } else if (status === 'idle') {
      setAnimStepIndex(0);
    }
  }, [status]);

  const activeIndex =
    currentStage !== undefined
      ? LIFECYCLE_STEPS.findIndex((s) => s.id === currentStage)
      : status === 'pending'
      ? animStepIndex
      : status === 'success'
      ? LIFECYCLE_STEPS.length - 1
      : -1;

  return (
    <div
      className={`card flex flex-col justify-between p-5 border-[var(--border)] bg-[var(--bg-card)] shadow-xl ${className}`}
      aria-label="Model Scoring Lifecycle Inspector"
    >
      {/* PANEL HEADER */}
      <div className="space-y-3 border-b border-[var(--border)] pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[var(--accent-cyan)] animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Scoring Lifecycle
            </h2>
          </div>

          {/* STATUS PILL */}
          {status === 'idle' && (
            <span className="badge badge-neutral text-[10px] py-0.5 px-2">
              <Clock className="h-3 w-3" /> AWAITING EVENT
            </span>
          )}
          {status === 'pending' && (
            <span className="badge badge-blue text-[10px] py-0.5 px-2 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" /> RUNNING INFERENCE
            </span>
          )}
          {status === 'success' && (
            <span className="badge badge-low text-[10px] py-0.5 px-2">
              <Check className="h-3 w-3 text-[var(--accent-green)]" /> COMPLETE
            </span>
          )}
          {status === 'error' && (
            <span className="badge badge-high text-[10px] py-0.5 px-2">
              <AlertCircle className="h-3 w-3 text-[var(--accent-red)]" /> ERROR
            </span>
          )}
        </div>

        {eventId ? (
          <div className="flex items-center justify-between text-xs bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-md">
            <span className="text-[var(--text-muted)]">Target Event:</span>
            <span className="font-mono text-[var(--accent-cyan)] font-semibold truncate max-w-[200px]">
              {eventId}
            </span>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">
            Select any alert or event on the dashboard to execute live model inference.
          </p>
        )}
      </div>

      {/* 8-STEP STEPPER */}
      <div
        className={
          layout === 'vertical'
            ? 'space-y-2.5 my-4'
            : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 my-4'
        }
      >
        {LIFECYCLE_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted =
            status === 'success' || (status === 'pending' && index < activeIndex);
          const isCurrent =
            (status === 'pending' && index === activeIndex) ||
            (status === 'error' && index === activeIndex);
          const isPending =
            status === 'idle' ||
            (status === 'pending' && index > activeIndex) ||
            (status === 'error' && index > activeIndex);
          const isError = status === 'error' && index === activeIndex;

          return (
            <div
              key={step.id}
              className={[
                'flex items-start gap-3 p-2.5 rounded-lg border transition-all duration-200',
                isCompleted
                  ? 'bg-[rgba(34,197,94,0.06)] border-[rgba(34,197,94,0.25)] text-white'
                  : isError
                  ? 'bg-[rgba(239,68,68,0.12)] border-[var(--accent-red)] text-white'
                  : isCurrent
                  ? 'bg-[var(--accent-blue-dim)] border-[var(--accent-blue)] text-white shadow-md'
                  : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] opacity-70',
              ].join(' ')}
            >
              {/* STATUS ICON */}
              <div
                className={[
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs mt-0.5',
                  isCompleted
                    ? 'text-[var(--accent-green)] bg-green-950/40'
                    : isError
                    ? 'text-[var(--accent-red)] bg-red-950/40'
                    : isCurrent
                    ? 'text-[var(--accent-blue)] bg-blue-950/40'
                    : 'text-[var(--text-muted)] bg-[var(--bg-hover)]',
                ].join(' ')}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent && status === 'pending' ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-[var(--accent-blue)]" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>

              {/* STEP TEXT */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold leading-tight text-white truncate">
                    {step.name}
                  </span>
                  {isCompleted && (
                    <span className="font-mono text-[9px] text-[var(--accent-green)] font-bold">
                      DONE
                    </span>
                  )}
                  {isCurrent && status === 'pending' && (
                    <span className="font-mono text-[9px] text-[var(--accent-blue)] font-bold animate-pulse">
                      RUNNING
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug break-words">
                  {step.technicalLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ERROR STATE */}
      {status === 'error' && (
        <div className="p-3.5 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] space-y-2 my-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-red)]">
              <AlertCircle className="h-4 w-4" />
              <span>Validation / Execution Failed</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="btn btn-danger py-0.5 px-2 text-[11px] flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-mono leading-relaxed">
            {error || 'Unable to execute model prediction on target synthetic event.'}
          </p>
        </div>
      )}

      {/* SUCCESS RESULT SUMMARY */}
      {status === 'success' && result && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card-elevated)] p-4 space-y-3 my-2">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <div className="flex items-center gap-3">
              <div
                className="score-ring h-12 w-12 text-sm"
                style={{
                  borderColor:
                    result.risk_score >= 75
                      ? '#EF4444'
                      : result.risk_score >= 50
                      ? '#F59E0B'
                      : '#22C55E',
                  color:
                    result.risk_score >= 75
                      ? '#EF4444'
                      : result.risk_score >= 50
                      ? '#F59E0B'
                      : '#22C55E',
                }}
              >
                {result.risk_score}
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                  Review Score (0–100)
                </div>
                <div className="text-xs font-bold text-white">
                  {result.is_alert ? (
                    <span className="text-[var(--accent-red)]">🚨 ALERT QUEUED (≥ 65)</span>
                  ) : (
                    <span className="text-[var(--accent-green)]">✓ LOW PRIORITY (&lt; 65)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-[var(--text-muted)]">Inference Latency</div>
              <div className="font-mono text-xs font-bold text-[var(--accent-cyan)]">
                {result.inference_time_ms.toFixed(1)} ms (CPU)
              </div>
            </div>
          </div>

          {/* MODEL SIGNALS BREAKDOWN */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)]">P(anomaly)</div>
              <div className="font-mono font-bold text-[var(--accent-blue)] mt-0.5">
                {(result.ml_probability * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)]">Novelty (IF)</div>
              <div className="font-mono font-bold text-[var(--accent-purple)] mt-0.5">
                {(result.novelty_score * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)]">Graph Risk</div>
              <div className="font-mono font-bold text-[var(--accent-cyan)] mt-0.5">
                {(result.graph_risk_score * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* DIRECT INVESTIGATION ACTION */}
          {alertId && (
            <Link
              href={`/investigation/${alertId}`}
              className="btn btn-primary w-full py-1.5 text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              Open Full Alert Investigation <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* PERMANENT MANDATORY DISCLAIMER */}
      <div className="synthetic-notice flex items-center justify-between text-[11px] py-2 px-3 mt-3">
        <span className="font-semibold text-[var(--accent-purple)]">
          Synthetic evidence only · Human review required
        </span>
        <span className="font-mono text-[10px] text-[var(--text-muted)]">
          CPU-Only
        </span>
      </div>
    </div>
  );
}
