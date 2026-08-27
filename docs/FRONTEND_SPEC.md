# TraceGraph AI — Frontend

> TraceGraph AI is a CPU-only, offline, synthetic-data-only intelligence dashboard for investigating unusual Bitcoin-style transaction patterns. The frontend presents model-generated review signals, explanations, relationships, and synthetic investigation data for human review.

## Project Scope

| Area | Scope |
|---|---|
| Data | Synthetic Bitcoin-style transaction and IP/network metadata |
| Processing | Offline |
| Training | CPU-only |
| Anomaly Detection | Isolation Forest |
| Risk Classification | XGBoost |
| Explainability | Native XGBoost TreeSHAP |
| Review Score | 0–100 synthetic review priority score |
| Relationship Analysis | Time-safe graph/relationship proxy features |
| Frontend | Monitoring, alerts, investigation, graph and analytics |
| Decision Making | Human review |
| Real Blockchain Data | Not used |
| Real Wallet Data | Not used |
| Real IP Data | Not used |
| Identity Resolution | Not supported |
| Automated Enforcement | Not supported |

> **Synthetic-data warning.** All transaction, wallet, entity, network and IP identifiers shown by the frontend are synthetic. The application must never imply that it is connected to live Bitcoin traffic, real wallets, real IP intelligence or a real blockchain.

## Product Flow

```text
Synthetic Data
      |
      v
Feature Extraction
      |
      +-------------------+
      |                   |
      v                   v
Isolation Forest     Graph Proxies
      |                   |
      +---------+---------+
                |
                v
             XGBoost
                |
                v
          Review Score
             0–100
                |
                v
       Explainable Alert
                |
                v
        Human Investigation
                |
                v
        Relationship Graph
                |
                v
           Human Review
```

## Frontend Responsibilities

| Area | Responsibility |
|---|---|
| Dashboard | Monitoring overview and synthetic activity |
| Alerts | Ranked review queue |
| Investigation | Alert explanation and investigation workflow |
| Transactions | Synthetic transaction/event exploration |
| Entities | Synthetic entity intelligence |
| Graph | Transaction/entity/network relationships |
| Model | Model performance and feature information |
| Dataset | Synthetic dataset and artifact exploration |
| Demo | Controlled normal/anomaly scenarios |
| Settings | Frontend-only configuration |
| Presentation | Clear visualization of the TraceGraph AI pipeline |

The frontend displays outputs produced by the backend/model pipeline.

It must **not** recreate the machine-learning pipeline or calculate new model scores.

## Application Architecture

```text
Frontend
|
+-- Dashboard
|     +-- Metrics
|     +-- Activity
|     +-- Risk Distribution
|     +-- Priority Alerts
|     +-- Network Activity
|
+-- Alerts
|     +-- Search
|     +-- Filters
|     +-- Ranked Alerts
|     +-- Investigation
|
+-- Investigation
|     +-- Alert Overview
|     +-- Review Score
|     +-- Model Evidence
|     +-- Feature Contributions
|     +-- Risk Factors
|     +-- Related Entities
|     +-- React Flow Graph
|
+-- Transactions
|     +-- Transaction Explorer
|     +-- Transaction Detail
|
+-- Entities
|     +-- Entity Explorer
|     +-- Entity Detail
|
+-- Model
|     +-- Isolation Forest
|     +-- XGBoost
|     +-- Performance
|     +-- Feature Importance
|
+-- Dataset
|     +-- Dataset Summary
|     +-- Artifact Explorer
|
+-- Demo
|     +-- Synthetic Scenarios
|
+-- Settings
      +-- Frontend Configuration
```

## Application Shell

The application uses a persistent sidebar and top bar.

```text
+-----------------------------------------------------------------------+
| TraceGraph AI                 LOCAL / OFFLINE   SYNTHETIC DATA ONLY   |
+---------------+-------------------------------------------------------+
|               |                                                       |
| Monitoring    |                                                       |
|  Dashboard    |                                                       |
|  Alerts       |                     PAGE CONTENT                       |
|               |                                                       |
| Investigation|                                                       |
|  Investigation|                                                       |
|  Transactions |                                                       |
|  Entities     |                                                       |
|               |                                                       |
| Intelligence  |                                                       |
|  Model        |                                                       |
|  Dataset      |                                                       |
|               |                                                       |
| Demo          |                                                       |
|               |                                                       |
| System        |                                                       |
|  Settings     |                                                       |
|               |                                                       |
| ● OFFLINE     |                                                       |
+---------------+-------------------------------------------------------+
```

