# TraceGraph AI — Frontend & Backend Team Handoff

> **Purpose.** This is the working agreement for a six-person TraceGraph AI team: three frontend members and three backend members. It defines exactly what the backend team provides, exactly what the frontend team builds, and the JSON contract between both sides. Treat this file as the single source of truth. If a requested field, endpoint, state, or screen is not written here, do not invent it—add it to this document and agree on it first.

---

## 1. The Simple Product Definition

TraceGraph AI is an **offline, synthetic-only investigation dashboard**. It takes an approved synthetic Bitcoin/IP metadata batch, derives contextual behaviour features, uses the already-trained CPU model to rank synthetic patterns for review, and shows the reviewer **what increased the score**.

The frontend does **not** train a model and does **not** decide whether an entity is guilty. It displays a review workflow. The backend does **not** decide colors, layout, typography, spacing, or interaction style. It supplies stable, safe JSON and validates every request.

| Team boundary | Frontend owns | Backend owns |
|---|---|---|
| Main purpose | Make the investigation story understandable in seconds. | Make all data, scoring, evidence, and reviewer state correct and reproducible. |
| UX/design | Visual identity, layouts, components, responsive states, loading/error/empty states, graph interaction design. | API schemas, validation, model loading, score calculation, evidence generation, persistence, audit trail. |
| Data | Render only approved API fields and local UI state. | Generate/read synthetic records; hide truth labels; stream or return contract-safe data. |
| Model | Never load `.joblib` or `.json` model files in the browser. | Load scaler, Isolation Forest, and XGBoost model files server-side only. |
| Decisions | Design decisions are frontend-owned. | Risk, threshold, feature, model, and data-boundary decisions are backend-owned. |

---

## 2. Current Truth: What Is Already Built vs What We Build Next

The trained-model repository already contains a deterministic synthetic fixture, a CPU-trained Isolation Forest, XGBoost model, feature schema, test metrics, a 250-item alert queue, and 1,250 evidence records. The existing model is a **batch pipeline**, not yet an end-user API or a web dashboard.[^model-spec]

| Area | Current status | Owner for next step |
|---|---|---|
| Synthetic fixture | **Ready.** 60,000 events, 2,000 synthetic labels, seed 2026. | Backend owns regeneration and validation. |
| Trained artifacts | **Ready.** Scaler, Isolation Forest, XGBoost, threshold table, metrics, alerts, and evidence. | Backend owns loading and version checks. |
| Browser prediction flow | **Not built.** `predict.py` contract exists but is not implemented. | Backend builds; frontend must not fake a live prediction. |
| HTTP API | **Not built.** This document fixes the API contract to implement. | Backend builds. |
| Dashboard UI | **Not built.** | Frontend owns design and implementation. |
| Reviewer decisions | **Not built.** | Backend persists decisions; frontend provides controls. |

[^model-spec]: See [`SIH26146TraceGraphAI_model.md`](./SIH26146TraceGraphAI_model.md) for the trained model’s exact 18-feature contract, artifacts, thresholds, metrics, and limitations.

---

## 3. Team Roles and No-Overlap Rules

Assign actual names next to each role before implementation starts. One person may assist another, but the **owner** approves changes in that area.

| Role | Team | Owns | Must not change alone |
|---|---|---|---|
| **F1 — UX/UI lead** | Frontend | Design system, app shell, screen layouts, visual hierarchy, empty/loading/error states, mobile breakpoints. | API field names, model scores, business rules. |
| **F2 — Dashboard implementer** | Frontend | Overview, alerts, run/model screens, API client integration, reusable UI components. | Risk formula, review-state values, API semantics. |
| **F3 — Visual analytics implementer** | Frontend | Graph explorer UI, evidence visualizations, filters, scenario/demo controls, accessibility. | Graph calculations, evidence content, hidden labels. |
| **B1 — Backend/API lead** | Backend | API service, request validation, response schemas, auth/session policy, review persistence, contract release notes. | UI layout and styling decisions. |
| **B2 — ML/pipeline owner** | Backend | Feature pipeline, model loading, batch prediction, model version checks, alerts/evidence generation, metrics. | Browser-side model access or UI-specific hard-coded scoring. |
| **B3 — Data/integration owner** | Backend | Synthetic dataset validation, scenario catalog, graph payload preparation, SQLite schema, tests, demo fixtures. | UI component styling and navigation. |

