# TraceGraph AI (SIH26146) — Main-Round Upgrade Spec (Agent-Readable)

> Repo: `C:\Users\kulal\TraceGraph_SIH26` / GitHub: `Mitrakulal/TraceGraph_SIH26`
> PS: SIH26146 — AI-Powered Monitoring & Analysis of Bitcoin Transaction Traffic (NTRO, Software, Offline Linux, Synthetic-only)
> Goal: remove tutorial feel, pass NTRO main screening. No real blockchain/wallet/IP data. Score = review priority, not guilt.
> Method: concept → code in chat. Agent implements; owner applies manually. Do NOT auto-commit.

## 1. Current state (verified from repo)

- ML: `services/ml/src/tracegraph/pipeline.py` — RobustScaler + IsolationForest (300 trees, max_samples 256, contamination 0.08) + XGBoost (400 est, depth 5, lr 0.05) + 6-rule baseline. 18 time-safe features. Risk = 0.75*ml_prob + 0.15*novelty + 0.10*graph. Threshold 0.50, queue >=65, top-250 alerts.
- Fixture: `services/ml/data/generated/sih26146-synthetic-60000-v2/` — 60,000 events / 2,000 labels / 8 scenarios, seed 2026, IPs in 198.18.0.0/15.
- Artifacts: `services/ml/artifacts/runs/sih26146-cpu-demo-2026-v1/` — scaler, IF (~3.9MB), xgb json, feature_schema, alerts.json (250), evidence.json (1250 = 5/alert), metrics, threshold_table, graph_summary (11,999 nodes / 58,989 edges).
- API: `services/api/app/` — routers: alerts, dashboard, demo, graph, model, status, stream. Services: scoring_service (live single-event inference), alert_service (list sorts RISK_DESC, paginated), graph_service (BFS depth<=1 default, limit 60), review_store (SQLite), artifact_store.
- Web: `apps/web/src/` — dashboard page (live stream), `context/StreamContext.tsx` (1,000-event stream, 70/30 mix, play/pause/speed/step, scores via API one-by-one), `components/graph/GraphCanvas.tsx` (ReactFlow + dagre + custom cards + Inspector), `app/investigation/[id]/page.tsx` (uses MOCK_ALERTS + mock evidence/graph fallback when backend off), `app/api/xai/route.ts` (external LLM via OpenCode/mimo — NETWORK, violates offline).
- Demo API: `GET /demo/scenarios` catalog (normal, structuring, peel_chain, rapid_hop, fan_out, fan_in, ip_rotation, source_port_shift). `POST /demo/activate` BUG: returns same max-risk alert for every scenario_key (ignores scenario).
- Docs: model spec, execution spec, frontend spec, handoff, judge deck (10 slides), TRAINED_MODEL_REPORT (PR-AUC 0.9999 / ROC 1.0 — too perfect).

## 2. Why it feels tutorial (judge lens)

1. Hero is 1k tick animation, not bulk ingestion as PS asks (bulk CSV/JSON/XML in → ranked explainable cases out).
2. Graph = BFS window, no entity clustering / centrality / community.
3. Alerts = single binary risk sort, no typology, no reviewer learning.
4. Metrics = near-1.0 on same-distribution split, no leave-one-scenario-out, no ablation, no calibration story.
5. Investigation page silently falls back to MOCK data — trust killer if discovered.
6. XAI requires network — disqualifier vs "complete offline Linux system".

## 3. Upgrade backlog (priority order)

### P0-1 Offline XAI fallback (disqualifier fix)
- Files: `apps/web/src/app/api/xai/route.ts`, `apps/web/src/components/investigation/*`, `apps/web/src/app/transactions/*`
- Change: default path = offline template NLG from TreeSHAP top-5 + rule hits + graph stats. LLM copilot = optional toggle, clearly labeled "Online (optional)".
- Template slots: wallet, n_tx, n_dest, ip_count, time_window, top-3 SHAP features with plain-English glossary, typology guess + confidence tier (High/Med/Low), limitation banner "Synthetic evidence only. Human review required."
- Accept: airplane-mode demo produces full explanation, no fetch, no key.
- Test: unit test asserts offline path with mocked fetch-failure still renders.

