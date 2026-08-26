# TraceGraph AI — Judge Talking Points
## Exact Answers for Synthetic-Data, Model, and Demo Questions

> **Opening sentence to memorize:** “TraceGraph AI is not just a fraud score. It is an offline, explainable investigation workflow that turns synthetic Bitcoin/IP traffic into a ranked visual trail for human review.”

## 1. Core 30-Second Pitch

“Investigators can receive thousands of transaction and network metadata records, but a single record rarely tells the whole story. TraceGraph AI compares behaviour across time, wallet relationships, synthetic IP rotation, transaction velocity, and connection patterns. It ranks the cases that deserve review first, then shows the exact evidence behind each score. The current prototype uses strictly synthetic data, works offline, and keeps a human reviewer in control.”

## 2. The Synthetic-Data Question

### Judge asks: “Why did you use synthetic data? Is that not a weakness?”

**Answer:** “It is a deliberate design choice, not a shortcut. Real transaction and network-investigation data can be sensitive, incomplete, legally restricted, and difficult for students to access responsibly. Synthetic data lets us create labelled, repeatable normal and unusual behaviour while ensuring no real wallets, real IP addresses, identities, or financial activity are exposed. It lets us prove the technical workflow end to end: ingestion, graph behaviour, model scoring, explanation, and human review.”

**Follow immediately with:** “We do not claim that the synthetic metrics are real-world accuracy. They prove that the pipeline learns and detects the controlled patterns we generated. For deployment, the same data contract and evaluation process would require properly authorized, privacy-protected operational data.”

### Judge asks: “How do you know the AI is not memorizing the data?”

**Answer:** “We split the synthetic timeline chronologically: the first 60% is training, the next 20% validates operating choices, and the final 20% is held out for testing. The generator also uses independent scenario wallet groups across the splits. That prevents a future event from leaking into a past feature calculation and prevents the same scenario wallet group simply appearing again in testing.”

### Judge asks: “Why not use public blockchain data?”

**Answer:** “The SIH prototype focuses on a safe, offline, reproducible investigation workflow. Public transaction data alone also does not give authorized network/IP context, and it does not justify identity conclusions. We designed the system to be data-source agnostic at the contract level, but the submitted demonstration intentionally accepts synthetic-only data.”

## 3. The AI Question

### Judge asks: “Is this just a set of rules?”

**Answer:** “No. Rules are present only as an understandable baseline. The AI layer has two independent parts: Isolation Forest identifies behaviour that is unusual relative to benign training patterns, and XGBoost learns from labelled synthetic scenarios. The final score combines supervised probability, novelty, and relationship/graph evidence. We then expose model contributions for every alert rather than hiding behind a black-box label.”

### Judge asks: “Why use two models?”

**Answer:** “They answer different questions. XGBoost asks, ‘Does this look like one of the labelled synthetic anomaly patterns we trained on?’ Isolation Forest asks, ‘Is this behaviour unusual compared with normal activity even if it does not fit a known pattern perfectly?’ Combining them gives both known-pattern recognition and novelty detection.”

### Judge asks: “What exactly does the model look at?”

**Answer:** “It does not judge one transaction alone. It derives 18 behaviour features from chronological context: transfer amount and fee, timing between events, recent activity, number of destinations, IP rotation, fan-out, sender/receiver relationship counts, timing, and graph-reach proxy. That is why a simple normal transaction can score low while the same type of transaction inside a rapid-hop or high-IP-rotation pattern scores high.”

## 4. The Explainability Question

### Judge asks: “Why should an investigator trust this score?”

**Answer:** “They should not trust a score blindly. TraceGraph AI treats the score as a review priority. Each queued alert shows the risk score, model probability, novelty score, baseline-rule hits, graph context, and the five feature contributions that increased or decreased risk. The investigator can review or dismiss the synthetic alert. The AI prioritizes; it does not accuse or enforce.”

### Judge asks: “How do you explain a high score in one sentence?”

**Answer:** “For this synthetic alert, the score is high because the wallet changed IPs frequently, interacted with many destinations in a short time, and showed a rapid relationship pattern that differs from normal historical behaviour.”

## 5. The Metrics Question

### Judge asks: “Your metrics are very high. Are they realistic?”

**Answer:** “They are high because the test data is generated from the same controlled synthetic scenario families as training, with independent time periods and wallet groups. We present them honestly as synthetic benchmark results, not production claims. The value of this prototype is the proven offline pipeline, transparent evaluation process, and explainable demo. Real-world validation would require authorized data, domain experts, and external testing.”

### Judge asks: “What did the held-out test show?”

**Answer:** “On the held-out synthetic test partition, the model produced PR-AUC 0.999962 and F1 0.991150 at the selected operating threshold. The test partition contained 280 labelled synthetic anomalies. The demo run created 250 ranked alerts, each with five model-evidence records. These figures are shown with the synthetic-data limitation on the model screen.”

## 6. The Safety and Ethics Question

### Judge asks: “Can this identify a criminal or wallet owner?”

**Answer:** “No. It deliberately cannot. It contains only synthetic IDs and benchmark-range synthetic IP addresses. The product language is ‘synthetic anomaly’ and ‘review required,’ never identity, ownership, guilt, or enforcement. This is an analyst decision-support workflow, not an automated accusation system.”

### Judge asks: “What happens if the model is wrong?”

**Answer:** “A reviewer can dismiss the alert with a reason, record a note, and keep an audit trail. No automated action is triggered. False positives are visible through precision, false-positive rate, and the review workflow.”

## 7. Live Demo Narration

| Demo beat | Say this | Show this |
|---|---|---|
| Problem | “One transaction rarely tells us enough. Behaviour and relationships matter.” | Raw-record counter or simple transaction list. |
| Normal case | “This synthetic wallet has stable timing, one destination, and a stable IP pattern. It is low priority.” | Green/neutral card: risk 12/100. |
| Unusual case | “This synthetic case changes several behaviours at once: fast hops, many destinations, and IP rotation.” | High-priority card: risk 88/100. |
| Evidence | “This is not a black-box red flag. These are the exact features that raised the score.” | Top three evidence chips and contribution bars. |
| Graph | “The graph turns rows into an investigation trail.” | Wallet/IP/transaction nodes and directed edges. |
| Human control | “The system prioritizes. The reviewer decides.” | Review / dismiss / escalate controls. |
| Synthetic boundary | “All records are synthetic. The workflow is safe, repeatable, and offline.” | Persistent synthetic-data badge and run provenance. |

## 8. Sentences to Avoid

| Avoid saying | Say instead |
|---|---|
| “The model finds criminals.” | “The model ranks synthetic behaviour patterns for human review.” |
| “We have real accuracy of 99%.” | “We achieved these metrics on a held-out synthetic benchmark.” |
| “We track Bitcoin users.” | “We analyze synthetic transaction and network metadata in an offline prototype.” |
| “The AI automatically catches fraud.” | “The AI provides explainable review priorities; a human reviews each alert.” |

## 9. Strong Closing

“TraceGraph AI makes anomaly detection useful for an investigator. Instead of a black-box score, it gives a visual trail, shows the behaviour behind the score, and keeps the human decision maker in control—all while remaining offline and synthetic-only for a safe, reproducible SIH demonstration.”
