'use client';

/**
 * Live Event Ingest & Model Inspector — CPU Mode (TraceGraph AI)
 *
 * Provides deep-dive single-event analysis, 8-stage prediction lifecycle
 * verification, raw 18-feature telemetry inspection, and TreeSHAP attribution.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Cpu,
  Layers,
  Radio,
  Dices,
  RotateCcw,
  Search,
  ArrowRight,
  Code2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  Database,
} from 'lucide-react';
import {
  api,
  ScoreEventResponse,
  SampleEventsResponse,
  ApiAlertDetailPayload,
} from '@/lib/api';
import { featureDisplayName } from '@/lib/utils';
import { ScoringRunStatus, ScoringStatusState } from '@/components/dashboard/ScoringRunStatus';
import { useStream } from '@/context/StreamContext';

export default function InspectorPage() {
  const { streamEvents, detectedAlerts } = useStream();
  const [samples, setSamples] = useState<SampleEventsResponse | null>(null);

  // Inspector State
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [scoringStatus, setScoringStatus] = useState<ScoringStatusState>('idle');
  const [scoreResult, setScoreResult] = useState<ScoreEventResponse | null>(null);
  const [alertDetail, setAlertDetail] = useState<ApiAlertDetailPayload | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  useEffect(() => {
    async function loadSamples() {
      const res = await api.getSampleEvents();
      if (res) {
        setSamples(res);
        if (res.alert_events.length > 0) {
          const first = res.alert_events[0];
          setSelectedEventId(first.event_id);
          setSelectedAlertId(first.alert_id);
        }
      }
    }
    loadSamples();
  }, []);

  const runLiveInference = async (eventId: string, alertId?: string | null) => {
    if (!eventId) return;
    setSelectedEventId(eventId);
    setSelectedAlertId(alertId ?? null);
    setScoringStatus('pending');
    setScoreResult(null);
    setAlertDetail(null);
    setScoreError(null);

    try {
      const [res, detail] = await Promise.all([
        api.scoreEvent(eventId),
        alertId ? api.getAlertDetail(alertId) : Promise.resolve(null),
      ]);

      if (res && res.event_id) {
        setScoreResult(res);
        if (detail) setAlertDetail(detail);
        setScoringStatus('success');
      } else {
        setScoreError(`Failed to score event '${eventId}'. Event ID may be invalid or not in the committed run.`);
        setScoringStatus('error');
      }
    } catch (err: any) {
      setScoreError(err?.message || 'Error occurred while executing inference request.');
      setScoringStatus('error');
    }
  };

  const handlePickRandomBackground = () => {
    if (!samples?.background_events?.length) return;
    const pool = samples.background_events;
    const rand = pool[Math.floor(Math.random() * pool.length)];
    runLiveInference(rand, null);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      runLiveInference(searchQuery.trim(), null);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* PAGE HEADER */}
      <section className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Live Event Ingest & Model Inspector
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Real-time CPU model inference, 8-stage lifecycle telemetry, and TreeSHAP attribution verification
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--accent-purple)] bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-[var(--accent-purple)]" />
            CPU INFERENCE MODE
          </span>
        </div>
      </section>

      {/* EVENT INGEST PICKER BAR */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            Synthetic Event Ingest Selector
          </div>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            1,000 Stream Pool Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* QUEUE DROPDOWN */}
          <div className="sm:col-span-5">
            <select
              value={selectedAlertId ?? ''}
              onChange={(e) => {
                const aid = e.target.value;
                const found = samples?.alert_events.find((a) => a.alert_id === aid);
                if (found) {
                  runLiveInference(found.event_id, found.alert_id);
                }
              }}
              className="input h-9 text-xs w-full"
            >
              <option value="">— Select from Flagged Alert Queue —</option>
              {samples?.alert_events.map((a, i) => (
                <option key={a.alert_id} value={a.alert_id}>
                  Queue #{i + 1} · {a.alert_id} ({a.event_id})
                </option>
              ))}
            </select>
          </div>

          {/* MANUAL EVENT ID SEARCH */}
          <form onSubmit={handleManualSearch} className="sm:col-span-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Enter event_id (e.g. syn_evt_004201)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input h-9 pl-8 text-xs font-mono w-full"
              />
            </div>
            <button type="submit" className="btn btn-ghost border border-[var(--border)] h-9 px-3 text-xs">
              Go
            </button>
          </form>

          {/* ACTIONS */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePickRandomBackground}
              disabled={scoringStatus === 'pending'}
              className="btn btn-ghost border border-[var(--border)] h-9 px-3 text-xs flex items-center gap-1.5 flex-1 justify-center disabled:opacity-50"
            >
              <Dices className="h-3.5 w-3.5" /> Random
            </button>
            <button
              type="button"
              onClick={() => selectedEventId && runLiveInference(selectedEventId, selectedAlertId)}
              disabled={!selectedEventId || scoringStatus === 'pending'}
              className="btn btn-primary h-9 px-3 text-xs flex items-center gap-1.5 flex-1 justify-center disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Re-Score
            </button>
          </div>
        </div>
      </section>

      {/* 8-STAGE PREDICTION LIFECYCLE STEPPER */}
      <section>
        <ScoringRunStatus
          status={scoringStatus}
          result={scoreResult}
          evidence={alertDetail?.evidence}
          alertId={selectedAlertId}
          error={scoreError}
          eventId={selectedEventId}
          layout="horizontal"
          onRetry={() => selectedEventId && runLiveInference(selectedEventId, selectedAlertId)}
        />
      </section>

      {/* EXTRACTED FEATURES & SHAP EXPLAINABILITY */}
      {scoreResult && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 18 TIME-SAFE FEATURES */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[var(--accent-cyan)]" />
                <h3 className="text-sm font-bold text-white">18 Historical Features Extracted</h3>
              </div>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                {scoreResult.inference_time_ms.toFixed(1)} ms latency
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {Object.entries(scoreResult.features_used).map(([key, val]) => (
                <div
                  key={key}
                  className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-elevated)] p-2.5 space-y-1"
                >
                  <div className="text-[10px] text-[var(--text-muted)] truncate" title={key}>
                    {featureDisplayName(key)}
                  </div>
                  <div className="font-mono text-xs font-bold text-[var(--accent-cyan)]">
                    {typeof val === 'number' ? val.toFixed(4) : String(val)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SHAP EXPLAINABILITY BREAKDOWN */}
          <div className="card p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[var(--accent-purple)]" />
                  <h3 className="text-sm font-bold text-white">TreeSHAP Explainability Factors</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRawJson((v) => !v)}
                  className="btn btn-ghost py-0.5 px-2 text-[11px] border border-[var(--border)] flex items-center gap-1"
                >
                  <Code2 className="h-3 w-3" /> {showRawJson ? 'Hide JSON' : 'Raw JSON'}
                </button>
              </div>

              {/* EVIDENCE BARS */}
              <div className="space-y-3 mt-4">
                {alertDetail?.evidence && alertDetail.evidence.length > 0 ? (
                  alertDetail.evidence.slice(0, 5).map((ev) => {
                    const isPositive = ev.shap_value >= 0;
                    const widthPct = Math.min(100, Math.abs(ev.shap_value) * 160);

                    return (
                      <div key={ev.evidence_id} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">
                            {featureDisplayName(ev.feature)}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              isPositive ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {ev.shap_value.toFixed(3)}
                          </span>
                        </div>
                        <div className="risk-bar-track">
                          <div
                            className={`h-full ${
                              isPositive ? 'shap-bar-fill-positive' : 'shap-bar-fill-negative'
                            }`}
                            style={{ width: `${Math.max(6, widthPct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-lg bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                    {scoreResult.is_alert
                      ? 'Live TreeSHAP contributions assembled from current model tree weights.'
                      : 'This synthetic event is scored below review threshold (<65). No anomaly attribution required for benign traffic.'}
                  </div>
                )}
              </div>
            </div>

            {selectedAlertId && (
              <div className="border-t border-[var(--border)] pt-3">
                <Link
                  href={`/investigation/${selectedAlertId}`}
                  className="btn btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  Open Full Case Investigation for #{selectedAlertId.slice(4, 14)} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* RAW JSON PROOF */}
      {showRawJson && scoreResult && (
        <section className="card p-4 space-y-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            Raw Model Inference Output
          </div>
          <pre className="max-h-60 overflow-auto rounded-md border border-[var(--border)] bg-[#0B0E13] p-3 font-mono text-[11px] leading-relaxed text-[var(--accent-green)]">
            {JSON.stringify(scoreResult, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
