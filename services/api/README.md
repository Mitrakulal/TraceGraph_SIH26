# TraceGraph AI API Service

This directory is the **only** home for the backend HTTP API. Use FastAPI and serve the versioned endpoints defined in [`../../docs/TEAM_FRONTEND_BACKEND_HANDOFF.md`](../../docs/TEAM_FRONTEND_BACKEND_HANDOFF.md).

## API Boundary

The API may read approved outputs from `../ml/artifacts/runs/sih26146-cpu-demo-2026-v1/` and safe data from `../../packages/fixtures/`. It must never return true labels, scenario truth, model binaries, local file paths, or real-world data. It does not train models.

## Required First Structure

```text
services/api/
├── requirements.txt
├── app/
│   ├── main.py
│   ├── api/
│   ├── core/
│   ├── schemas/
│   ├── services/
│   └── storage/
└── tests/
```

Read [`../../docs/CANONICAL_PROJECT_STRUCTURE.md`](../../docs/CANONICAL_PROJECT_STRUCTURE.md) before adding code.