The shell should permanently communicate:

```text
OFFLINE · SYNTHETIC DATA ONLY
```

The top bar may also display:

```text
LOCAL / OFFLINE
SYNTHETIC DATA
```

The interface must not use wording such as:

```text
LIVE
REAL-TIME BLOCKCHAIN
LIVE BITCOIN
REAL IP INTELLIGENCE
```

## Navigation

### Monitoring

- Dashboard
- Alerts

### Investigation

- Investigation
- Transactions
- Entities

### Intelligence

- Model
- Dataset

### Demo

- Synthetic Scenarios

### System

- Settings

All navigation items must be functional.

## Dashboard

The dashboard provides a high-level view of the synthetic analysis pipeline.

### Metrics

Display:

| Metric | Example |
|---|---:|
| Transactions Analyzed | `60,000` |
| Entities Identified | `48,219` |
| High Risk Entities | `127` |
| Anomalies Detected | `342` |

These values represent synthetic/local data and should be clearly presented as such.

### Activity Timeline

Use Recharts to display:

- Synthetic transaction activity
- Synthetic anomaly activity
- Activity over time

The chart should communicate analytical information rather than act as decoration.

### Priority Alerts

Display the highest-priority synthetic review signals.

```text
HIGH      SYN-ALERT-001      Rapid transaction pattern       92.4
HIGH      SYN-ALERT-002      Repeated network changes        88.7
MEDIUM    SYN-ALERT-003      Multi-hop relationship          72.1
```

Each alert should provide a path to investigation.

### Risk Distribution

Display synthetic review-score distribution:

```text
HIGH
MEDIUM
LOW
```

Use a Recharts donut/pie chart where appropriate.

### Network Activity

Display a synthetic relationship/network visualization showing:

- Synthetic nodes
- Synthetic connections
- Activity density
- Highlighted review signals

This is not a geographical intelligence system.

## Alerts

The Alerts page provides the ranked synthetic review queue.

### Filters

Provide:

- Search
- Severity
- Review score
- Date/time
- Model signal
- Anomaly status
- Clear filters

### Alert Table

| Severity | Alert ID | Entity/Event | Description | Score | Model Signal | Status |
|---|---|---|---|---:|---|---|
| HIGH | `SYN-ALERT-001` | `SYN-WAL-0192` | Rapid transaction pattern | 92.4 | XGBoost + IF | OPEN |
| HIGH | `SYN-ALERT-002` | `SYN-ENT-72A1` | Repeated network changes | 88.7 | XGBoost + IF | OPEN |
| MEDIUM | `SYN-ALERT-003` | `SYN-WAL-0441` | Multi-hop relationship | 72.1 | XGBoost | REVIEWED |

Clicking an alert should open:

```text
/investigation/[id]
```

## Investigation

The Investigation page is the core frontend workflow.

### Alert Overview

Display:

- Alert ID
- Entity ID
- Transaction/event ID
- Timestamp
- Severity
- Status
- Review score

Example:

```text
SYN-ALERT-001
HIGH RISK

SYN-WAL-0192
Rapid transaction pattern

Review Score
92.4
```

Actions:

```text
MARK REVIEWED
ESCALATE
EXPORT REPORT
```

These actions are frontend-only.

### Why Was This Flagged?

The explanation panel should display precomputed model evidence.

```text
WHY WAS THIS FLAGGED?

Isolation Forest Novelty       +0.31
XGBoost Probability            +0.52
Graph Reach Proxy              +0.09
```

The frontend must **not calculate or invent these values**.

### Feature Contributions

Display the precomputed TreeSHAP feature contributions.

```text
Transaction Frequency       +0.32
████████████████████

Graph Reach                 +0.18
██████████

Time Relationship           +0.14
████████

Amount Pattern              +0.08
████
```

Feature contributions should come from the backend/model artifacts.

## Relationship Graph

The investigation graph uses React Flow.