### Non-Negotiable Rules

1. The frontend never receives `is_anomalous`, `scenario_id`, `severity_truth`, or any hidden ground-truth field. Those exist only for evaluator/training use.
2. The frontend never recalculates risk, threshold, novelty, graph risk, or TreeSHAP values. It renders backend values exactly.
3. The backend never sends a real wallet ID, real IP, real transaction ID, or real-world attribution. Every dataset response must be synthetic-only.
4. The API contract is versioned. A backend field rename requires a pull request changing the contract, frontend types, mock responses, and tests in the same release.
5. No browser request may trigger a full retraining run. Training is an explicit offline developer command only.

---

## 4. Frontend Scope: What the Design Team Builds

The frontend’s job is to make the investigation workflow visible. Design is entirely frontend-owned, but each screen must use the backend states and fields below.

### 4.1 Required Screen List

| Route | Screen name | What the frontend must make visible | Backend data source |
|---|---|---|---|
| `/` | **Investigation Overview** | Current synthetic run, total events, queue size, high-priority count, scenario selector, offline/synthetic banner. | `GET /api/v1/dashboard/summary` |
| `/alerts` | **Alert Queue** | Sortable/filterable review queue with score, priority, alert state, top reason, source wallet, time, and scenario-safe tag. | `GET /api/v1/alerts` |
| `/alerts/:alertId` | **Alert Evidence** | Score explanation, five evidence items, rule hits, behaviour timeline, linked entities, reviewer controls, persistent synthetic warning. | `GET /api/v1/alerts/:alertId` |
| `/graph/:entityId` | **Graph Explorer** | Directed wallet/IP/transaction relationship view with node types, selected-entity panel, and graph summary. | `GET /api/v1/graph/entities/:entityId` |
| `/demo` | **Demo Scenario Control** | Buttons for approved scenarios, selected scenario state, “load demo data” action, predictable progress/status. | `GET /api/v1/demo/scenarios`, `POST /api/v1/demo/activate` |
| `/model` | **Model & Run Evidence** | Current run ID, model version, fixed synthetic-only note, metrics, threshold, artifact status. | `GET /api/v1/model/current` |

### 4.2 Required Global UI States

Every screen must implement all five states. Do not leave blank content areas.

| State | Required frontend behaviour | Exact message style |
|---|---|---|
| Loading | Skeletons or neutral placeholders; do not show fake values. | “Loading synthetic run data…” |
| Empty | Explain why the list is empty and give one next action. | “No synthetic alerts match these filters.” |
| API error | Show a readable error and retry action; do not display raw stack traces. | “We could not load the synthetic review queue. Try again.” |
| Offline | Display a non-blocking status label; the app should still work against the local API. | “Offline demo mode” |
| Synthetic boundary | Permanent visible badge in app header and alert detail page. | “Synthetic evidence only · Human review required” |

### 4.3 Frontend Visual Requirements

The design team decides the aesthetics, but the following data meanings must remain consistent:

| Meaning | Required visual meaning | Do not use it for |
|---|---|---|
| `risk_score >= 65` | Review-priority/anomaly color, typically orange or red. | “Criminal,” “fraud confirmed,” or identity claims. |
| `risk_score < 65` | Neutral/low-priority color, typically green or slate. | “Safe” or “verified legitimate.” |
| Evidence item `direction = INCREASED_RISK` | Upward/risk-increasing treatment. | A moral or legal verdict. |
| Evidence item `direction = DECREASED_RISK` | Downward/risk-reducing treatment. | Proof that the record is harmless. |
| Reviewer state | Separate text/icon treatment from ML score. | Overwriting or changing the backend score. |

### 4.4 Frontend Does Not Build These

The frontend team must not build a fake model simulation, train models in the browser, fabricate alert scores, create fake model evidence, expose evaluator labels, or call an external blockchain API. During early UI work, use the **backend-provided mock JSON** under `docs/contracts/mock/`, not manually invented values.

---

## 5. Backend Scope: What We Provide to Frontend

The backend will expose only contract-safe, synthetic-only JSON. The frontend receives values ready to render.

