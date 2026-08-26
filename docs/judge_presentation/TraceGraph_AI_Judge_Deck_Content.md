# TraceGraph AI — Judge Presentation Content
## 10 Slides | 6–8 Minute Presentation

### Slide 1 — TraceGraph AI

**Headline:** From raw transaction records to explainable review priorities.

**Subheadline:** SIH26146 | Offline | Synthetic-only | CPU-trained | Human-in-the-loop.

**Visual:** Dark canvas with a simple connected wallet/IP graph. Use an accent ring around one high-priority synthetic node.

**Speaker note:** “TraceGraph AI is an offline investigation simulator that turns thousands of synthetic Bitcoin/IP traffic records into visual, explainable cases for human review.”

### Slide 2 — The Investigation Gap

**Headline:** A single transaction rarely tells the full story.

**Three visual statements:** “Thousands of records,” “Relationships are hidden in rows,” and “Investigators need evidence, not another black-box score.”

**Visual:** Raw CSV rows on left transform into a clean alert card and graph on right.

**Speaker note:** “The challenge is not reading one transfer. It is seeing timing, many destinations, IP rotation, and wallet relationships together.”

### Slide 3 — The Difference: Not Just a Model

**Headline:** TraceGraph AI is an explainable investigation workflow.

**Visual:** Four blocks: Synthetic input → Behaviour + relationship features → Hybrid AI → Explainable human review.

**Proof points:** Rules baseline; Isolation Forest novelty; XGBoost probability; native TreeSHAP evidence; visual relationship trail.

**Speaker note:** “The model is the brain, but the product is the full workflow: identify, explain, visualize, and let the reviewer decide.”

### Slide 4 — Safe, Controlled Synthetic Training

**Headline:** Synthetic data makes the prototype safe, labelled, repeatable, and testable.

**Visual:** Shield around the words “No real wallets,” “No real IPs,” “No identity inference,” “No external network.”

**Metrics:** 60,000 synthetic events; 2,000 labelled anomalies; 8 scenario families; seed 2026.

**Speaker note:** “Synthetic data is deliberate. It allows us to test known scenarios without exposing sensitive information or pretending to make real-world accusations.”

### Slide 5 — What the AI Actually Looks At

**Headline:** We score behaviour, not one transaction in isolation.

**Visual:** 18-feature wheel with five highlighted: timing, destination count, IP rotation, relationship degree, graph reach.

**Normal card:** Stable IP / one receiver / normal gap → 12/100.

**Unusual card:** Fast hops / many receivers / IP rotation → 88/100.

**Speaker note:** “The same amount can be low risk in a normal context and high priority in a fast-changing pattern. Context is the difference.”

### Slide 6 — Hybrid AI + Explainability

**Headline:** Three signals create one transparent review score.

**Visual:** Formula: 75% XGBoost probability + 15% novelty score + 10% graph-risk proxy = 0–100 synthetic review score.

**Callout:** “Every queued alert carries five evidence records.”

**Speaker note:** “Rules explain obvious patterns. Isolation Forest finds unusual behaviour. XGBoost learns labelled scenarios. We show the reason instead of asking the reviewer to trust a number.”

### Slide 7 — The Visual Demo: Normal vs Synthetic Anomaly

**Headline:** Let judges see the difference in 15 seconds.

**Visual:** Split screen:

| Normal synthetic record | Rapid-hop / IP-rotation synthetic pattern |
|---|---|
| Low risk 12/100 | High priority 88/100 |
| Stable IP and limited connections | Many destinations, fast timing, IP rotation |
| Small simple graph | Dense directed relationship trail |

**Speaker note:** “We do not call a single row suspicious. The right panel becomes high priority because the behaviour changes across time and connections.”

### Slide 8 — End-to-End Demo Flow

**Headline:** A judge can follow the whole decision in four clicks.

**Visual:** 1 Load approved synthetic scenario → 2 Alert queue → 3 Evidence and graph → 4 Reviewer decision.

**Speaker note:** “For a reliable hackathon demo, we use prepared scenarios, not random live input. The result is deterministic and reproducible.”

### Slide 9 — Evidence from the Completed CPU Run

**Headline:** The pipeline has been trained, tested, and saved locally.

**Visual:** Metric cards: PR-AUC 0.999962; F1 0.991150; 250 ranked alerts; 1,250 evidence records; CPU only.

**Required footnote:** “Metrics are from a held-out controlled synthetic benchmark; they are not real-world deployment claims.”

**Speaker note:** “The important proof is not a large number alone. It is that the fixture, models, metrics, alerts, evidence, and run artifacts are reproducible offline.”

### Slide 10 — Why TraceGraph AI Matters

**Headline:** From a black-box score to an investigator-ready visual trail.

**Visual:** Three closing pillars: Explainable, Offline + Synthetic-safe, Human in control.

**Closing line:** “TraceGraph AI prioritizes synthetic behaviour patterns, shows why they matter, and keeps the reviewer—not the model—in charge.”

## Design Direction

Use a midnight-blue background, electric cyan for trusted/normal connections, amber for review priority, and restrained coral for high-priority synthetic anomalies. Use Inter or IBM Plex Sans. Keep each slide to one message, one visual, and no more than 25–35 visible words. Do not include generic stock imagery, fake testimonials, or any real crypto/IP data.
