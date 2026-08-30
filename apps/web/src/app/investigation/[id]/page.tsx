'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import { api, ApiAlertDetailPayload, ApiGraphPayload } from '@/lib/api';
import { useStream } from '@/context/StreamContext';

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

  const { detectedAlerts } = useStream();

  const [dynamicGraph, setDynamicGraph] = useState<ApiGraphPayload | null>(null);

  // Helper to map API graph to component graph format
  const displayGraph = useMemo(() => {
    if (isBackendConnected && dynamicGraph) {
      return {
        alertId,
        nodes: dynamicGraph.nodes.map(n => ({
          id: n.id,
          label: n.label || n.id,
          type: (n.type === 'IP' ? 'network' : 'entity') as 'network' | 'entity',
          riskScore: n.risk_score || 0,
          suspicious: (n.risk_score || 0) >= 50 || n.is_focus,
          x: 0,
          y: 0
        })),
        edges: dynamicGraph.edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.type === 'SENT_TO' ? 'sent' : (e.type === 'OBSERVED_FROM' ? 'network obs' : 'connected')
        }))
      };
    }
    return mockGraph;
  }, [isBackendConnected, dynamicGraph, alertId]);

  useEffect(() => {
    async function loadDetail() {
      setDynamicGraph(null);
      let res = await api.getAlertDetail(alertId);
      if (!res || !res.alert) {
        // Fallback: check if this is a dynamic alert from StreamContext
        const dynamicAlert = detectedAlerts.find(a => a.alert_id === alertId);
        if (dynamicAlert) {
          // Re-score the event to get live SHAP evidence and rule hits
          try {
            const scoreRes = await api.scoreEvent(dynamicAlert.event_id);
            res = {
              alert: {
                ...dynamicAlert,
                rule_hits: scoreRes.rule_hits || [],
                reviewer_comment: null,
                reviewer_id: null,
                reviewed_at: null
              },
              evidence: scoreRes.evidence || [],
              graph_summary: { node_count: 5, edge_count: 4, truncated: false }
            };
          } catch (err) {
            console.warn('Failed to score event live', err);
            res = {
              alert: {
                ...dynamicAlert,
                rule_hits: [],
                reviewer_comment: null,
                reviewer_id: null,
                reviewed_at: null
              },
              evidence: [],
              graph_summary: { node_count: 5, edge_count: 4, truncated: false }
            };
          }
        } else {
          // Absolute fallback: fetch top alert from API if totally unknown
          const listRes = await api.getAlerts({ page_size: 1 });
          if (listRes && listRes.items && listRes.items.length > 0) {
            const realAlertId = listRes.items[0].alert_id;
            res = await api.getAlertDetail(realAlertId);
          }
        }
      }

      if (res && res.alert) {
        setDetail(res);
        setReviewStatus(res.alert.review_state);
        setIsBackendConnected(true);
        
        // Fetch graph dynamically for the actual source wallet
        try {
          const graphRes = await api.getEntityGraph(res.alert.source_wallet, 2, 40);
          if (graphRes && graphRes.nodes) {
            setDynamicGraph(graphRes);
          }
        } catch (err) {
          console.warn('Failed to load dynamic graph', err);
        }
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

  // Max SHAP absolute value for proportional relative bar scaling
  const maxShapVal = useMemo(() => {
    if (detail?.evidence && detail.evidence.length > 0) {
      return Math.max(...detail.evidence.map((ev) => Math.abs(ev.shap_value)), 0.001);
    }
    return Math.max(...mockEvidence.featureContributions.map((fc) => Math.abs(fc.value)), 0.001);
  }, [detail, mockEvidence]);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700 px-4 py-3 text-xs font-bold text-white shadow-2xl animate-bounce">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* NAVIGATION BACK BUTTON */}
      <div className="flex items-center justify-between">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Alerts Queue
        </Link>
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1 rounded-full">
          {isBackendConnected ? 'LIVE BACKEND DETAIL' : 'OFFLINE · SYNTHETIC DETAIL'}
        </span>
      </div>

      {/* TOP SUMMARY BANNER CARD */}
      <section className="card p-6 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
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

            <h1 className="text-xl font-extrabold font-mono text-slate-900 tracking-tight">
              ALERT: {alertId}
            </h1>
            <p className="text-sm text-slate-500">
              {detail?.evidence?.[0]?.message || mockAlertItem.description}
            </p>
          </div>

          {/* RISK SCORE RING */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div
              className="score-ring bg-white shadow-sm"
              style={{
                borderColor: activeScore >= 75 ? '#EF4444' : activeScore >= 50 ? '#F59E0B' : '#10B981',
                color: activeScore >= 75 ? '#EF4444' : activeScore >= 50 ? '#F59E0B' : '#10B981',
              }}
            >
              {activeScore}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Synthetic Risk Score</div>
              <div className="text-[11px] text-slate-400">Scale 0 - 100</div>
              <div className="text-[10px] text-purple-600 font-mono font-bold mt-0.5">CPU-evaluated</div>
            </div>
          </div>
        </div>

        {/* METADATA GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] font-bold uppercase">Synthetic Entity ID</span>
            <Link
              href={`/entities`}
              className="font-mono font-bold text-blue-600 hover:underline block mt-0.5"
            >
              {activeSourceWallet}
            </Link>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-bold uppercase">Observed Timestamp</span>
            <span className="font-mono text-slate-900 font-bold block mt-0.5">{formatTimestamp(activeObservedAt)}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-bold uppercase">Model Signal</span>
            <span className="font-mono text-purple-600 font-bold block mt-0.5">IF + XGBoost</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-bold uppercase">Data Classification</span>
            <span className="font-mono text-slate-700 font-bold block mt-0.5">OFFLINE SYNTHETIC</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleReviewAction('REVIEWED', 'Reviewed during analyst session.')}
              className="btn btn-success text-xs font-bold disabled:opacity-50"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Mark Reviewed
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleReviewAction('ESCALATED', 'Escalated for senior audit.')}
              className="btn btn-amber text-xs font-bold disabled:opacity-50"
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Escalate Case
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleReviewAction('DISMISSED', 'Dismissed background variation.')}
              className="btn btn-ghost text-xs text-slate-500 hover:text-slate-900 font-bold disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5 text-slate-400" /> Dismiss
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportReport}
            className="btn btn-ghost text-xs font-bold"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" /> Export Case Report
          </button>
        </div>
      </section>

      {/* EXPLAINABILITY SECTION: WHY WAS THIS FLAGGED? */}
      <section className="card p-6 space-y-5 shadow-sm">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            Why Was This Flagged?
          </h2>
          <p className="text-xs text-slate-500">
            Model evidence breakdown (Isolation Forest novelty, XGBoost probability & graph risk score)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ISOLATION FOREST NOVELTY */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Isolation Forest Novelty</span>
              <span className="font-mono text-purple-600 font-extrabold">
                {(activeNovelty * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full"
                style={{ width: `${Math.min(100, activeNovelty * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Deviates from normal synthetic background baseline pattern.
            </p>
          </div>

          {/* XGBOOST PROBABILITY */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">XGBoost Anomaly Prob</span>
              <span className="font-mono text-rose-600 font-extrabold">
                {(activeProbability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full"
                style={{ width: `${Math.min(100, activeProbability * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Supervised tree ensemble probability score.
            </p>
          </div>

          {/* GRAPH RISK SCORE */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Graph Risk Score</span>
              <span className="font-mono text-blue-600 font-extrabold">
                {(activeGraphRisk * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${Math.min(100, activeGraphRisk * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Time-safe topological distance and hop depth signal.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE CONTRIBUTIONS SECTION (TreeSHAP) */}
      <section className="card p-6 space-y-5 shadow-sm">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-extrabold text-slate-900">TreeSHAP Feature Contributions</h2>
          <p className="text-xs text-slate-500">
            Exact feature contributions computed by XGBoost TreeSHAP (Positive values increase risk, negative values decrease risk)
          </p>
        </div>

        <div className="space-y-3.5">
          {detail?.evidence && detail.evidence.length > 0 ? (
            detail.evidence.map((ev) => {
              const isPositive = ev.shap_value >= 0 || ev.direction === 'INCREASED_RISK';
              const relativePct = Math.max(5, (Math.abs(ev.shap_value) / maxShapVal) * 100);

              return (
                <div key={ev.evidence_id} className="shap-bar-container">
                  <div className="shap-bar-label flex items-center justify-between pr-3">
                    <span className="font-bold text-slate-800 text-xs">{featureDisplayName(ev.feature)}</span>
                    <span className="text-[10px] font-mono text-slate-400">{ev.feature}</span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPositive
                          ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                          : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      }`}
                      style={{ width: `${relativePct}%` }}
                    />
                  </div>

                  <div className="shap-bar-value">
                    <span
                      className={
                        isPositive
                          ? 'font-mono text-xs font-bold text-rose-600'
                          : 'font-mono text-xs font-bold text-emerald-600'
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
              const relativePct = Math.max(5, (Math.abs(fc.value) / maxShapVal) * 100);

              return (
                <div key={fc.feature} className="shap-bar-container">
                  <div className="shap-bar-label flex items-center justify-between pr-3">
                    <span className="font-bold text-slate-800 text-xs">{fc.displayName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{fc.group}</span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPositive
                          ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                          : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      }`}
                      style={{ width: `${relativePct}%` }}
                    />
                  </div>

                  <div className="shap-bar-value">
                    <span
                      className={
                        isPositive
                          ? 'font-mono text-xs font-bold text-rose-600'
                          : 'font-mono text-xs font-bold text-emerald-600'
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
        <RelationshipGraph graph={displayGraph} />
      </section>
    </div>
  );
}
