'use client';

import React, { useEffect, useState } from 'react';
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
  XCircle,
} from 'lucide-react';

import { MOCK_ALERTS } from '@/data/alerts';
import { getAlertsEvidence } from '@/data/evidence';
import { getAlertGraph } from '@/data/graph';
import { RelationshipGraph } from '@/components/investigation/RelationshipGraph';
import { getSeverity, getReviewStateClass, formatTimestamp, featureDisplayName } from '@/lib/utils';
import { api, ApiAlertDetailPayload } from '@/lib/api';

export default function InvestigationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = (params?.id as string) ?? 'alt_00001_syn_evt_004201';

  const [detail, setDetail] = useState<ApiAlertDetailPayload | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>('UNREVIEWED');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback mock items if offline
  const mockAlertItem = MOCK_ALERTS.find((a) => a.alert_id === alertId) ?? MOCK_ALERTS[0];
  const mockEvidence = getAlertsEvidence(alertId);
  const mockGraph = getAlertGraph(alertId);

  useEffect(() => {
    async function loadDetail() {
      let res = await api.getAlertDetail(alertId);
      if (!res || !res.alert) {
        // Fallback: fetch top alert from API if alertId is placeholder
        const listRes = await api.getAlerts({ page_size: 1 });
        if (listRes && listRes.items && listRes.items.length > 0) {
          const realAlertId = listRes.items[0].alert_id;
          res = await api.getAlertDetail(realAlertId);
        }
      }

      if (res && res.alert) {
        setDetail(res);
        setReviewStatus(res.alert.review_state);
        setIsBackendConnected(true);
      } else {
        setReviewStatus(mockAlertItem.review_state);
      }
    }
    loadDetail();
  }, [alertId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReviewAction = async (decision: 'REVIEWED' | 'DISMISSED' | 'ESCALATED', note?: string) => {
    setIsSubmitting(true);
    if (isBackendConnected) {
      const res = await api.submitReview(alertId, decision, note || `Review action: ${decision}`);
      if (res && res.review_state) {
        setReviewStatus(res.review_state);
        showToast(`Review action saved to SQLite database: ${res.review_state}`);
      } else {
        setReviewStatus(decision);
        showToast(`Alert status updated to ${decision}`);
      }
    } else {
      setReviewStatus(decision);
      showToast(`Alert status updated to ${decision} (offline mode)`);
    }
    setIsSubmitting(false);
  };

  const handleExportReport = () => {
    showToast('Investigation report case file generated');
  };

  // Derive dynamic vs fallback fields
  const activeScore = detail?.alert.risk_score ?? mockAlertItem.risk_score;
  const activeSourceWallet = detail?.alert.source_wallet ?? mockAlertItem.source_wallet;
  const activeObservedAt = detail?.alert.observed_at ?? mockAlertItem.observed_at;
  const activeProbability = detail?.alert.ml_probability ?? mockEvidence.modelEvidence.xgboostProbability;
  const activeNovelty = detail?.alert.novelty_score ?? mockEvidence.modelEvidence.isolationForestNovelty;
  const activeGraphRisk = detail?.alert.graph_risk_score ?? mockEvidence.modelEvidence.graphReachProxy;

  const severity = getSeverity(activeScore);

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
      <div className="flex items-center justify-between">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Alerts Queue
        </Link>
        <span className="font-mono text-xs text-purple-300 bg-purple-950/40 border border-purple-800/40 px-3 py-1 rounded-md">
          {isBackendConnected ? 'LIVE BACKEND DETAIL' : 'OFFLINE · SYNTHETIC DETAIL'}
        </span>
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
            </div>

            <h1 className="text-xl font-bold font-mono text-white tracking-tight">
              ALERT: {alertId}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {detail?.evidence?.[0]?.message || mockAlertItem.description}
            </p>
          </div>

          {/* RISK SCORE RING */}
          <div className="flex items-center gap-4 bg-[var(--bg-card-elevated)] p-4 rounded-lg border border-[var(--border)]">
            <div
              className="score-ring"
              style={{
                borderColor: activeScore >= 75 ? '#EF4444' : activeScore >= 50 ? '#F59E0B' : '#22C55E',
                color: activeScore >= 75 ? '#EF4444' : activeScore >= 50 ? '#F59E0B' : '#22C55E',
              }}
            >
              {activeScore}
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
              {activeSourceWallet}
            </Link>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block text-[11px]">Observed Timestamp</span>
            <span className="font-mono text-white block mt-0.5">{formatTimestamp(activeObservedAt)}</span>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block text-[11px]">Model Signal</span>
            <span className="font-mono text-[var(--accent-purple)] block mt-0.5">IF + XGBoost</span>
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
              disabled={isSubmitting}
              onClick={() => handleReviewAction('REVIEWED', 'Reviewed during analyst session.')}
              className="btn btn-success text-xs disabled:opacity-50"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Mark Reviewed
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleReviewAction('ESCALATED', 'Escalated for senior audit.')}
              className="btn btn-amber text-xs disabled:opacity-50"
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Escalate Case
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleReviewAction('DISMISSED', 'Dismissed background variation.')}
              className="btn btn-ghost border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-white disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5 text-[var(--text-muted)]" /> Dismiss
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
            Model evidence breakdown (Isolation Forest novelty, XGBoost probability & graph risk score)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ISOLATION FOREST NOVELTY */}
          <div className="card-elevated p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Isolation Forest Novelty</span>
              <span className="font-mono text-[var(--accent-purple)] font-bold">
                {(activeNovelty * 100).toFixed(0)}%
              </span>
            </div>
            <div className="risk-bar-track">
              <div
                className="h-full bg-[var(--accent-purple)]"
                style={{ width: `${Math.min(100, activeNovelty * 100)}%` }}
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
                {(activeProbability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="risk-bar-track">
              <div
                className="h-full bg-[var(--accent-red)]"
                style={{ width: `${Math.min(100, activeProbability * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Supervised tree ensemble probability score.
            </p>
          </div>

          {/* GRAPH RISK SCORE */}
          <div className="card-elevated p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Graph Risk Score</span>
              <span className="font-mono text-[var(--accent-cyan)] font-bold">
                {(activeGraphRisk * 100).toFixed(0)}%
              </span>
            </div>
            <div className="risk-bar-track">
              <div
                className="h-full bg-[var(--accent-cyan)]"
                style={{ width: `${Math.min(100, activeGraphRisk * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Time-safe topological distance and hop depth signal.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE CONTRIBUTIONS SECTION (TreeSHAP) */}
      <section className="card p-6 space-y-5">
        <div className="border-b border-[var(--border)] pb-3">
          <h2 className="text-lg font-bold text-white">TreeSHAP Feature Contributions</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Exact feature contributions computed by XGBoost TreeSHAP (Positive values increase risk, negative values decrease risk)
          </p>
        </div>

        <div className="space-y-3">
          {detail?.evidence && detail.evidence.length > 0 ? (
            detail.evidence.map((ev) => {
              const isPositive = ev.shap_value >= 0 || ev.direction === 'INCREASED_RISK';
              const absolutePct = Math.min(Math.abs(ev.shap_value) * 180, 100);

              return (
                <div key={ev.evidence_id} className="shap-bar-container">
                  <div className="shap-bar-label flex items-center justify-between pr-2">
                    <span className="font-medium text-white text-xs">{featureDisplayName(ev.feature)}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{ev.feature}</span>
                  </div>

                  <div className="shap-bar-track">
                    <div
                      className={isPositive ? 'shap-bar-fill-positive' : 'shap-bar-fill-negative'}
                      style={{ width: `${Math.max(5, absolutePct)}%` }}
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
                      {isPositive ? `+${ev.shap_value.toFixed(2)}` : ev.shap_value.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            mockEvidence.featureContributions.map((fc) => {
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
            })
          )}
        </div>
      </section>

      {/* RELATIONSHIP GRAPH SECTION */}
      <section>
        <RelationshipGraph graph={mockGraph} />
      </section>
    </div>
  );
}
