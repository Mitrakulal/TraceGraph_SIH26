# TraceGraph AI — Demo Readiness Change Specification

**Repository:** `Mitrakulal/TraceGraph_SIH26` (branch `main`)
**Purpose:** Align the running prototype with the claims made in the submitted SIH idea deck (`106_SIH26146 (3).pdf`) before recording the demo video.
**Audience:** An AI coding agent executing changes without human clarification.

---

## 0. Rules For The Executing Agent

1. Do **not** infer, invent, or "improve" beyond what is written here.
2. Every change below specifies an exact file path, an exact anchor string, and exact replacement content. Match anchors literally including whitespace.
3. If an anchor string is not found exactly, **stop and report** — do not search for a "similar" location.
4. Do **not** modify any file under `services/ml/artifacts/` or `services/ml/data/`. These are frozen, hash-verified model artifacts. Changing them invalidates `model_card.json` checksums.
5. Do **not** retrain the model. Do **not** regenerate the dataset.
6. After each task, run the verification command given for that task.
7. Tasks marked **[BLOCKING]** must be completed before any demo recording. Tasks marked **[RECOMMENDED]** improve the demo but do not invalidate claims.

---

## 1. Ground Truth — Verified Numbers

These were read directly from committed artifacts. **Use these numbers everywhere.** Do not round differently, do not substitute.

| Fact | Verified Value | Source File |
|---|---|---|
| Total synthetic events | `60000` | `services/ml/artifacts/runs/sih26146-cpu-demo-2026-v1/model_card.json` → `dataset.event_count` |
| Anomaly (labelled) count | `2000` | same → `dataset.anomaly_count` |
| Benign count | `58000` | same → `dataset.benign_count` |
| Seed | `2026` | same → `seed` |
| Scenario count | `8` (250 each) | same → `dataset.scenario_counts` |
| Graph nodes | `11999` | `graph_summary.json` → `node_count` |
| Graph edges | `58989` | `graph_summary.json` → `edge_count` |
| Strongly connected components | `180` | `graph_summary.json` |
| Feature count | `18` | `model_card.json` → `feature_count` |
| Alert queue size | `250` | `alerts.json` (array length) |
| Evidence records | `1250` (= 250 × 5) | `evidence.json` (array length) |
| Alert risk score range | min `82`, max `93` | computed from `alerts.json` |
| **Test** precision @ threshold | `0.982456` → **98.2%** | `metrics_test.json` |
| **Test** recall @ threshold | `1.0` → **100%** | `metrics_test.json` |
| **Test** F1 @ threshold | `0.99115` → **99.1%** | `metrics_test.json` |
| **Test** PR-AUC | `0.999962` | `metrics_test.json` |
| **Test** false positives / 1000 | `0.420875` | `metrics_test.json` |
| Test confusion matrix | TN `11595`, FP `5`, FN `0`, TP `280` | `metrics_test.json` |
| Split sizes | train `36200` / val `11920` / test `11880` | `graph_summary.json` → `split_counts` |
| Risk threshold | `65` | `services/api/app/api/dashboard.py` |
| Run ID | `sih26146-cpu-demo-2026-v1` | `services/api/app/core/config.py` |

---

## 2. Findings — Deck Claim vs Repository Reality

