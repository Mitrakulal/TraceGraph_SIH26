# TraceGraph AI Web Application

This directory is the **only** home for the frontend. The frontend team will scaffold a Next.js + TypeScript application here, then implement the screens in `docs/FRONTEND_SPEC.md` using the API contract in `docs/TEAM_FRONTEND_BACKEND_HANDOFF.md`.

## Frontend Boundary

The web app displays only frontend-safe JSON from `services/api` or approved static JSON from `packages/fixtures`. It must not read CSV files, trained model files, evaluator labels, or any `services/ml` path directly.

## Required First Structure

```text
apps/web/
├── package.json
├── public/
└── src/
    ├── app/
    ├── components/
    ├── data/
    ├── lib/
    └── types/
```

Read [`../../docs/CANONICAL_PROJECT_STRUCTURE.md`](../../docs/CANONICAL_PROJECT_STRUCTURE.md) before scaffolding or adding files.