```text
             SYN-ENT-72A1
                  |
                  v
            SYN-TX-8F21
             /        \
            v          v
      SYN-WAL-0192  SYN-WAL-0441
                         |
                         v
                   SYN-TX-91A2
```

### Node Types

- Synthetic entity
- Synthetic wallet
- Synthetic transaction
- Synthetic network observation

### Relationship Types

- Sent to
- Received from
- Related transaction
- Shared synthetic network observation

### Graph Interactions

The graph should support:

- Pan
- Zoom
- Fit view
- Node selection
- Relationship selection
- Node information
- Relationship details
- Suspicious-node highlighting

The graph must be functional rather than a static image.

## Related Entities

The investigation page should show connected synthetic entities.

| Entity | Relationship | Score | Transactions | Last Activity |
|---|---|---:|---:|---|
| `SYN-ENT-72A1` | Related transaction | 91.2 | 184 | 12 min ago |
| `SYN-ENT-0172` | Shared network observation | 68.4 | 92 | 24 min ago |

## Risk Factors

Display the strongest synthetic behavioural signals.

```text
HIGH
Rapid transaction frequency

HIGH
Multi-hop movement

MEDIUM
Unusual transaction amount

MEDIUM
Repeated synthetic network changes

LOW
Graph proximity to flagged entity
```

Risk factors are explanatory signals, not criminal classifications.

## Transactions

The Transactions page provides a synthetic transaction/event explorer.

### Filters

- Search
- Date/time
- Review level
- Amount range
- Anomaly status
- Reset filters

### Transaction Table

| Transaction ID | Timestamp | Sender | Receiver | Amount | Fee | Score | Anomaly |
|---|---|---|---|---:|---:|---:|---|
| `SYN-TX-8F21A9C2` | `2026-08-27 14:22` | `SYN-WAL-0192` | `SYN-WAL-0441` | `4.82` | `0.003` | `92.4` | YES |
| `SYN-TX-44B91E0A` | `2026-08-27 14:18` | `SYN-WAL-0281` | `SYN-WAL-0317` | `1.47` | `0.001` | `34.2` | NO |

All values are synthetic.

### Transaction Detail

Display:

- Transaction ID
- Timestamp
- Sender
- Receiver
- Amount
- Fee
- Synthetic block height
- Review score
- Anomaly score
- Related entities
- Model signals

Example:

```text
SYN-WAL-0192
       |
       v
SYN-TX-8F21A9C2
       |
       v
SYN-WAL-0441
```

Suspicious synthetic transactions should provide:

```text
VIEW INVESTIGATION
```

## Entities

The Entities page provides synthetic entity intelligence.

### Entity Table

| Entity ID | Type | Transactions | Total Volume | Score | Risk | Last Seen |
|---|---|---:|---:|---:|---|---|
| `SYN-ENT-72A1` | Wallet | 184 | 428.2 | 91.2 | HIGH | 12 min ago |
| `SYN-ENT-0172` | Cluster | 92 | 173.6 | 68.4 | MEDIUM | 24 min ago |
| `SYN-NET-0042` | Network Observation | 61 | — | 54.1 | LOW | 31 min ago |

### Entity Detail

Display:

#### Overview

- Entity ID
- Type
- Review score
- Risk level
- Transaction count
- Total volume
- First seen
- Last seen

#### Activity

Use Recharts to show synthetic activity over time.

#### Relationships

Use React Flow to display connected:

- Transactions
- Entities
- Network observations

#### Risk Factors

Display the strongest contributing signals.

#### Related Alerts

Display alerts associated with the entity.

## Model Intelligence

The Model page describes the trained pipeline and its outputs.

### Isolation Forest

Purpose:

```text
Anomaly Detection
```

Display:

- Novelty signal
- Configuration
- Synthetic anomalies detected

### XGBoost

Purpose:

```text
Risk Classification
```

Display:

- Classifier probability
- Accuracy
- Precision
- Recall
- F1
- ROC-AUC

These values should represent the actual model artifacts where available.

### Model Performance

Use Recharts to display:

- Precision
- Recall
- F1
- ROC-AUC

### Feature Importance

Display important model features such as:

```text
Transaction Frequency
Amount Deviation
Graph Reach
Temporal Relationship
IP Anomaly
Geographic Inconsistency
Transaction Burstiness
```

