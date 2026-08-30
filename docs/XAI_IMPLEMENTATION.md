# Explainable AI (XAI) Implementation in TraceGraph

## Overview
TraceGraph utilizes highly accurate predictive Machine Learning models (IsolationForest, XGBoost) to detect anomalous and potentially illicit cryptocurrency transactions in real-time. However, predictive ML models are inherently "black boxes" — they output a raw risk score (e.g., `92/100`) without inherently explaining the reasoning behind that score.

To solve this and meet regulatory compliance requirements for model explainability, we have introduced the **Explainable AI (XAI) Module**, powered by Generative AI (LLMs).

## Role of XAI in TraceGraph
The role of the XAI module is to **translate raw predictive metrics into a human-readable compliance narrative**.

When an analyst identifies a high-risk transaction in the TraceGraph dashboard, they can click "✨ Generate AI Explanation". This triggers the XAI pipeline, which serves three critical roles:

1. **Interpretability:** It contextualizes the transaction's structural features (input/output counts, amount, fee) and explains how they contribute to the high risk score.
2. **Typology Identification:** By analyzing the graph topology metadata (e.g., high output count = fragmentation), the AI can suggest likely laundering typologies (such as peeling chains or mixing services).
3. **Automated SAR Generation:** In real-world AML (Anti-Money Laundering) compliance, investigators spend hours manually typing Suspicious Activity Reports (SARs). The XAI module acts as an "Investigator Copilot", automatically drafting a highly analytical and authoritative narrative that can be directly submitted to regulators.

## Technical Architecture

The XAI module bridges our React frontend and external LLM Providers via a secure Next.js API Route.

1. **Trigger:** The analyst clicks the "Generate AI Explanation" button on a specific transaction in the `TransactionsPage` modal.
2. **Context Assembly:** The frontend gathers all known metrics for that transaction (Event ID, Sender, Receiver, Amount, Fee, Model Risk Score, Input/Output fragmentation) and sends it to `/api/xai`.
3. **Prompt Engineering:** The Next.js API route (`apps/web/src/app/api/xai/route.ts`) constructs a highly specific system prompt. It instructs the LLM to act as an expert AML Compliance AI and provides the structured transaction data.
4. **LLM Inference:** The API securely forwards the prompt to an OpenAI-compatible LLM endpoint (e.g., `mimo-v2.5-free` via OpenCode AI) using a server-side API key, ensuring the key is never exposed to the client.
5. **Rendering:** The LLM streams back a Markdown-formatted narrative. The frontend uses `react-markdown` to render the narrative cleanly into the UI, complete with bolded risk factors and structured paragraphs.

## Future Enhancements
- **Graph Embeddings:** Currently, the XAI relies on basic input/output topology metrics. In the future, we can inject raw Neo4j sub-graph JSON directly into the LLM context window to allow the AI to reason over multi-hop relationships.
- **RAG (Retrieval-Augmented Generation):** By vectorizing historical Suspicious Activity Reports (SARs) and known wallet addresses, the XAI could cross-reference the current transaction with similar historical incidents to improve narrative accuracy.
