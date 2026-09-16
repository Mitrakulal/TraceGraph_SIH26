# TraceGraph AI — SIH26146

TraceGraph AI is an **offline, CPU-only, synthetic-data-only** investigation prototype. The current repository contains the trained Python ML pipeline and the exact contracts for the upcoming API and frontend application.

> **Safety boundary:** The system accepts and displays synthetic data only. It does not use real wallets, IPs, blockchain traffic, financial data, identity resolution, or enforcement decisions. A score means “synthetic review priority,” not wrongdoing.

## Start Here

| If you are… | Read first | Work only in |
|---|---|---|
| Frontend team member | [`docs/FRONTEND_SPEC.md`](docs/FRONTEND_SPEC.md) and [`docs/TEAM_FRONTEND_BACKEND_HANDOFF.md`](docs/TEAM_FRONTEND_BACKEND_HANDOFF.md) | `apps/web/` |
| Backend API team member | [`docs/TEAM_FRONTEND_BACKEND_HANDOFF.md`](docs/TEAM_FRONTEND_BACKEND_HANDOFF.md) | `services/api/` |
| ML/backend team member | [`docs/SIH26146TraceGraphAI_model.md`](docs/SIH26146TraceGraphAI_model.md) | `services/ml/` |
| Anyone adding a file | [`docs/CANONICAL_PROJECT_STRUCTURE.md`](docs/CANONICAL_PROJECT_STRUCTURE.md) | The owner-approved workspace only |

## Canonical Structure

```text
apps/web/          # Next.js frontend — implemented
services/api/       # FastAPI backend — implemented

services/ml/        # Existing trained Python model, data, scripts, tests, and artifacts
packages/contracts/ # Future versioned API schemas
packages/fixtures/  # Future frontend-safe synthetic mock JSON
docs/               # Specifications, team handoff, and judge presentation materials
```

Do not create a root-level `src/`, `client/`, `server/`, `api/`, `data/`, or `artifacts/` directory. Read the [canonical project structure](docs/CANONICAL_PROJECT_STRUCTURE.md) for the complete ownership and import rules.

## What Is Ready Today

The trained model exists in `services/ml/artifacts/runs/sih26146-cpu-demo-2026-v1/`. It uses an Isolation Forest novelty signal and XGBoost classifier, generates explainable synthetic alerts, and has a deterministic 60,000-event fixture plus test suite.

The backend HTTP API (`services/api`), standalone batch prediction CLI (`services/ml/scripts/predict.py`), SQLite reviewer persistence workflow (`review_store.py`), and frontend fixtures (`packages/fixtures`) are **fully implemented, tested (76/76 tests passing), and ready**. See [`STARTUP.md`](STARTUP.md) or run `.\start_backend.bat` for one-click setup and startup.

```bash
# Quick start backend server
.\start_backend.bat

# Or run API test suite
cd services/api
python3 -m pytest tests/ -v
```

## Authoritative Documents

- [`docs/CANONICAL_PROJECT_STRUCTURE.md`](docs/CANONICAL_PROJECT_STRUCTURE.md) — one conflict-free layout for all teammates.
- [`docs/TRACEGRAPH_AI_EXECUTION_SPEC.md`](docs/TRACEGRAPH_AI_EXECUTION_SPEC.md) — current ML execution contract, artifacts, and future implementation boundaries.
- [`docs/SIH26146TraceGraphAI_model.md`](docs/SIH26146TraceGraphAI_model.md) — exact trained model, features, score, evaluation, and inference contract.
- [`docs/TEAM_FRONTEND_BACKEND_HANDOFF.md`](docs/TEAM_FRONTEND_BACKEND_HANDOFF.md) — ownership and API contracts.
- [`docs/FRONTEND_SPEC.md`](docs/FRONTEND_SPEC.md) — screen, UX, and visual analytics requirements.
- [`docs/judge_presentation/`](docs/judge_presentation/) — editable judge deck source and Q&A guide.
