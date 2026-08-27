# TraceGraph AI — Canonical Project Structure

> **This file is the authoritative repository-layout contract.** It replaces every older ambiguous reference to a root-level `src/`, `data/`, `artifacts/`, or frontend `src/` directory. Do not create a new top-level `src`, `client`, `server`, `api`, `data`, `artifacts`, or `app` folder.

## 1. Canonical Monorepo Tree

```text
TraceGraph_SIH26/
├── README.md
├── .gitignore
├── docs/                                   # Shared product, model, API, and team documentation
│   ├── CANONICAL_PROJECT_STRUCTURE.md       # This file: structure and ownership authority
│   ├── TRACEGRAPH_AI_EXECUTION_SPEC.md      # Current ML execution contract
│   ├── SIH26146TraceGraphAI_model.md        # Current trained-model contract
│   ├── TEAM_FRONTEND_BACKEND_HANDOFF.md     # Frontend/backend API and data contract
│   ├── FRONTEND_SPEC.md                     # Frontend UX and screen specification
│   └── judge_presentation/                  # Judge deck source and talking points
│
├── apps/
│   └── web/                                 # FRONTEND-OWNED Next.js application only
│       ├── README.md
│       ├── public/                          # Static app assets only
│       └── src/
│           ├── app/                         # Next.js routes and page-level layouts
│           ├── components/                  # Presentational and feature components
│           ├── data/                        # Temporary typed UI mock adapters only
│           ├── lib/                         # API client, formatting, UI-only utilities
│           └── types/                       # Re-exported frontend-safe contract types
│
├── services/
│   ├── ml/                                  # ML/BACKEND-ML-OWNED Python workspace only
│   │   ├── README.md
│   │   ├── requirements.txt
│   │   ├── pyproject.toml
│   │   ├── src/tracegraph/                  # Generator, validation, features, train/evaluate code
│   │   ├── scripts/                         # Explicit offline developer commands only
│   │   ├── tests/                           # ML unit and artifact-contract tests
│   │   ├── data/generated/                  # Approved tracked synthetic fixture only
│   │   └── artifacts/runs/                  # Approved tracked demo run only
│   │
│   └── api/                                 # BACKEND-API-OWNED Python FastAPI service only
│       ├── README.md
│       ├── requirements.txt
│       ├── app/
│       │   ├── main.py                      # Future FastAPI app factory and route registration
│       │   ├── api/                         # REST routers only; no model logic
│       │   ├── core/                        # Configuration, logging, safe errors
│       │   ├── schemas/                     # Pydantic request/response schemas from contracts
│       │   ├── services/                    # Read artifacts, serve alerts/evidence/graph data
│       │   └── storage/                     # SQLite reviewer-decision persistence only
│       └── tests/                           # API contract tests only
│
└── packages/
    ├── contracts/
    │   └── v1/                              # Cross-team JSON schemas; no UI and no ML algorithms
    └── fixtures/                            # Frontend-safe JSON subsets generated from ML artifacts
```

## 2. Ownership and Import Rules

| Location | Owner | May contain | Must not contain |
|---|---|---|---|
| `apps/web/` | Frontend team | Next.js UI, React Flow, charts, UI-only formatting, typed API client | Python code, model files, true labels, risk-score calculations, direct CSV reading |
| `services/api/` | Backend API team | FastAPI routes, validation, safe DTOs, artifact readers, SQLite review records | Training code, duplicated feature logic, browser UI code, true labels in responses |
| `services/ml/` | ML/backend team | Synthetic generator, validator, trained models, feature extraction, prediction, evaluation | UI components, REST route definitions, browser state |
| `packages/contracts/v1/` | Backend API lead approves; both teams consume | Versioned request/response schemas and field dictionaries | Business logic, private keys, real data, framework-specific components |
| `packages/fixtures/` | Backend data owner generates; frontend uses | Safe static demo JSON matching API response schema | `labels.csv`, `scenario_id`, hidden truth, model binaries |
| `docs/` | Whole team | Accepted decisions and implementation contracts | Scratch copies of production source code |

## 3. Allowed Dependency Direction

```text
apps/web  ──HTTP/JSON only──>  services/api  ──read/import only──>  services/ml
     │                                  │
     └──── reads typed safe fixtures ───┴──>  packages/contracts/v1 + packages/fixtures
```

The frontend **never** imports Python, loads `.joblib`/`.json` model binaries, reads `events.csv`, or accesses `services/ml/artifacts` directly. The API is the only layer that reads ML output and translates it into frontend-safe JSON. The ML workspace must not import FastAPI or React code.

## 4. Naming Rules That Prevent Conflicts

1. Use `apps/web` for the Next.js application. Do not use `frontend`, `client`, `ui`, or a second root `src` folder.
2. Use `services/api` for the FastAPI application. Do not use `backend`, `server`, `api` at the repository root, or a second API service.
3. Use `services/ml` for every Python model/data/artifact path. Do not write model code in `services/api`.
4. Add new cross-team API fields to `packages/contracts/v1/` **before** implementing them in UI or API.
5. Keep UI-safe mock files in `packages/fixtures/`, never in a page component and never as an untyped duplicate list.
6. Store model run IDs as configuration/data values. Never hard-code a model score or a fake alert in React components.

## 5. Commands From the Correct Directory

| Task | Directory | Command |
|---|---|---|
| Regenerate/train the current model | `services/ml` | `PYTHONPATH=src python3 scripts/train_model.py --regenerate` |
| Test the ML workspace | `services/ml` | `PYTHONPATH=src pytest` |
| Start the future API | `services/api` | `uvicorn app.main:app --reload` |
| Start the future frontend | `apps/web` | `pnpm dev` |

## 6. First Files Each Team Must Create Next

| Team | Create first | Why |
|---|---|---|
| Backend API | `services/api/app/main.py`, `schemas/`, and a contract test for `GET /api/v1/status` | It establishes one stable local API before UI integration. |
| ML/backend | `services/ml/scripts/predict.py` | It loads the existing model and scores a new valid synthetic batch without retraining. |
| Frontend | `apps/web/package.json`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, and `apps/web/src/lib/api.ts` | It creates one clean Next.js app shell and a single API-client entry point. |
| Shared | `packages/contracts/v1/*.json` and `packages/fixtures/*.json` | It stops UI/API teams from inventing incompatible field names. |

---

**One rule to remember:** `apps` displays; `api` serves; `ml` calculates; `packages` agrees; `docs` explains.