Feature importance should be treated as model information rather than frontend-calculated values.

### Model Pipeline

```text
Synthetic Dataset
       |
       v
Feature Extraction
       |
       v
Isolation Forest
       |
       v
XGBoost
       |
       v
Review Score
       |
       v
Explainable Alert
       |
       v
Investigation
```

## Dataset

The Dataset page represents the offline synthetic dataset and generated artifacts.

### Dataset Summary

Display:

| Field | Value |
|---|---|
| Dataset | `sih26146-synthetic-60000-v2` |
| Events | `60,000` |
| Labelled Anomalies | `2,000` |
| Timeline | `30 days` |
| Dataset Seed | `2026` |
| Processing | Offline |
| Mode | Synthetic |

### Dataset Files

The frontend should represent the actual TraceGraph AI artifact structure.

| File | Purpose |
|---|---|
| `events.csv` | Synthetic Bitcoin/IP metadata events |
| `labels.csv` | Evaluator-only anomaly labels |
| `alerts.json` | Ranked synthetic review queue |
| `evidence.json` | Per-alert TreeSHAP evidence |
| `model_card.json` | Dataset/model provenance and metrics |
| `metrics_*.json` | Frozen evaluation metrics |

> `labels.csv` is evaluator-only ground truth. It should not be presented as investigator-facing evidence.

The frontend does not need the actual files to exist for the prototype. It may use centralized local mock data representing their contents.

## Demo Scenarios

The frontend should support controlled synthetic scenarios based on the generator.

```text
normal
structuring
peel_chain
rapid_hop
fan_out
fan_in
ip_rotation
source_port_shift
```

A demo control can allow the user to select a scenario.

Example:

```text
DEMO SCENARIO

Rapid Hop

Rapid consecutive synthetic transfers
with short temporal gaps and multiple
connected synthetic entities.

[ LOAD SCENARIO ]
```

The scenario should update the displayed synthetic alerts, review score, explanation and graph.

## Normal vs Anomaly Demo

### Normal

```text
Stable transaction frequency
Stable relationships
Stable synthetic network observations
Lower review score
```

### Rapid Hop

```text
High transaction frequency
Short temporal gaps
Multiple connected entities
Higher review score
```

### Fan Out

```text
One synthetic source
Many synthetic destinations
High connectivity
Higher review score
```

### IP Rotation

```text
Repeated synthetic network changes
Unusual network relationship pattern
Higher review score
```

These scenarios are controlled synthetic demonstrations.

## Synthetic Identifiers

All identifiers must be clearly synthetic.

```text
SYN-TX-8F21A9C2
SYN-WAL-0192
SYN-ENT-72A1
SYN-NET-0042
SYN-IP-0042
SYN-ASN-018
```

Synthetic Bitcoin-style addresses may be represented as:

```text
SYN-bc1q...8f21
```

Do not use actual Bitcoin transaction hashes, wallets or IP addresses.

## Review Score

The frontend displays the backend-generated review priority score.

The backend combines:

| Signal | Weight |
|---|---:|
| XGBoost classifier probability | 75% |
| Isolation Forest novelty | 15% |
| Graph reach proxy | 10% |

The resulting score is presented as:

```text
0–100 Review Priority Score
```

> The review score is a synthetic prioritization signal. It is not a probability of fraud, criminal activity or real-world risk.

The frontend must not recalculate the score.

## Explainability Contract

Every high-priority synthetic alert should be explainable through:

```text
Overall Review Score
        +
Isolation Forest Novelty
        +
XGBoost Probability
        +
Graph Reach Proxy
        +
TreeSHAP Contributions
        +
Risk Factors
        +
Related Entities
```

The frontend should display the model's existing evidence.

It must not:

- Generate SHAP values
- Recalculate model probabilities
- Recalculate the review score
- Infer criminal activity
- Create identity matches
- Create real-world risk classifications

## Human-in-the-Loop

The intended workflow is:

```text
AI Detection
      |
      v
Review Signal
      |
      v
AI Explanation
      |
      v
Relationship Analysis
      |
      v
Human Investigation
      |
      v
Human Review
      |
      v
Human Decision
```

The UI should communicate:

```text
AI → Review Signal → Human Decision
```

and never:

```text
AI → Criminal
```

