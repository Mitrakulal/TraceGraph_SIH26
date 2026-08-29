# TraceGraph AI — Backend Setup & Startup Guide

This document provides step-by-step instructions for setting up, testing, and running the **TraceGraph AI** backend API service and ML batch prediction pipeline.

---

## Quick Start (One-Click Launch on Windows)

Simply double-click or execute the root batch file:

```cmd
.\start_backend.bat
```

This automated script will:
1. Verify Python installation.
2. Install/verify all ML and API dependencies.
3. Run the ML batch prediction CLI (`predict.py`) on 60,000 synthetic benchmark events.
4. Launch the FastAPI server at `http://127.0.0.1:8000`.

---

## Step-by-Step Manual Setup

### Prerequisites

- **Python**: Version `3.10` or higher
- **Git**: Installed and configured

---

### Step 1: Clone & Navigate to Repository

```bash
git clone https://github.com/Mitrakulal/TraceGraph_SIH26.git
cd TraceGraph_SIH26
```

---

### Step 2: Install ML Dependencies & Run Batch Prediction

The ML engine scores synthetic transaction batches using pre-trained Isolation Forest and XGBoost model artifacts without retraining or accessing external networks.

```bash
# Navigate to ML service directory
cd services/ml

# Install requirements
pip install xgboost scikit-learn joblib networkx pyarrow pandas numpy pytest

# Run standalone batch prediction CLI
PYTHONPATH=src python3 scripts/predict.py \
  --input data/generated/sih26146-synthetic-60000-v2/events.csv \
  --manifest data/generated/sih26146-synthetic-60000-v2/manifest.json \
  --model-run artifacts/runs/sih26146-cpu-demo-2026-v1 \
  --output artifacts/predictions/demo-predictions.json

# (Optional) Run ML test suite
PYTHONPATH=src python3 -m pytest tests/ -v

# Return to repository root
cd ../..
```

---

### Step 3: Install API Dependencies & Run API Tests

```bash
# Navigate to API service directory
cd services/api

# Install API requirements
pip install fastapi uvicorn[standard] pydantic pyarrow pandas pytest httpx

# Run complete API test suite (62 tests)
python3 -m pytest tests/ -v

# Return to repository root
cd ../..
```

---

### Step 4: Start the Backend API Server

```bash
cd services/api
python3 -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Once running, the API will be accessible at:
- **API Base URL**: `http://127.0.0.1:8000/api/v1`
- **Interactive OpenAPI Docs**: `http://127.0.0.1:8000/docs`
- **Alternative ReDoc UI**: `http://127.0.0.1:8000/redoc`

---

## Testing Key API Endpoints

You can verify server health and query endpoints using `curl` or PowerShell:

### 1. Verify Server Status
```bash
curl http://127.0.0.1:8000/api/v1/status
```

### 2. Get Overview Dashboard Summary
```bash
curl http://127.0.0.1:8000/api/v1/dashboard/summary
```

### 3. Fetch Alert Queue (Paginated)
```bash
curl "http://127.0.0.1:8000/api/v1/alerts?page=1&page_size=10"
```

### 4. Fetch Alert Detail & SHAP Evidence
```bash
curl http://127.0.0.1:8000/api/v1/alerts/alt_00001_syn_evt_004201
```

### 5. Submit Reviewer Action (REVIEWED / DISMISSED / ESCALATED)
```bash
curl -X POST http://127.0.0.1:8000/api/v1/alerts/alt_00001_syn_evt_004201/reviews \
     -H "Content-Type: application/json" \
     -d '{"decision": "ESCALATED", "note": "Elevated fan-out pattern flagged for review."}'
```

### 6. Query Entity Relationship Graph
```bash
curl http://127.0.0.1:8000/api/v1/graph/entities/syn_w_0042
```

### 7. Get Demo Scenario Catalog & Activate
```bash
curl http://127.0.0.1:8000/api/v1/demo/scenarios
curl -X POST http://127.0.0.1:8000/api/v1/demo/activate \
     -H "Content-Type: application/json" \
     -d '{"scenario_key": "rapid_hop"}'
```

### 8. Get Model Metadata & Benchmark Evidence
```bash
curl http://127.0.0.1:8000/api/v1/model/current
```

---

## Directory Reference

| Path | Purpose |
|------|---------|
| `services/api/` | FastAPI service, routers, schemas, services, SQLite review storage |
| `services/ml/` | Trained model artifacts, feature pipeline, batch prediction script (`predict.py`) |
| `packages/fixtures/` | Static frontend-safe JSON fixtures matching V1 API contract |
| `packages/contracts/v1/` | Versioned API schema specifications |