### P0-2 Bulk ingestion CSV/JSON/XML + manifest (PS word-match)
- Files: `services/ml/src/tracegraph/` (new `ingest.py`), `services/api/app/api/` (new `ingest.py` router or extend `demo.py`), `services/api/app/schemas/`, `apps/web/src/app/` (new `upload/page.tsx` or repurpose `inspector/`)
- Change: accept `.csv` (exact header), `.json` (array or {events:[]}), `.xml` (<events><event .../>) → normalize to canonical CSV order: event_id,observed_at,txid,input_wallet,output_wallet,amount_sats,fee_sats,script_type,src_ip,src_port,dst_ip,dst_port,latency_ms,peer_count_hint,event_sequence. Validate manifest (data_classification SYNTHETIC_ONLY, sha256 match, IP range 198.18.0.0/15, dst_port 8333). Reject with typed errors (BAD_HEADER, BAD_MANIFEST, OUT_OF_RANGE_IP).
- Flow: upload → progress (parse → features → score → cluster → cases) → "N rows → M links → K cases in T sec".
- Accept: upload each format in offline Linux, corrupt file shows specific error, never retrains.
- Test: 3 golden files + 4 corrupt files.

### P0-3 GeoIP offline (explicit PS ask)
- Files: `services/ml/src/tracegraph/` (lookup), `services/api/app/storage/artifact_store.py`, `apps/web/.../GraphCanvas.tsx`, node schemas
- Change: bundle MaxMind GeoLite2-Country/ASN (.mmdb, document version + license note). Lookup dst/src IP → country/ASN at ingest; store on nodes; UI filter + badge.
- Accept: offline lookup works; unknown IP → "Unknown (synthetic range)" not crash.
- Test: known synthetic IP maps to expected stub in tests (mock mmdb reader).

### P0-4 Fix scenario activation (trust bug)
- File: `services/api/app/api/demo.py::activate_demo_scenario`
- Change: map scenario_key → filter alerts by scenario/typology tag (need scenario label in alert index — see P1-1) OR return scenario-specific featured alert + 5 supporting alerts. Never return global max for all keys.
- Accept: 8 keys return 8 distinct featured_alert_ids.

### P1-1 Entity clustering (biggest standout)
- Files: new `services/ml/src/tracegraph/cluster.py`, `services/api/app/services/graph_service.py`, schemas `graph.py`, `GraphCanvas.tsx`
- Heuristics: (a) co-spend union-find: inputs spending together in same tx → same entity; (b) change-output heuristic (one-time output, amount < smallest input, fresh address); (c) exclude equal-output CoinJoin-like txs (N>=3 equal outputs) from merges. Connected-components → entity_id `ent_XXXX`. Stats per entity: wallets, txs, time span, totalоборот, IP count, typology votes.
- API: `GET /entities/{id}` + `GET /graph?entity_id=` returns entity supernode + members. Keep BFS for drill-down.
- UI: toggle "Events / Entities". Entity card: "E-14 · 23 wallets · 41 txs · 14 IPs · peel-chain 87%".
- Accept: 60k fixture collapses to entity list deterministically (seeded); CoinJoin-like fixture does NOT merge.
- Test: unit fixtures for co-spend merge, change merge, CoinJoin veto.

### P1-2 Typology head (multi-class)
- Files: `services/ml/src/tracegraph/pipeline.py`, `train_model.py`, `model_card.json`, alert schemas
- Change: second XGB classifier (multi:softprob) over same 18 + motif features → typology {STRUCTURING, PEEL_CHAIN, RAPID_HOP, FAN_OUT, FAN_IN, IP_ROTATION, PORT_SHIFT, MIXER_LIKE, BENIGN} + calibrated confidence (isotonic on validation). Store top-1 + top-2 per alert.
- UI: typology chip + confidence tier on alert card + filter by typology.
- Accept: model_card documents classes, calibration (Brier per class); demo shows "peel chain, 87%, 14 hops".
- Test: schema test for new fields; back-compat (old alerts.json without typology → "UNKNOWN").

