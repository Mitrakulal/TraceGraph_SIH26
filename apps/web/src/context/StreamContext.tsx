'use client';

/**
 * StreamContext — Persistent 1,000-Event Evaluation Stream Provider
 *
 * Manages the live stream evaluation of 1,000 synthetic transactions
 * (70% normal : 30% suspicious ratio). Evaluates transactions one-by-one
 * via real model inference on CPU, and dynamically updates:
 *   - Events Analyzed counter (1 → 1,000)
 *   - Monitored Entities count
 *   - Priority Alerts Queue (dynamically ranked by risk score)
 *   - Activity Timeline (progressive hourly aggregation)
 *   - Risk Distribution (HIGH / MEDIUM / LOW)
 *
 * Preserves execution state across page navigation.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  api,
  StreamEventItem,
  ScoreEventResponse,
  ApiAlertListItem,
} from '@/lib/api';

export interface ActivityPoint {
  time: string;
  transactions: number;
  alerts: number;
}

export interface RiskBreakdown {
  high: number;
  medium: number;
  low: number;
}

export interface StreamContextType {
  // Data stream
  streamEvents: StreamEventItem[];
  currentIndex: number;
  totalEvents: number;
  isLoaded: boolean;

  // Real-time evaluation stats
  processedCount: number;
  uniqueEntitiesCount: number;
  highRiskAlertsCount: number;
  evidenceRecordsCount: number;

  // Dynamic Collections
  detectedAlerts: ApiAlertListItem[];
  activityTimeline: ActivityPoint[];
  riskDistribution: RiskBreakdown;
  latestScoredEvent: ScoreEventResponse | null;

  // Stream Controls
  isPlaying: boolean;
  isDone: boolean;
  speed: number;
  startStream: () => void;
  pauseStream: () => void;
  toggleStream: () => void;
  resetStream: () => void;
  stepStream: () => Promise<void>;
  setSpeed: (speed: number) => void;
  scoreSpecificEvent: (eventId: string) => Promise<ScoreEventResponse | null>;
}

const StreamContext = createContext<StreamContextType | null>(null);

const FIXED_TIMELINE_BUCKETS: ActivityPoint[] = [
  { time: '00:00', transactions: 0, alerts: 0 },
  { time: '04:00', transactions: 0, alerts: 0 },
  { time: '08:00', transactions: 0, alerts: 0 },
  { time: '12:00', transactions: 0, alerts: 0 },
  { time: '16:00', transactions: 0, alerts: 0 },
  { time: '20:00', transactions: 0, alerts: 0 },
];

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const [streamEvents, setStreamEvents] = useState<StreamEventItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Dynamic collections
  const [uniqueEntities, setUniqueEntities] = useState<Set<string>>(new Set());
  const [detectedAlerts, setDetectedAlerts] = useState<ApiAlertListItem[]>([]);
  const [activityTimeline, setActivityTimeline] = useState<ActivityPoint[]>(FIXED_TIMELINE_BUCKETS);
  const [riskDistribution, setRiskDistribution] = useState<RiskBreakdown>({ high: 0, medium: 0, low: 0 });
  const [latestScoredEvent, setLatestScoredEvent] = useState<ScoreEventResponse | null>(null);

  const processingRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load the 1,000-event benchmark stream at startup
  useEffect(() => {
    async function loadStream() {
      const res = await api.getStreamEvents(1000);
      if (res?.events && res.events.length > 0) {
        setStreamEvents(res.events);
        setIsLoaded(true);
      }
    }
    loadStream();
  }, []);

  // Process a single event from the stream
  const processNextEvent = useCallback(async () => {
    if (processingRef.current) return;
    if (currentIndex >= streamEvents.length || streamEvents.length === 0) {
      setIsPlaying(false);
      return;
    }

    processingRef.current = true;
    const event = streamEvents[currentIndex];

    try {
      // Execute live model inference on this synthetic event
      const scoreRes = await api.scoreEvent(event.event_id);
      if (scoreRes) {
        setLatestScoredEvent(scoreRes);

        // 1. Update unique entities
        setUniqueEntities((prev) => {
          const next = new Set(prev);
          if (event.source_wallet) next.add(event.source_wallet);
          if (event.target_wallet) next.add(event.target_wallet);
          return next;
        });

        // 2. If alert (risk >= 65), record into ranked queue
        if (scoreRes.is_alert) {
          const alertItem: ApiAlertListItem = {
            alert_id: `alt_${String(detectedAlerts.length + 1).padStart(5, '0')}_${event.event_id}`,
            event_id: event.event_id,
            observed_at: event.observed_at,
            source_wallet: event.source_wallet,
            target_wallet: event.target_wallet,
            risk_score: scoreRes.risk_score,
            ml_probability: scoreRes.ml_probability,
            novelty_score: scoreRes.novelty_score,
            graph_risk_score: scoreRes.graph_risk_score,
            baseline_score: 50,
            priority_band: scoreRes.risk_score >= 75 ? 'REVIEW_PRIORITY' : 'LOW_PRIORITY',
            review_state: 'UNREVIEWED',
            top_reason:
              scoreRes.graph_risk_score > 0.4
                ? 'Anomalous graph connectivity and high novelty burst'
                : 'Suspicious transaction pattern matching anomaly profile',
            synthetic_notice: 'Synthetic evidence only · Human review required',
          };

          setDetectedAlerts((prev) => {
            const updated = [alertItem, ...prev.filter((a) => a.event_id !== event.event_id)];
            // Keep ranked by highest risk score descending
            return updated.sort((a, b) => b.risk_score - a.risk_score);
          });
        }

        // 3. Update Risk Breakdown
        setRiskDistribution((prev) => {
          if (scoreRes.risk_score >= 75) return { ...prev, high: prev.high + 1 };
          if (scoreRes.risk_score >= 50) return { ...prev, medium: prev.medium + 1 };
          return { ...prev, low: prev.low + 1 };
        });

        // 4. Update Activity Timeline mapped to realistic event timestamp hour
        const eventHour = parseInt(event.observed_at.slice(11, 13) || '12', 10);
        const bucketIndex = Math.min(
          FIXED_TIMELINE_BUCKETS.length - 1,
          Math.max(0, Math.floor(eventHour / 4))
        );

        setActivityTimeline((prev) =>
          prev.map((bucket, idx) => {
            if (idx === bucketIndex) {
              return {
                ...bucket,
                transactions: bucket.transactions + 1,
                alerts: bucket.alerts + (scoreRes.is_alert ? 1 : 0),
              };
            }
            return bucket;
          })
        );
      }
    } catch (err) {
      console.warn('Stream processing error:', err);
    } finally {
      setCurrentIndex((prev) => prev + 1);
      processingRef.current = false;
    }
  }, [currentIndex, streamEvents, detectedAlerts.length]);

  // Streaming ticker
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPlaying || !isLoaded || currentIndex >= streamEvents.length) return;

    const intervalMs = Math.max(25, Math.round(300 / speed));
    timerRef.current = setInterval(() => {
      processNextEvent();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isLoaded, currentIndex, streamEvents.length, speed, processNextEvent]);

  // Controls
  const startStream = useCallback(() => setIsPlaying(true), []);
  const pauseStream = useCallback(() => setIsPlaying(false), []);
  const toggleStream = useCallback(() => setIsPlaying((p) => !p), []);

  const resetStream = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setUniqueEntities(new Set());
    setDetectedAlerts([]);
    setActivityTimeline(FIXED_TIMELINE_BUCKETS.map((b) => ({ ...b, transactions: 0, alerts: 0 })));
    setRiskDistribution({ high: 0, medium: 0, low: 0 });
    setLatestScoredEvent(null);
    setTimeout(() => setIsPlaying(true), 200);
  }, []);

  const stepStream = useCallback(async () => {
    setIsPlaying(false);
    await processNextEvent();
  }, [processNextEvent]);

  const scoreSpecificEvent = useCallback(async (eventId: string) => {
    const res = await api.scoreEvent(eventId);
    if (res) {
      setLatestScoredEvent(res);
    }
    return res;
  }, []);

  const totalEvents = streamEvents.length || 1000;
  const processedCount = currentIndex;
  const uniqueEntitiesCount = uniqueEntities.size;
  const highRiskAlertsCount = detectedAlerts.length;
  const evidenceRecordsCount = detectedAlerts.length * 5;

  return (
    <StreamContext.Provider
      value={{
        streamEvents,
        currentIndex,
        totalEvents,
        isLoaded,
        processedCount,
        uniqueEntitiesCount,
        highRiskAlertsCount,
        evidenceRecordsCount,
        detectedAlerts,
        activityTimeline,
        riskDistribution,
        latestScoredEvent,
        isPlaying,
        isDone: isLoaded && currentIndex >= totalEvents,
        speed,
        startStream,
        pauseStream,
        toggleStream,
        resetStream,
        stepStream,
        setSpeed,
        scoreSpecificEvent,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
}

export function useStream() {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
}