## Frontend Interactions

| Interaction | Behaviour |
|---|---|
| Sidebar navigation | Navigate between pages |
| Alert search | Filter synthetic alerts |
| Alert filters | Filter by local mock data |
| Investigate | Open investigation |
| Mark Reviewed | Update local alert state |
| Escalate | Update local review state |
| Transaction search | Filter transactions |
| Transaction selection | Open transaction detail |
| Entity search | Filter entities |
| Entity selection | Open entity detail |
| Graph node selection | Display node information |
| Graph edge selection | Display relationship information |
| Demo scenario | Load controlled synthetic data |
| Export Report | Generate a simple local report where practical |
| Settings | Store frontend-only preferences |

## Data Architecture

Mock data should be centralized.

```text
src/
├── data/
│   ├── alerts.ts
│   ├── transactions.ts
│   ├── entities.ts
│   ├── model.ts
│   ├── dataset.ts
│   └── scenarios.ts
```

Avoid scattering large arrays throughout page components.

The frontend should treat these files as mock representations of backend outputs.

## Routes

```text
/
├── /alerts
├── /investigation
├── /investigation/[id]
├── /transactions
├── /transactions/[id]
├── /entities
├── /entities/[id]
├── /model
├── /dataset
├── /demo
└── /settings
```

## Component Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── alerts/
│   ├── investigation/
│   ├── transactions/
│   ├── entities/
│   ├── model/
│   ├── dataset/
│   ├── demo/
│   └── settings/
│
├── components/
│   ├── layout/
│   ├── dashboard/
│   ├── alerts/
│   ├── investigation/
│   ├── transactions/
│   ├── entities/
│   ├── model/
│   ├── dataset/
│   ├── demo/
│   └── ui/
│
├── data/
│   ├── alerts.ts
│   ├── transactions.ts
│   ├── entities.ts
│   ├── model.ts
│   ├── dataset.ts
│   └── scenarios.ts
│
└── lib/
    └── utils.ts
```

The existing project structure may be retained where equivalent.

## Design System

The frontend should use a dark cybersecurity/SOC visual language.

### Palette

| Purpose | Color |
|---|---|
| Background | `#090B0F` |
| Sidebar | `#0D1015` |
| Cards | `#11151B` |
| Elevated Cards | `#151A21` |
| Borders | `#252B34` |
| Primary Text | `#E7EAF0` |
| Secondary Text | `#8B95A5` |
| Muted Text | `#5F6978` |
| Primary Accent | `#3B82F6` |
| Cyan Accent | `#22D3EE` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| High Risk | `#EF4444` |
| Model Accent | `#8B5CF6` |

Use color sparingly.

```text
RED    → HIGH RISK / CRITICAL
AMBER  → MEDIUM RISK / WARNING
GREEN  → NORMAL / HEALTHY
BLUE   → NAVIGATION / ANALYTICS
CYAN   → ANALYTICAL INFORMATION
PURPLE → MODEL INFORMATION
```

## Visual Rules

Use:

- Dark backgrounds
- 1px borders
- Small corner radii
- Restrained shadows
- Compact badges
- Clear tables
- Consistent spacing
- Subtle hover states
- Monospace text for IDs
- Subtle transitions

Avoid:

- Generic SaaS styling
- Cryptocurrency trading UI
- Neon hacker aesthetics
- Excessive gradients
- Glassmorphism
- Floating blobs
- Large decorative illustrations
- Excessive animation

The application should feel like an internal intelligence tool rather than a marketing website.

## Page Density

Different pages should serve different purposes.

| Page | Information Density |
|---|---|
| Dashboard | Overview and visual monitoring |
| Alerts | Dense review queue |
| Investigation | Analytical workspace |
| Transactions | Data explorer |
| Entities | Entity intelligence |
| Model | Model analytics |
| Dataset | Artifact/data explorer |
| Demo | Presentation-focused scenario workflow |
| Settings | Simple configuration |

Do not turn every page into the same collection of metric cards.

## Responsive Design

The application should support:

- Desktop
- Laptop
- Tablet
- Mobile

At smaller widths:

- Sidebar becomes a drawer
- Cards stack
- Charts resize
- Tables scroll within their containers
- Investigation sections become vertical
- Graph receives adequate height
- Filters wrap
- No page-level horizontal overflow