### P1-3 Motif + centrality features (+5)
- File: `services/ml/src/tracegraph/pipeline.py::extract_features`
- Add past-only: peel_length (chain depth trailing), fan_depth_1h, burstiness (std/mean of inter-arrival 1h), pagerank_ego (on observed graph snapshot), community_id (Louvain or label-prop on snapshot, past-only).
- Update `feature_schema.json` version + hash; document drift in model_card. Retrain allowed once, then freeze.
- Accept: ablation shows lift or honest null; leave-one-scenario-out reported.

### P1-4 Honest evaluation pack
- Files: `services/ml/scripts/eval_robustness.py` (new), `docs/TRAINED_MODEL_REPORT.md`, judge deck
- Compute: leave-one-scenario-out (8 runs or sampled 3 if slow), ablation (rules / IF / XGB / hybrid), cross-seed (2026, 2027), latency (events/sec, p95 single-event ms, RAM peak), calibration curve + Brier.
- Present: "held-out 0.99 → unseen-scenario 0.82" + "FP/1000" + "14s for 60k on CPU". Honest drop > fake perfect.
- Accept: script runs CPU-only, writes `eval_loso.json`, `eval_ablation.json`.

### P2-1 Active-learning queue
- Files: `services/api/app/storage/review_store.py`, `alert_service.py`, web investigation page
- Change: Confirm/Dismiss → update entity/typology weights (simple additive re-rank, no retrain) → "queue precision after 30 reviews" counter.
- Accept: demo shows reorder after 5 clicks; audit log records each action.

### P2-2 Remove mock fallback + hash-chained case file
- Files: `apps/web/src/app/investigation/[id]/page.tsx`, `apps/web/src/data/*`, new `services/api/app/api/cases.py`
- Change: delete MOCK fallback in prod path; backend-down → explicit error card + "load offline bundle". Add `POST /cases/export` → ZIP (report.pdf.html, evidence.json, manifest + SHA chain log). Each review appends hash-chained entry (prev_hash + action + timestamp).
- Accept: grep shows no MOCK import in investigation route; export verifies with `sha256sum`.

### P2-3 Threshold tuner + performance card
- Files: web dashboard/alerts, `threshold_table.json` already exists
- Change: slider 50–95 → live precision/recall/FP from threshold_table; perf card (events/sec, model MB, RAM).
- Accept: slider updates counts without refetch.

## 4. New hero demo flow (replace 1k stream)

1. Upload `events.csv` → progress → "60,000 rows → 58,989 links → 312 entities → 18 priority cases, 14s CPU".
2. Entity list → open E-14 → supernode graph + typology chip.
3. Alert detail → 5 SHAP reasons (offline template) → Confirm.
4. Export → signed case ZIP downloads. End.
5. Keep 1k stream as background visual only (rename component `StreamBackdrop`, remove from critical path).

## 5. Constraints (non-negotiable)

- Offline Linux, CPU-only, `n_jobs=1`, seeds pinned, no sockets in `services/ml`.
- Synthetic-only: reject non-`syn_*` wallets, non-198.18.0.0/15 IPs, manifest must say SYNTHETIC_ONLY.
- No label leakage: never expose is_anomalous/scenario_id/severity_truth to UI or features.
- Determinism: same seed + fixture → same alerts/entities; record SHA in manifest + model_card.
- Safety copy everywhere: "Synthetic evidence only. Human review required."

## 6. Suggested agent order (small PRs)

1. P0-4 scenario fix (30 min, trust bug)
2. P0-1 offline XAI (half day)
3. P0-2 ingest + P0-3 GeoIP (1 day)
4. P1-1 entities (1–2 days, biggest win)
5. P1-4 eval pack (half day, deck numbers)
6. P2-2 export + mock removal (half day)
7. P1-2/P1-3 only if time — freeze model after.

## 7. Done definition

- [ ] Airplane-mode Linux run: upload CSV/JSON/XML → entities → case → offline explanation → signed export, no errors.
- [ ] 8 scenario buttons give 8 distinct cases.
- [ ] No MOCK import in investigation path; no external fetch in default path.
- [ ] `eval_loso.json` + ablation + perf numbers in report + deck.
- [ ] Tests: existing 76 pass + new ingest/cluster/offline-xai/export tests green.