### 5.1 Backend Deliverables

| Deliverable | Backend responsibility | Frontend dependency |
|---|---|---|
| Synthetic data validator | Rejects any input without a valid synthetic-only manifest or an allowed benchmark-range IP. | Show returned error; do not bypass it. |
| Demo scenario loader | Activates an approved precomputed synthetic scenario and returns a session/run snapshot. | Demo page, overview refresh, scenario selection. |
| Alert service | Reads/creates ranked alert records; never includes hidden truth fields. | Alert queue and alert detail. |
| Evidence service | Returns the five stored evidence entries per alert. | Evidence bars/chips and explanation text. |
| Graph payload builder | Produces only visible synthetic nodes and edges around selected entity. | Graph Explorer. |
| Model run service | Exposes current metrics, threshold, run ID, and artifact readiness. | Model & Run Evidence screen. |
| Reviewer decision service | Validates and stores review decision, comment, timestamp, and actor ID. | Review, dismiss, escalate controls. |

### 5.2 What the Backend Streams or Sends

For the first demo version, use normal request/response JSON. **Do not build WebSockets or real-time streaming first.** The system is an offline, deterministic demo; a stable snapshot is more valuable than fake live movement.

| UI need | Backend delivery method | Frontend behaviour |
|---|---|---|
| App startup status | `GET /status` response | Fetch once at app load. |
| Overview values | Snapshot response | Refresh after scenario activation or manual reload. |
| Alert list | Paginated snapshot response | Fetch on route/filter change. |
| Alert evidence | Detail snapshot response | Fetch on opening one alert. |
| Demo activation progress | `POST /demo/activate` immediate status then short polling of `GET /runs/:runId` | Poll only while status is `PREPARING` or `READYING`. |
| Reviewer update | Mutation response includes updated alert | Update local UI from returned object. |

**Optional later upgrade:** Add Server-Sent Events only after every REST endpoint below is tested. The event names must be `run.status_changed`, `alert.reviewed`, and `demo.activated`; the payload must be the same JSON object used by the matching REST endpoint.

---

## 6. Frozen API Contract — Version 1

All endpoints use `/api/v1`. All successful responses use `{ "data": ... }`. All errors use the shared error structure in Section 6.8. Timestamps are ISO-8601 UTC strings. IDs are opaque strings; never parse semantic information from an ID.

### 6.1 `GET /api/v1/status`

**Purpose:** Lets the app verify that it is connected to the local offline backend.

```json
{
  "data": {
    "service": "tracegraph-api",
    "mode": "OFFLINE_SYNTHETIC_ONLY",
    "current_run_id": "sih26146-cpu-demo-2026-v1",
    "model_ready": true,
    "api_version": "v1",
    "timestamp": "2026-08-27T10:00:00Z"
  }
}
```

### 6.2 `GET /api/v1/dashboard/summary`

**Purpose:** Drives the Overview screen. This is the first endpoint frontend integrates.

```json
{
  "data": {
    "run_id": "sih26146-cpu-demo-2026-v1",
    "data_classification": "SYNTHETIC_ONLY",
    "total_events": 60000,
    "total_alerts": 250,
    "review_priority_count": 250,
    "evidence_record_count": 1250,
    "risk_threshold": 65,
    "scenario_count": 8,
    "last_generated_at": "2026-08-27T10:00:00Z"
  }
}
```

### 6.3 `GET /api/v1/demo/scenarios`

**Purpose:** Drives scenario buttons. The frontend displays the labels and descriptions exactly as returned.

```json
{
  "data": [
    {
      "scenario_key": "normal",
      "display_name": "Normal synthetic pattern",
      "description": "Stable timing, limited destinations, and low IP rotation.",
      "expected_review_band": "LOW_PRIORITY",
      "available": true
    },
    {
      "scenario_key": "rapid_hop",
      "display_name": "Rapid hop pattern",
      "description": "Rapid consecutive transfers through several synthetic wallets.",
      "expected_review_band": "REVIEW_PRIORITY",
      "available": true
    }
  ]
}
```

The eight valid `scenario_key` values are `normal`, `structuring`, `peel_chain`, `rapid_hop`, `fan_out`, `fan_in`, `ip_rotation`, and `source_port_shift`. The API may expose only the subset ready for the demo, but it must never accept an unlisted key.

