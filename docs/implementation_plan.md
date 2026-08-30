# Hybrid Streaming & On-Demand Inference Architecture

## Goal Description
The frontend currently simulates a live stream of 1,000 synthetic transactions by requesting raw events and scoring them dynamically. However, because these dynamically generated alerts do not exist in the backend database, clicking them results in missing graphs and missing TreeSHAP evidence.

The goal is to implement a **Hybrid Architecture**:
1. Keep the live streaming dashboard animation.
2. When clicking an alert, attempt to load pre-calculated data.
3. If pre-calculated data does not exist, trigger an **On-Demand Live Inference** request to the backend to compute the TreeSHAP evidence and reasoning graph dynamically on the spot.

## User Review Required
> [!IMPORTANT]
> **Backend Capability Check:** To support this, the backend must be able to generate TreeSHAP evidence and Graphs *on the fly*. 
> - We know the Graph can be generated on the fly via `GET /api/v1/graph/entities/:entityId` (which performs a BFS on `features.parquet`).
> - However, we need to verify if the backend ML model endpoint (`/api/v1/stream/score`) currently returns TreeSHAP evidence, or if we need to build a new backend endpoint (e.g., `POST /api/v1/evidence/compute`) to run the explainer live.

## Open Questions
> [!WARNING]
> 1. **TreeSHAP Live Computation:** Does the backend ML pipeline currently support running the SHAP explainer live for a single transaction, or do we need to implement that Python logic first?
> 2. **Database Persistence:** When we compute this data on the fly, do you want to save the newly generated alert into the backend database (so it becomes permanent), or just keep it in memory for that session?

## Proposed Changes

### Frontend
#### [MODIFY] `apps/web/src/app/investigation/[id]/page.tsx`
- Refactor the data fetching logic to fully support the hybrid approach.
- Step 1: `api.getAlertDetail(alertId)` (Try pre-calculated).
- Step 2: If 404, check `StreamContext.detectedAlerts` for the event.
- Step 3: If found, trigger the new On-Demand Inference flow to construct the graph and fetch/compute TreeSHAP evidence.

### Backend (If Required)
#### [NEW / MODIFY] Backend API Endpoints
- Ensure that the model API can return feature contributions (TreeSHAP) on the fly for any `event_id`, rather than just reading from the pre-calculated `evidence.json`.

## Verification Plan
### Manual Verification
1. Run the live stream on the dashboard.
2. Wait for a high-risk alert to be generated dynamically.
3. Click the dynamic alert.
4. Verify that the investigation page successfully loads a unique graph and TreeSHAP evidence generated on the fly, instead of failing or showing dummy data.