| # | Deck Claim | Repository Reality | Severity |
|---|---|---|---|
| F1 | Badge: "100% Offline", "No Real User Data" | `apps/web/src/app/api/xai/route.ts` makes a live outbound HTTPS call to `https://opencode.ai/zen/v1/chat/completions` with an API key | **BLOCKING — claim is false while this code exists** |
| F2 | Dashboard screenshot on slide 2 shows `60,000` events, `48,219` entities, `250` review alerts, and card labels "Events Analyzed / Entities Observed / Review Alerts" | Current `apps/web/src/app/page.tsx` streams only **1,000** events (`getStreamEvents(1000)`), and card labels now read "Entities Discovered" / "High-Risk Alerts". The deck screenshot no longer matches the running build. | **BLOCKING — demo will visibly contradict the deck** |
| F3 | Implied: dashboard shows live system output | `apps/web/src/app/alerts/page.tsx` line 59 silently falls back to `MOCK_ALERTS` when the backend is unreachable, with no on-screen indication | **BLOCKING — you can record an entire demo of fake data unknowingly** |
| F4 | Slide 2: "explainable risk scores with crime typology, confidence, and plain-English reasons" | `evidence.json` messages are templated raw feature names: `"Synthetic feature inter_event_seconds increased the model risk score."` — not plain English, no typology | **BLOCKING for the explainability claim** |
| F5 | Slide 2: output includes "crime typology" | `alerts.json` sets `"scenario_truth_hidden": "NOT_EXPOSED_TO_UI"` — typology is deliberately withheld by design | **BLOCKING — deck promises what the design forbids** |
| F6 | Slide 3 worked example: "Wallet flagged: 82/100 (High)" | `82` is the **lowest** score in the queue (rank 250 of 250), not a headline case | **RECOMMENDED — weak but not false** |
| F7 | Slide 3 worked example evidence: "Rapid mixing pattern, high-degree node, geographic anomaly" | Actual top SHAP features are `inter_event_seconds`, `fan_out_ratio`, `wallet_unique_ips`, etc. No geographic feature contributes to scoring. | **BLOCKING — example is fabricated relative to real output** |
| F8 | `README.md` "Canonical Structure" says `apps/web/` is "planned, not yet scaffolded" and `services/api/` "planned, not yet implemented" | Both are fully implemented and committed | **RECOMMENDED — internal contradiction a judge may notice** |

---

## 3. [BLOCKING] Task C1 — Remove the outbound cloud LLM dependency

**Why:** This is the single change that most affects credibility. The deck, the README safety boundary, and the problem statement all assert an offline, air-gapped system. A live call to a third-party inference endpoint contradicts all three. If a judge opens the repo or inspects network traffic during the demo, the offline claim collapses.

**Decision required before executing:** choose **C1-A** (delete feature) or **C1-B** (replace with offline generator). If no preference is recorded, execute **C1-B**.

### C1-B (default): Replace the cloud call with a deterministic offline explanation generator

**File:** `apps/web/src/app/api/xai/route.ts`
**Action:** Replace the **entire file contents** with the following. Do not preserve any part of the previous implementation.