### 6.4 `POST /api/v1/demo/activate`

**Purpose:** Activates a safe, precomputed synthetic demo session. This endpoint does not retrain models.

**Request:**

```json
{
  "scenario_key": "rapid_hop"
}
```

**Response:**

```json
{
  "data": {
    "demo_session_id": "demo_01J...",
    "scenario_key": "rapid_hop",
    "run_id": "sih26146-cpu-demo-2026-v1",
    "status": "READY",
    "featured_alert_id": "alt_01J...",
    "message": "Synthetic scenario is ready for review."
  }
}
```

### 6.5 `GET /api/v1/alerts`

**Query parameters:** `page` (default `1`), `page_size` (default `25`, maximum `100`), `min_risk` (`0`–`100`), `review_state` (`UNREVIEWED`, `REVIEWED`, `DISMISSED`, `ESCALATED`), `scenario_key` (one allowed key), and `sort` (`RISK_DESC`, `TIME_DESC`).

**Response:**

```json
{
  "data": {
    "items": [
      {
        "alert_id": "alt_01J...",
        "event_id": "syn_evt_004201",
        "observed_at": "2026-07-06T11:40:00Z",
        "source_wallet": "syn_w_0042",
        "target_wallet": "syn_w_0197",
        "risk_score": 88,
        "ml_probability": 0.91,
        "novelty_score": 0.77,
        "graph_risk_score": 0.64,
        "baseline_score": 65,
        "priority_band": "REVIEW_PRIORITY",
        "review_state": "UNREVIEWED",
        "top_reason": "Synthetic IP rotation increased the model risk score.",
        "synthetic_notice": "Synthetic evidence only. Human review required."
      }
    ],
    "page": 1,
    "page_size": 25,
    "total": 250
  }
}
```

### 6.6 `GET /api/v1/alerts/:alertId`

**Purpose:** Drives the Evidence page. This response contains all visible data needed by the page; the frontend should not issue a second call for the same alert’s evidence.

```json
{
  "data": {
    "alert": {
      "alert_id": "alt_01J...",
      "event_id": "syn_evt_004201",
      "observed_at": "2026-07-06T11:40:00Z",
      "source_wallet": "syn_w_0042",
      "target_wallet": "syn_w_0197",
      "risk_score": 88,
      "ml_probability": 0.91,
      "novelty_score": 0.77,
      "graph_risk_score": 0.64,
      "baseline_score": 65,
      "priority_band": "REVIEW_PRIORITY",
      "review_state": "UNREVIEWED",
      "synthetic_notice": "Synthetic evidence only. Human review required."
    },
    "rule_hits": ["HIGH_IP_ROTATION", "RAPID_RELATION_ACTIVITY"],
    "evidence": [
      {
        "evidence_id": "evd_01J...",
        "feature": "ip_rotation_rate",
        "feature_value": 0.82,
        "shap_value": 1.42,
        "direction": "INCREASED_RISK",
        "message": "Synthetic feature ip_rotation_rate increased the model risk score."
      }
    ],
    "linked_entity_ids": ["syn_w_0042", "syn_w_0197", "syn_ip_010"],
    "review_history": []
  }
}
```

### 6.7 `GET /api/v1/graph/entities/:entityId`

**Purpose:** Drives the Graph Explorer. The frontend renders the graph but does not calculate it.

**Query parameters:** `depth` (`1` or `2`, default `1`), `limit` (maximum `120`, default `60`).

```json
{
  "data": {
    "focus_entity_id": "syn_w_0042",
    "nodes": [
      { "id": "syn_w_0042", "label": "Wallet 0042", "type": "WALLET", "risk_score": 88, "is_focus": true },
      { "id": "syn_ip_010", "label": "Synthetic IP 010", "type": "IP", "risk_score": null, "is_focus": false }
    ],
    "edges": [
      { "id": "edge_01J...", "source": "syn_w_0042", "target": "syn_ip_010", "type": "OBSERVED_FROM", "observed_at": "2026-07-06T11:40:00Z" }
    ],
    "summary": { "node_count": 18, "edge_count": 24, "truncated": false },
    "synthetic_notice": "Synthetic relationship graph only. Human review required."
  }
}
```