## Accessibility

Use:

- Semantic buttons
- Accessible labels
- Keyboard-friendly controls
- Visible focus states
- Sufficient contrast
- Tooltips for ambiguous icons

Do not rely on color alone for severity.

Example:

```text
● HIGH
```

must include the text label as well as the visual indicator.

## Empty and Error States

Provide appropriate states for:

```text
No alerts found
No transactions match filters
No entities match filters
No related entities
No investigation selected
Dataset unavailable
Graph loading
```

Keep loading states subtle.

## Technology Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- React Flow
- Lucide React

### Backend / ML

- Python
- Isolation Forest
- XGBoost
- TreeSHAP
- Synthetic data generation
- Time-safe feature extraction

## What the Frontend Does Not Build

The frontend prototype does not implement:

- Real Bitcoin blockchain connections
- Real wallet connections
- Real wallet tracking
- Real IP intelligence
- Real IP geolocation
- Identity resolution
- Real-time blockchain ingestion
- Cryptocurrency prices
- Trading
- Wallet management
- Authentication
- User registration
- Payments
- Cloud infrastructure
- Database systems
- External AI APIs
- Frontend ML inference
- Automated enforcement
- Real-world criminal attribution

The frontend is a presentation and interaction layer for TraceGraph AI's synthetic/offline outputs.

## Authoritative Backend Artifacts

The frontend should align with the repository's generated artifacts:

```text
data/generated/
└── sih26146-synthetic-60000-v2/
    ├── events.csv
    └── truth/
        └── labels.csv

artifacts/runs/
└── sih26146-cpu-demo-2026-v1/
    ├── model_card.json
    ├── metrics_*.json
    ├── alerts.json
    ├── evidence.json
    └── artifacts/
```

The frontend should represent these artifacts rather than inventing a different production data model.

## Dashboard → Investigation Flow

The primary demonstration path is:

```text
Dashboard
    |
    v
Priority Alert
    |
    v
Investigation
    |
    +--> Review Score
    |
    +--> Why Was This Flagged?
    |
    +--> Feature Contributions
    |
    +--> Risk Factors
    |
    v
Relationship Graph
    |
    v
Related Entity / Transaction
    |
    v
Human Review
```

## Model → Frontend Contract

The backend/model pipeline is responsible for:

```text
Data Validation
      |
      v
Feature Extraction
      |
      v
Model Training / Inference
      |
      v
Risk Score
      |
      v
Alert Ranking
      |
      v
Alert Reasons
      |
      v
Graph Data
```

The frontend is responsible for:

```text
Dashboard UI/UX
      |
      v
Alert Screens
      |
      v
Explainability
      |
      v
Graph Visualization
      |
      v
Normal vs Anomaly Demo
      |
      v
Presentation
```

The frontend should consume and visualize these outputs without reproducing backend logic.

## Project Constraints

TraceGraph AI remains:

```text
CPU-only
Offline
Synthetic-data-only
Time-safe
Explainable
Human-in-the-loop
```

The system does not support real-world identity resolution, real-world attribution or automated enforcement.

## Quality Requirements

The frontend should provide:

- Working routes
- Working sidebar navigation
- Functional alert investigation
- Functional search and filtering
- Functional transaction exploration
- Functional entity exploration
- Functional React Flow graph
- Functional demo scenarios
- Responsive layouts
- Centralized mock data
- No broken imports
- No missing components
- No placeholder pages
- No dead primary actions
- No page-level horizontal overflow
- No unnecessary backend implementation

## Final Goal

TraceGraph AI should present a coherent investigation experience:

```text
DETECTION
    ↓
ALERT
    ↓
EXPLANATION
    ↓
INVESTIGATION
    ↓
GRAPH ANALYSIS
    ↓
HUMAN REVIEW
```

The final frontend should look like a professional cybersecurity and transaction-intelligence prototype while remaining faithful to the project's actual **offline, CPU-only, synthetic-data-only** architecture.

> **Disclaimer.** TraceGraph AI is a synthetic offline research and demonstration system. Its review scores, model outputs, relationships and alerts describe controlled synthetic patterns only. They must not be interpreted as evidence of real-world fraud, criminal activity, identity, financial wrongdoing or other real-world attribution.
