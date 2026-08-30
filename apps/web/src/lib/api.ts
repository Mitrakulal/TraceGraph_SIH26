/**
 * Central API Client connecting Next.js Frontend (apps/web)
 * to FastAPI Backend (http://127.0.0.1:8000/api/v1).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      console.warn(`[API] ${endpoint} returned HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    return (json.data ?? json) as T;
  } catch (err) {
    console.warn(`[API] Offline or unreachable endpoint '${endpoint}':`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface ServerStatus {
  service: string;
  mode: string;
  current_run_id: string;
  model_ready: boolean;
  api_version: string;
  timestamp: string;
}

export interface DashboardSummary {
  run_id: string;
  data_classification: string;
  total_events: number;
  total_alerts: number;
  review_priority_count: number;
  evidence_record_count: number;
  unique_entities?: number;
  risk_threshold: number;
  scenario_count: number;
  last_generated_at: string;
}

export interface ScenarioItem {
  scenario_key: string;
  display_name: string;
  description: string;
  expected_review_band: 'REVIEW_PRIORITY' | 'LOW_PRIORITY';
  available: boolean;
}

export interface DemoActivateResponse {
  demo_session_id: string;
  scenario_key: string;
  run_id: string;
  status: string;
  featured_alert_id: string | null;
  message: string;
}

export interface ApiAlertListItem {
  alert_id: string;
  event_id: string;
  observed_at: string;
  source_wallet: string;
  target_wallet: string;
  risk_score: number;
  ml_probability: number;
  novelty_score: number;
  graph_risk_score: number;
  baseline_score: number;
  priority_band: 'REVIEW_PRIORITY' | 'LOW_PRIORITY';
  review_state: 'UNREVIEWED' | 'REVIEWED' | 'DISMISSED' | 'ESCALATED';
  top_reason: string;
  synthetic_notice: string;
}

export interface ApiAlertListPayload {
  items: ApiAlertListItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface ApiEvidenceItem {
  evidence_id: string;
  feature: string;
  feature_value: number;
  shap_value: number;
  direction: 'INCREASED_RISK' | 'DECREASED_RISK';
  message: string;
}

export interface ReviewRecord {
  review_id: string;
  decision: 'REVIEWED' | 'DISMISSED' | 'ESCALATED';
  note: string | null;
  reviewed_at: string;
}

export interface ApiAlertDetailPayload {
  alert: {
    alert_id: string;
    event_id: string;
    observed_at: string;
    source_wallet: string;
    target_wallet: string;
    risk_score: number;
    ml_probability: number;
    novelty_score: number;
    graph_risk_score: number;
    baseline_score: number;
    priority_band: 'REVIEW_PRIORITY' | 'LOW_PRIORITY';
    review_state: 'UNREVIEWED' | 'REVIEWED' | 'DISMISSED' | 'ESCALATED';
    synthetic_notice: string;
  };
  rule_hits: string[];
  evidence: ApiEvidenceItem[];
  linked_entity_ids: string[];
  review_history: ReviewRecord[];
}

export interface ApiGraphNode {
  id: string;
  label: string;
  type: 'WALLET' | 'IP';
  risk_score: number | null;
  is_focus: boolean;
}

export interface ApiGraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'SENT_TO' | 'OBSERVED_FROM';
  observed_at: string;
}

export interface ApiGraphPayload {
  focus_entity_id: string;
  nodes: ApiGraphNode[];
  edges: ApiGraphEdge[];
  summary: {
    node_count: number;
    edge_count: number;
    truncated: boolean;
  };
  synthetic_notice: string;
}

export interface ScoreEventResponse {
  event_id: string;
  model_run_id: string;
  inference_time_ms: number;
  features_used: Record<string, number>;
  feature_count: number;
  ml_probability: number;
  novelty_score: number;
  graph_risk_score: number;
  risk_score: number;
  risk_threshold: number;
  is_alert: boolean;
  rule_hits?: string[];
  evidence?: ApiEvidenceItem[];
  data_classification: string;
  limitation: string;
}

export interface SampleEventsResponse {
  background_events: string[];
  alert_events: { alert_id: string; event_id: string }[];
  total_events: number;
  data_classification: string;
}

export interface ApiModelCurrentPayload {
  run_id: string;
  dataset_version: string;
  data_classification: string;
  models: string[];
  feature_count: number;
  risk_threshold: number;
  metrics: {
    test_pr_auc: number;
    test_f1: number;
    test_false_positives_per_1000: number;
  };
  artifact_status: string;
  limitation: string;
}

export interface StreamEventItem {
  event_id: string;
  observed_at: string;
  source_wallet: string;
  target_wallet: string;
  amount_log: number;
  is_scenario_anomaly: boolean;
  scenario_hint?: string | null;
}

export interface StreamPayload {
  run_id: string;
  total_events: number;
  normal_count: number;
  anomaly_count: number;
  ratio_description: string;
  events: StreamEventItem[];
  data_classification: string;
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

export const api = {
  getStatus: () => fetchAPI<ServerStatus>('/status'),
  
  getDashboardSummary: () => fetchAPI<DashboardSummary>('/dashboard/summary'),
  
  getScenarios: () => fetchAPI<ScenarioItem[]>('/demo/scenarios'),
  
  activateScenario: (scenario_key: string) =>
    fetchAPI<DemoActivateResponse>('/demo/activate', {
      method: 'POST',
      body: JSON.stringify({ scenario_key }),
    }),

  getAlerts: (params?: {
    page?: number;
    page_size?: number;
    min_risk?: number;
    review_state?: string;
    scenario_key?: string;
    sort?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));
    if (params?.min_risk !== undefined) searchParams.set('min_risk', String(params.min_risk));
    if (params?.review_state) searchParams.set('review_state', params.review_state);
    if (params?.scenario_key) searchParams.set('scenario_key', params.scenario_key);
    if (params?.sort) searchParams.set('sort', params.sort);
    const query = searchParams.toString();
    return fetchAPI<ApiAlertListPayload>(`/alerts${query ? `?${query}` : ''}`);
  },

  getAlertDetail: (alertId: string) => fetchAPI<ApiAlertDetailPayload>(`/alerts/${alertId}`),

  submitReview: (alertId: string, decision: 'REVIEWED' | 'DISMISSED' | 'ESCALATED', note?: string) =>
    fetchAPI<{ alert_id: string; review_state: string; latest_review: ReviewRecord }>(
      `/alerts/${alertId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify({ decision, note }),
      }
    ),

  dismissAlert: (alertId: string, note?: string) =>
    fetchAPI<{ alert_id: string; review_state: string; latest_review: ReviewRecord }>(
      `/alerts/${alertId}/dismiss`,
      {
        method: 'POST',
        body: JSON.stringify({ note }),
      }
    ),

  escalateAlert: (alertId: string, note?: string) =>
    fetchAPI<{ alert_id: string; review_state: string; latest_review: ReviewRecord }>(
      `/alerts/${alertId}/escalate`,
      {
        method: 'POST',
        body: JSON.stringify({ note }),
      }
    ),

  getEntityGraph: (entityId: string, depth = 1, limit = 60) =>
    fetchAPI<ApiGraphPayload>(`/graph/entities/${entityId}?depth=${depth}&limit=${limit}`),

  getModelCurrent: () => fetchAPI<ApiModelCurrentPayload>('/model/current'),

  scoreEvent: (eventId: string) =>
    fetchAPI<ScoreEventResponse>('/model/score', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId }),
    }),

  getSampleEvents: () => fetchAPI<SampleEventsResponse>('/model/sample-events'),

  getStreamEvents: (limit = 1000) =>
    fetchAPI<StreamPayload>(`/stream/events?limit=${limit}`),
};