### 6.8 `GET /api/v1/model/current`

**Purpose:** Drives the Model & Run Evidence page; it makes the prototype auditable without leaking hidden labels.

```json
{
  "data": {
    "run_id": "sih26146-cpu-demo-2026-v1",
    "dataset_version": "sih26146-synthetic-60000-v2",
    "data_classification": "SYNTHETIC_ONLY",
    "models": ["IsolationForest", "XGBoost"],
    "feature_count": 18,
    "risk_threshold": 65,
    "metrics": {
      "test_pr_auc": 0.999962,
      "test_f1": 0.991150,
      "test_false_positives_per_1000": 0.420875
    },
    "artifact_status": "READY",
    "limitation": "Held-out controlled synthetic benchmark only; not a real-world accuracy claim."
  }
}
```

### 6.9 `POST /api/v1/alerts/:alertId/reviews`

**Purpose:** Stores a human reviewer action. The backend rejects any review of an unknown alert or unknown state.

**Request:**

```json
{
  "decision": "REVIEWED",
  "note": "Synthetic rapid-hop pattern reviewed during judge demonstration."
}
```

Valid `decision` values are `REVIEWED`, `DISMISSED`, and `ESCALATED`. A note is optional, maximum 500 characters, and plain text only.

**Response:**

```json
{
  "data": {
    "alert_id": "alt_01J...",
    "review_state": "REVIEWED",
    "latest_review": {
      "review_id": "rev_01J...",
      "decision": "REVIEWED",
      "note": "Synthetic rapid-hop pattern reviewed during judge demonstration.",
      "reviewed_at": "2026-08-27T10:20:00Z"
    }
  }
}
```

### 6.10 Shared Error Response

```json
{
  "error": {
    "code": "SYNTHETIC_MANIFEST_INVALID",
    "message": "The input manifest is missing the required SYNTHETIC_ONLY classification.",
    "request_id": "req_01J..."
  }
}
```

The frontend maps `400`, `404`, `409`, `422`, and `500` to readable UI states. It never shows `request_id` to a judge unless the team is debugging.

---

## 7. Data Contract: Exactly What Goes to Frontend

### 7.1 Allowed Fields

| Data type | Backend may send | Frontend may display |
|---|---|---|
| Synthetic IDs | `syn_evt_*`, `syn_w_*`, `syn_tx_*`, `syn_ip_*`, `alt_*`, `evd_*`, `rev_*` | Yes, labelled as synthetic. |
| Scores | `risk_score`, `ml_probability`, `novelty_score`, `graph_risk_score`, `baseline_score` | Yes, exactly as returned. |
| Explanation | `rule_hits`, evidence fields, safe evidence message | Yes. |
| Graph data | Visible node/edge contract in Section 6.7 | Yes. |
| Metrics | Test metrics and limitation string | Yes, always with synthetic benchmark note. |
| Reviewer state | `UNREVIEWED`, `REVIEWED`, `DISMISSED`, `ESCALATED` | Yes. |

### 7.2 Forbidden Fields

| Never send to frontend | Why |
|---|---|
| `is_anomalous`, `severity_truth`, `scenario_truth`, raw training labels | These leak evaluator ground truth and make the demo dishonest. |
| Any real-world wallet, real IP, name, identity, geolocation, or customer data | Out of scope and violates the synthetic-only project boundary. |
| Model objects, scaler object, feature schema hash used for model loading, training arrays | Browser must not load or manipulate trained model internals. |
| Stack traces, environment variables, local disk paths, credentials | Security risk and unnecessary for the UI. |

---

## 8. Recommended Build Sequence

The frontend can begin immediately with contract-accurate mock JSON. It must not wait for the full backend implementation.