```ts
import { NextResponse } from 'next/server';

/**
 * Offline Investigator Explanation Endpoint.
 *
 * This route performs NO outbound network calls. It composes a deterministic,
 * template-based natural-language explanation from SHAP evidence and alert
 * context supplied by the caller. This preserves the system's offline,
 * air-gapped guarantee.
 */

const FEATURE_LABELS: Record<string, string> = {
  amount_log: 'transaction amount',
  fee_rate: 'fee rate',
  latency_log: 'network latency',
  peer_count_hint: 'peer count',
  src_port_norm: 'source port pattern',
  inter_event_seconds: 'time gap between transactions',
  recent_count_10m: 'transaction burst rate (10 min window)',
  wallet_out_count: 'outgoing transaction count',
  wallet_unique_destinations: 'number of distinct destination wallets',
  wallet_unique_ips: 'number of distinct IP addresses used',
  ip_rotation_rate: 'IP rotation rate',
  fan_out_ratio: 'fan-out ratio',
  target_unique_senders: 'number of distinct senders to target',
  source_out_degree: 'source wallet out-degree',
  target_in_degree: 'target wallet in-degree',
  degree_ratio: 'in/out degree ratio',
  graph_reach_proxy: 'graph reach',
  script_type_code: 'script type',
};

const RULE_LABELS: Record<string, string> = {
  'BR-02': 'fan-out ratio above expected range',
  'BR-04': 'high IP rotation',
  'BR-05': 'rapid successive relationship activity',
};

function describeFeature(key: string): string {
  return FEATURE_LABELS[key] ?? key;
}

export async function POST(req: Request) {
  try {
    const { context } = await req.json();

    const alertId = context?.alertId ?? 'unknown';
    const wallet = context?.sourceWallet ?? 'unknown';
    const riskScore = context?.riskScore ?? 'unknown';
    const evidence = Array.isArray(context?.evidence) ? context.evidence.slice(0, 5) : [];
    const ruleHits: string[] = Array.isArray(context?.ruleHits) ? context.ruleHits : [];
    const nodeCount = context?.graphSummary?.nodeCount ?? context?.graphNodes?.length ?? 0;
    const edgeCount = context?.graphSummary?.edgeCount ?? context?.graphEdges?.length ?? 0;

    const lines: string[] = [];

    lines.push(`**Alert ${alertId}** — review priority score **${riskScore}/100**.`);
    lines.push('');
    lines.push(`**Entity under review:** \`${wallet}\``);
    lines.push('');

    if (evidence.length > 0) {
      lines.push('**Why this was prioritised (top contributing factors):**');
      evidence.forEach((item: { feature?: string; feature_value?: number; direction?: string }) => {
        const label = describeFeature(item?.feature ?? '');
        const direction = item?.direction === 'INCREASED_RISK' ? 'raised' : 'lowered';
        const value = typeof item?.feature_value === 'number' ? ` (observed value: ${item.feature_value})` : '';
        lines.push(`- ${label}${value} — ${direction} the priority score`);
      });
      lines.push('');
    }

    if (ruleHits.length > 0) {
      lines.push('**Rule checks triggered:**');
      ruleHits.forEach((code) => {
        lines.push(`- \`${code}\` — ${RULE_LABELS[code] ?? 'rule threshold exceeded'}`);
      });
      lines.push('');
    }

    if (nodeCount > 0 || edgeCount > 0) {
      lines.push(`**Graph context:** ${nodeCount} nodes and ${edgeCount} edges in the current view.`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('*Synthetic data only. This score indicates review priority, not wrongdoing. Human review is required.*');

    return NextResponse.json({ reply: lines.join('\n') });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Additionally:** the caller must now pass `ruleHits`. In `apps/web/src/components/investigation/InvestigatorChat.tsx`, locate the object literal passed as `context` in the request body and add a `ruleHits` property sourced from the alert's `rule_hits` field. If `rule_hits` is not available in that component's props, pass an empty array `[]`.

### C1-A (alternative): Delete the feature entirely

1. Delete file `apps/web/src/app/api/xai/route.ts`.
2. Delete file `apps/web/src/components/investigation/InvestigatorChat.tsx`.
3. Remove every import and JSX usage of `InvestigatorChat` from `apps/web/src/app/investigation/[id]/page.tsx`.
4. Delete `docs/XAI_IMPLEMENTATION.md`.

### C1 Verification (applies to both options)

```bash
# MUST return no results other than this spec file itself:
grep -rn "opencode.ai\|OPENCODE_API_KEY\|chat/completions" --include=*.ts --include=*.tsx --include=*.md .
```

If any result is returned from inside `apps/` or `services/`, the task is incomplete.

---

## 4. [BLOCKING] Task C2 — Reconcile dashboard totals with the deck

**Why:** The deck's slide-2 screenshot shows 60,000 events analysed. The running dashboard streams 1,000. A judge comparing the deck to the video will see a 60× discrepancy.

**Approach:** Do **not** fake the stream size. Display both figures honestly — the live stream count *and* the full offline benchmark total.

### C2.1 — Label the live stream explicitly

**File:** `apps/web/src/app/page.tsx`
**Anchor (exact):**
```tsx
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Events Analyzed</span>
```
**Replace with:**
```tsx
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Stream Progress</span>
```

### C2.2 — Add a benchmark totals strip above the stat cards

**File:** `apps/web/src/app/page.tsx`
**Anchor (exact):**
```tsx
        {/* Events Analyzed */}
```
**Insert immediately BEFORE the anchor line:**
```tsx
        {/* Offline benchmark provenance — full scored corpus */}
        <div className="col-span-full mb-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-semibold text-slate-600">
            <span>Offline benchmark scored: <span className="font-mono text-slate-900">60,000</span> synthetic events</span>
            <span>Graph: <span className="font-mono text-slate-900">11,999</span> nodes / <span className="font-mono text-slate-900">58,989</span> edges</span>
            <span>Review queue: <span className="font-mono text-slate-900">250</span> alerts</span>
            <span>Run: <span className="font-mono text-slate-900">sih26146-cpu-demo-2026-v1</span></span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            Synthetic data only · seed 2026 · the panel below replays a 1,000-event slice of this corpus in real time
          </div>
        </div>

        {/* Events Analyzed */}
```

> Note: this assumes the parent element is a CSS grid, which `col-span-full` requires. If the parent container of the stat cards is **not** a grid, place the block immediately before the opening tag of that container instead, and remove the `col-span-full` class.

### C2.3 — Update the deck screenshot after this change

The slide-2 dashboard screenshot must be **retaken** after C2 and C3 are complete. The current deck image shows labels ("Entities Observed", "Review Alerts") that no longer exist in the code.

### C2 Verification

```bash
cd apps/web && npx tsc --noEmit
```
Then run the app and confirm the benchmark strip renders above the stat cards with all four figures.

---

## 5. [BLOCKING] Task C3 — Make mock-data fallback impossible to miss

**Why:** If the FastAPI backend is not running, `alerts/page.tsx` silently renders `MOCK_ALERTS`. A demo recorded in that state shows fabricated alerts while claiming live output.

### C3.1 — Surface the fallback state

**File:** `apps/web/src/app/alerts/page.tsx`
**Anchor (exact):**
```tsx
    return (MOCK_ALERTS as unknown as ApiAlertListItem[]);
  }, [viewMode, detectedAlerts, historicalAlerts]);
```
**Replace with:**
```tsx
    return (MOCK_ALERTS as unknown as ApiAlertListItem[]);
  }, [viewMode, detectedAlerts, historicalAlerts]);

  const isUsingFallbackData =
    !isBackendConnected && detectedAlerts.length === 0 && historicalAlerts.length === 0;
```

### C3.2 — Render a blocking warning banner

**File:** `apps/web/src/app/alerts/page.tsx`
**Action:** Locate the outermost JSX element returned by the page component. Insert the following as the **first child** of that element:

```tsx
      {isUsingFallbackData && (
        <div className="mb-4 rounded-lg border-2 border-red-500 bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-700">
            BACKEND NOT CONNECTED — showing placeholder data, not live model output.
          </p>
          <p className="mt-1 text-xs font-medium text-red-600">
            Start the API at http://127.0.0.1:8000 before recording or evaluating. Do not screenshot this state.
          </p>
        </div>
      )}
```

### C3.3 — Apply the same treatment to remaining mock consumers

Repeat the same pattern (detect empty API result → render the identical red banner) in each of these files:

- `apps/web/src/app/entities/page.tsx` — imports `entities` from `@/data/entities`
- `apps/web/src/app/entities/[id]/page.tsx` — imports `entities` and `syntheticEvents`
- `apps/web/src/app/investigation/[id]/page.tsx` — imports `MOCK_ALERTS`, `getAlertsEvidence`, `getAlertGraph`

### C3 Verification

Stop the backend, load each page above, and confirm the red banner appears on every one. Then start the backend and confirm it disappears on every one.

---

## 6. [BLOCKING] Task C4 — Convert SHAP evidence into plain-English reasons

**Why:** The deck promises "plain-English reasons". The API currently returns `"Synthetic feature inter_event_seconds increased the model risk score."` Raw feature identifiers are not plain English.

**Constraint:** `evidence.json` is a frozen artifact. Do **not** edit it. Perform the mapping in the API response layer.

**File:** `services/api/app/core/config.py`
**Action:** Append the following to the end of the file:

```python
# Human-readable labels for the 18 model features.
# Used to render plain-English evidence in API responses.
# Keys must exactly match feature names in graph_summary.json -> feature_columns.
FEATURE_PLAIN_LABELS = {
    "amount_log": "transaction amount",
    "fee_rate": "fee rate",
    "latency_log": "network latency",
    "peer_count_hint": "peer count",
    "src_port_norm": "source port pattern",
    "inter_event_seconds": "time gap between transactions",
    "recent_count_10m": "transaction burst rate in a 10-minute window",
    "wallet_out_count": "outgoing transaction count",
    "wallet_unique_destinations": "number of distinct destination wallets",
    "wallet_unique_ips": "number of distinct IP addresses used",
    "ip_rotation_rate": "IP rotation rate",
    "fan_out_ratio": "fan-out ratio",
    "target_unique_senders": "number of distinct senders to the target",
    "source_out_degree": "source wallet out-degree",
    "target_in_degree": "target wallet in-degree",
    "degree_ratio": "in-to-out degree ratio",
    "graph_reach_proxy": "graph reach",
    "script_type_code": "script type",
}


def plain_reason(feature: str, direction: str) -> str:
    """Render a plain-English reason line for a SHAP evidence record."""
    label = FEATURE_PLAIN_LABELS.get(feature, feature)
    verb = "raised" if direction == "INCREASED_RISK" else "lowered"
    return f"Unusual {label} {verb} the review priority score."
```

**File:** `services/api/app/api/alerts.py`
**Action:** Locate every point where an evidence record's `message` field is placed into a response model. For each, replace the value with a call to `plain_reason(record["feature"], record["direction"])`. Import it with:
```python
from app.core.config import plain_reason
```
Leave the original `message` field intact in the response under its existing key **and** add the generated text under a new key `plain_reason`. Do not remove existing fields — the frontend and tests depend on them.

### C4 Verification

```bash
cd services/api && python3 -m pytest tests/ -v
```
All 76 tests must still pass. Then:
```bash
curl -s http://127.0.0.1:8000/api/v1/alerts/alt_00001_syn_evt_00000000e966_000000001c33e224 | python3 -m json.tool | grep plain_reason
```
Must return sentences containing no underscores.

---

## 7. [BLOCKING] Task C5 — Resolve the "crime typology" claim

**Why:** Slide 2 states the system outputs "crime typology". `alerts.json` sets `scenario_truth_hidden: "NOT_EXPOSED_TO_UI"` — the ground-truth scenario label is deliberately withheld from the UI by design, which is the correct choice (exposing it would leak labels and make the demo circular).

**Two valid resolutions. Choose one.**

### C5-A (recommended, no code change): Correct the deck

Change slide 2 solution text from:
> "...explainable risk scores with crime typology, confidence, and plain-English reasons."

to:
> "...explainable risk scores with confidence, triggered rule checks, and plain-English reasons."

This is accurate against the current build. `rule_hits` (`BR-02`, `BR-04`, `BR-05`) **are** exposed and **are** behaviour-pattern indicators — they legitimately support the claim once reworded.

### C5-B: Expose a derived pattern label

Derive a display label from `rule_hits` only (never from `scenario_truth_hidden`), using `RULE_CODE_MAP` already present in `services/api/app/core/config.py`. Surface as `pattern_indicators` — a list of human labels. **Do not** name it "typology" or "crime type"; these imply a determination the system does not make.

> Do **not** implement C5-B by reading `scenario_truth_hidden`. That field is ground truth. Using it to populate the UI would make the demo show the answer key rather than a prediction.

---

## 8. [BLOCKING] Task C6 — Fix the slide-3 worked example

**Why:** The worked example currently on slide 3 does not correspond to any real system output.

**Current (incorrect) content:**
- `Risk Scored — Wallet flagged: 82/100 (High)`
- `Evidence Generated — Rapid mixing pattern, high-degree node, geographic anomaly`

**Problems:**
1. `82` is the lowest-ranked alert in the queue (rank 250 of 250), not a compelling example.
2. The three named evidence factors do not exist in the model. There is **no geographic feature** among the 18 features; `GeoLite2` is used for display enrichment only, never for scoring.

**Replace with the real top-ranked alert:**

| Card | Corrected text |
|---|---|
| Ingest | `60,000 events` *(unchanged — verified correct)* |
| Graph Built | `11,999 nodes / 58,989 edges` *(update `58k` → `58,989`)* |
| Risk Scored | `Wallet flagged: 93/100 (queue rank 1)` |
| Evidence Generated | `Time gap between transactions, fan-out ratio, IP rotation rate` |
| Case Exported | `Investigator confirms → signed export` *(unchanged)* |

Real values for the rank-1 alert, for reference:
- `alert_id`: `alt_00001_syn_evt_00000000e966_000000001c33e224`
- `entity_id`: `syn_w_0000000000001770`
- `risk_score`: `93`
- `ml_probability`: `0.999989`
- `novelty_score`: `0.935726`
- `graph_risk_score`: `0.380711`
- `rule_hits`: `BR-02`, `BR-04`, `BR-05`

---

## 9. [RECOMMENDED] Task C7 — Fill the deck's metric placeholders

The deck currently carries `[XX]%` placeholders. Verified values to insert:

- **Precision: 98.2%** · **Recall: 100%** (held-out test split, threshold 0.5)
- Supporting: PR-AUC `0.9999`, F1 `99.1%`, `0.42` false positives per 1,000 events
- Confusion matrix (test): TP `280`, FP `5`, FN `0`, TN `11,595`

**Mandatory caveat — include this wherever the metrics appear:**

> Measured on held-out synthetic data (seed 2026) with programmatically injected scenarios. Near-ceiling scores reflect the separability of synthetic patterns and are not a claim of real-world performance.

**Reasoning — read before deciding to present these numbers.** Recall of exactly 100% with zero false negatives across 280 positives is a hallmark of synthetic data where anomalies were injected by rule and are therefore near-perfectly separable. A technically literate judge will recognise this immediately. Presenting 98.2%/100% *without* the caveat invites the question "is your test set leaking?" and puts you on the defensive. Presenting it *with* the caveat — and being ready to say "these numbers measure that our pipeline correctly recovers known injected patterns; real-world performance would require real labelled data we're not permitted to use" — turns the same weakness into evidence of methodological awareness. The second framing is materially stronger in a Q&A.

---

## 10. [RECOMMENDED] Task C8 — Fix the README self-contradiction

**File:** `README.md`
**Anchor (exact):**
```
apps/web/          # Next.js frontend — planned, not yet scaffolded
services/api/       # FastAPI backend — planned, not yet implemented
```
**Replace with:**
```
apps/web/          # Next.js frontend — implemented
services/api/       # FastAPI backend — implemented
```

---

## 11. Pre-Recording Checklist

Complete in order. Do not record until every box passes.

- [ ] C1 done — `grep -rn "opencode.ai" apps/ services/` returns nothing
- [ ] C2 done — benchmark strip visible, labels updated
- [ ] C3 done — red banner appears on all four pages with backend stopped, disappears with it running
- [ ] C4 done — 76/76 API tests pass, `plain_reason` present in responses
- [ ] C5 resolved — deck reworded (C5-A) or `pattern_indicators` shipped (C5-B)
- [ ] C6 done — slide 3 worked example updated to the rank-1 alert
- [ ] C7 done — metric placeholders filled **with** the caveat line
- [ ] C8 done — README corrected
- [ ] Backend confirmed running: `curl http://127.0.0.1:8000/api/v1/status` returns `model_ready: true`
- [ ] Slide-2 dashboard screenshot **retaken** from the post-change build
- [ ] Network disconnected, full demo path walked end to end — everything still works (this is the proof of the offline claim; if anything breaks, an outbound dependency remains)

---

## 12. Out Of Scope — Do Not Change

- Any file under `services/ml/artifacts/` — frozen, hash-verified
- Any file under `services/ml/data/` — frozen, hash-verified (`events_sha256`, `labels_sha256` in `model_card.json`)
- Model hyperparameters in `model_card.json`
- The `scenario_truth_hidden` field — must remain unexposed to UI
- `seed` value `2026` — changing it invalidates every number in this document
