'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  Share2,
  Cpu,
  Layers,
  Building2,
  Clock,
  Activity,
  Check,
} from 'lucide-react';

import { MOCK_ALERTS } from '@/data/alerts';
import { getAlertsEvidence } from '@/data/evidence';
import { getAlertGraph } from '@/data/graph';
import { RelationshipGraph } from '@/components/investigation/RelationshipGraph';
import { getSeverity, getReviewStateClass, formatTimestamp } from '@/lib/utils';

export default function InvestigationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = (params?.id as string) ?? 'alt_00001_syn_evt_004201';

  // Find matching alert or fallback
  const alertItem = MOCK_ALERTS.find((a) => a.alert_id === alertId) ?? MOCK_ALERTS[0];
  const evidence = getAlertsEvidence(alertId);
  const graph = getAlertGraph(alertId);

  const [reviewStatus, setReviewStatus] = useState<string>(alertItem.review_state);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMarkReviewed = () => {
    setReviewStatus('REVIEWED');
    showToast('Alert status updated to REVIEWED');
  };

  const handleEscalate = () => {
    setReviewStatus('ESCALATED');
    showToast('Alert escalated for senior analyst audit');
  };

  const handleExportReport = () => {
    showToast('Investigation report PDF generated (synthetic mock)');
  };

  const severity = getSeverity(alertItem.risk_score);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[var(--bg-card-elevated)] border border-[var(--accent-blue)] px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-bounce">
          <Check className="h-4 w-4 text-[var(--accent-green)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* NAVIGATION BACK BUTTON */}
      <div>
        <Link
          href="/alerts"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Alerts Queue
        </Link>
      </div>

      {/* TOP SUMMARY BANNER CARD */}
      <section className="card p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  severity === 'HIGH'
                    ? 'badge badge-high'
                    : severity === 'MEDIUM'
                    ? 'badge badge-medium'
                    : 'badge badge-low'
                }
              >
                {severity} RISK
              </span>
              <span className={getReviewStateClass(reviewStatus)}>{reviewStatus}</span>
              <span className="font-mono text-xs text-[var(--text-muted)]">RANK #{alertItem.queue_rank}</span>
            </div>

            <h1 className="text-xl font-bold font-mono text-white tracking-tight">
              ALERT: {alertItem.alert_id}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">{alertItem.description}</p>
          </div>

          {/* RISK SCORE RING */}
          <div className="flex items-center gap-4 bg-[var(--bg-card-elevated)] p-4 rounded-lg border border-[var(--border)]">
            <div
              className="score-ring"
              style={{
                borderColor: alertItem.risk_score >= 75 ? '#EF4444' : alertItem.risk_score >= 50 ? '#F59E0B' : '#22C55E',
                color: alertItem.risk_score >= 75 ? '#EF4444' : alertItem.risk_score >= 50 ? '#F59E0B' : '#22C55E',
              }}
            >
              {alertItem.risk_score}
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Synthetic Risk Score</div>
              <div className="text-[11px] text-[var(--text-muted)]">Scale 0 - 100</div>
              <div className="text-[10px] text-[var(--accent-purple)] font-mono mt-0.5">CPU-evaluated</div>
            </div>
          </div>
        </div>

        {/* METADATA GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[var(--text-muted)] block text-[11px]">Synthetic Entity ID</span>
            <Link
              href={`/entities`}
              className="font-mono font-bold text-[var(--accent-cyan)] hover:underline block mt-0.5"
            >
              {alertItem.source_wallet}
            </Link>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block text-[11px]">Observed Timestamp</span>
            <span className="font-mono text-white block mt-0.5">{formatTimestamp(alertItem.observed_at)}</span>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block text-[11px]">Model Signal</span>
            <span className="font-mono text-[var(--accent-purple)] block mt-0.5">{alertItem.model_signal}</span>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block text-[11px]">Data Classification</span>
            <span className="font-mono text-purple-300 block mt-0.5">OFFLINE SYNTHETIC</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMarkReviewed}
              className="btn btn-success text-xs"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Mark Reviewed
            </button>

            <button
              type="button"
              onClick={handleEscalate}
              className="btn btn-amber text-xs"
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Escalate Case
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportReport}
            className="btn btn-ghost text-xs"
          >
            <Download className="h-3.5 w-3.5 text-[var(--accent-blue)]" /> Export Case Report
          </button>
        </div>
      </section>

      {/* EXPLAINABILITY SECTION: WHY WAS THIS FLAGGED? */}
      <section className="card p-6 space-y-5">
        <div className="border-b border-[var(--border)] pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[var(--accent-blue)]" />
            Why Was This Flagged?
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Precomputed model evidence breakdown (Isolation Forest novelty, XGBoost probability & graph reach proxy)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ISOLATION FOREST NOVELTY */}
          <div className="card-elevated p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Isolation Forest Novelty</span>
              <span className="font-mono text-[var(--accent-purple)] font-bold">
                {(evidence.modelEvidence.isolationForestNovelty * 100).toFixed(0)}%
              </span>
            </div>
            <div className="risk-bar-track">
              <div
                className="h-full bg-[var(--accent-purple)]"
                style={{ width: `${evidence.modelEvidence.isolationForestNovelty * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Deviates from normal synthetic background baseline pattern.
            </p>
          </div>

          {/* XGBOOST PROBABILITY */}
          <div className="card-elevated p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">XGBoost Anomaly Prob</span>
              <span className="font-mono text-[var(--accent-red)] font-bold">
                {(evidence.modelEvidence.xgboostProbability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="risk-bar-track">
              <div
                className="h-full bg-[var(--accent-red)]"
                style={{ width: `${evidence.modelEvidence.xgboostProbability * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Supervised tree ensemble probability score.
            </p>
          </div>

          {/* GRAPH REACH PROXY */}
          <div className="card-elevated p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Graph Reach Proxy</span>
              <span className="font-mono text-[var(--accent-cyan)] font-bold">
                {(evidence.modelEvidence.graphReachProxy * 100).toFixed(0)}%
              </span>
            </div>
            <div className="risk-bar-track">
              <div
                className="h-full bg-[var(--accent-cyan)]"
                style={{ width: `${evidence.modelEvidence.graphReachProxy * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Time-safe topological distance and hop depth signal.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE CONTRIBUTIONS SECTION */}
      <section className="card p-6 space-y-5">
        <div className="border-b border-[var(--border)] pb-3">
          <h2 className="text-lg font-bold text-white">Feature Contributions</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Precomputed TreeSHAP feature contributions (Positive values increase risk, negative values decrease risk)
          </p>
        </div>

        <div className="space-y-3">
          {evidence.featureContributions.map((fc) => {
            const isPositive = fc.value >= 0;
            const absolutePct = Math.min(Math.abs(fc.value) * 220, 100);

            return (
              <div key={fc.feature} className="shap-bar-container">
                <div className="shap-bar-label flex items-center justify-between pr-2">
                  <span className="font-medium text-white text-xs">{fc.displayName}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{fc.group}</span>
                </div>

                <div className="shap-bar-track">
                  <div
                    className={isPositive ? 'shap-bar-fill-positive' : 'shap-bar-fill-negative'}
                    style={{ width: `${absolutePct}%` }}
                  />
                </div>

                <div className="shap-bar-value">
                  <span
                    className={
                      isPositive
                        ? 'font-mono text-xs font-bold text-[var(--accent-red)]'
                        : 'font-mono text-xs font-bold text-[var(--accent-green)]'
                    }
                  >
                    {isPositive ? `+${fc.value.toFixed(2)}` : fc.value.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RELATIONSHIP GRAPH SECTION */}
      <section>
        <RelationshipGraph graph={graph} />
      </section>
    </div>
  );
}