| Day / phase | Frontend team | Backend team | Integration gate |
|---|---|---|---|
| **Phase 0 — Contract lock** | Create TypeScript interfaces from Section 6; create mock JSON matching examples exactly; complete Figma/UI flow. | Create Pydantic/JSON schemas; validate fixture/artifact locations; write endpoint stubs returning the exact mock payloads. | Mock response and backend stub are byte-for-byte schema compatible. |
| **Phase 1 — Demo shell** | Build app shell, Overview, Demo Scenario Control, Alert Queue shell, global synthetic banner. | Implement `/status`, `/dashboard/summary`, `/demo/scenarios`, `/demo/activate`, `/alerts`. | Frontend replaces mock data with live local API; no component field changes. |
| **Phase 2 — Explainability** | Build Alert Evidence and Graph Explorer screens; show all loading/error/empty states. | Implement `/alerts/:alertId`, `/graph/entities/:entityId`, safe graph windowing, reviewer SQLite table. | Open the featured rapid-hop alert and display five evidence rows + graph. |
| **Phase 3 — Audit + polish** | Build Model & Run screen; reviewer controls; responsive demo polish; keyboard accessibility. | Implement `/model/current`, review mutation, audit/history response, input validation, test suite. | Review an alert; refresh page; decision state persists. |
| **Phase 4 — Judge rehearsal** | Run 6–8 minute visual story with no dev tools visible. | Verify offline start, run ID, artifacts, scripted endpoint responses, and fallback fixture. | Complete normal-versus-rapid-hop demo twice without manual data fixes. |

---

## 9. Frontend Integration Checklist

The frontend team marks every item complete before calling their work “integrated.”

- [ ] Implement a central typed API client. Do not place raw `fetch` calls inside visual components.
- [ ] Use exactly the route names in Section 4.1.
- [ ] Display the persistent text: **“Synthetic evidence only · Human review required.”**
- [ ] Render the `risk_score` as received; do not round, recolor, or recalculate server values differently in different screens.
- [ ] Render every alert detail’s five evidence records in the order returned by backend.
- [ ] Handle all five global UI states in Section 4.2.
- [ ] Do not expose hidden truth fields in UI, browser storage, mock files, screenshots, or console logs.
- [ ] Verify normal and rapid-hop scenarios use the exact `scenario_key` API values.
- [ ] Add a screenshot or component test for Alert Queue, Alert Evidence, and Graph Explorer.

## 10. Backend Integration Checklist

- [ ] Add request/response schema tests for every endpoint in Section 6.
- [ ] Validate `SYNTHETIC_ONLY` manifest and reject IP addresses outside `198.18.0.0/15` before any prediction action.
- [ ] Never retrain during a browser request.
- [ ] Load committed model artifacts server-side; verify run ID and feature schema before scoring a new batch.
- [ ] Return only contract-safe fields; confirm forbidden fields never appear in serialized JSON.
- [ ] Write deterministic fixture tests for `normal` and `rapid_hop` scenario selection.
- [ ] Persist reviewer decisions with UTC timestamp and a non-sensitive actor identifier.
- [ ] Return stable errors in the shared error format; do not leak stack traces.
- [ ] Test the complete demo flow offline, with networking disabled after the local service starts.

---

## 11. Definition of Done for the First Demo

The feature is done only when every statement below is true.

| Area | Acceptance criterion |
|---|---|
| Offline boundary | The UI, API, trained artifacts, and synthetic fixture run locally with no internet request. |
| Safety boundary | Every screen visibly says synthetic-only; no real ID, IP, wallet, or hidden truth label is exposed. |
| Normal demonstration | Selecting `normal` produces a low-priority, explainable synthetic example. |
| Anomaly demonstration | Selecting `rapid_hop` opens a high-priority synthetic alert with five evidence items and graph context. |
| Review control | A reviewer decision persists and is separated from the model risk score. |
| Data consistency | Overview count, Alert Queue count, Alert Detail score, Graph Explorer focus entity, and Model screen run ID all refer to the same run. |
| Failure handling | If the API stops, frontend shows the readable error state and does not invent numbers. |
| Judge understanding | In 30 seconds, a judge can explain: “It uses synthetic behaviour and relationships to prioritize what a human should review, then shows why.” |

---

## 12. Daily Collaboration Rule

At the start of each work session, the backend lead posts the current run ID and API availability. The frontend lead posts which routes are using mock data versus local API data. If a frontend block is caused by missing backend data, add the missing field or endpoint to this document; do not silently create a different local interface.

> **The operating principle:** Frontend makes the investigation understandable. Backend makes the investigation truthful, reproducible, and safe. Both teams meet at a contract—not at assumptions.
