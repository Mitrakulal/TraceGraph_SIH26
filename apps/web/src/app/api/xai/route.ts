import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();
    
    // Construct the LLM system prompt with the context
    const systemPrompt = `You are an expert Anti-Money Laundering (AML) Compliance AI Investigator Copilot. 
Your job is to chat with an analyst and help them investigate a specific cryptocurrency alert.

CRITICAL INSTRUCTIONS FOR YOUR OUTPUT:
1. Keep answers EXTREMELY short, punchy, and impactful.
2. DO NOT write long introductory sentences (e.g., "Excellent question..."). Get straight to the point.
3. Use bullet points heavily for readability.
4. Keep paragraphs to 1-2 sentences max.
5. Use markdown bolding to highlight key risk factors or anomalies.

Here is the live data context for the alert the analyst is currently looking at:

[ALERT CONTEXT]
- Alert ID: ${context?.alertId || 'Unknown'}
- Primary Wallet: ${context?.sourceWallet || 'Unknown'}
- ML Risk Score: ${context?.riskScore || 'Unknown'}/100
- Review State: ${context?.reviewState || 'Unknown'}
- XGBoost Probability: ${context?.mlProbability || 'Unknown'}
- Graph Reach Proxy: ${context?.graphRiskScore || 'Unknown'}

[GRAPH TOPOLOGY CONTEXT]
The user is viewing a graph with ${context?.graphSummary?.nodeCount || context?.graphNodes?.length || 0} nodes and ${context?.graphSummary?.edgeCount || context?.graphEdges?.length || 0} edges.
Key Nodes: ${context?.graphNodes ? JSON.stringify(context.graphNodes) : 'None provided'}
Edges (Relationships): ${context?.graphEdges ? JSON.stringify(context.graphEdges) : 'None provided'}

[SHAP FEATURE EVIDENCE]
Top Features contributing to the ML Risk Score:
${context?.evidence ? JSON.stringify(context.evidence.slice(0, 5)) : 'None provided'}

Answer the analyst's questions based ONLY on this context. If they ask to explain the graph, describe the topology (e.g. fragmentation, consolidation, hubs). If they ask why it was flagged, explain the ML Risk score and the top SHAP features.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [])
    ];

    const models = [
      "mimo-v2.5-free",
      "ling-3.0-flash-fin-free",
      "nemotron-3-ultra-free",
      "nemotron-3.5-lightning-free",
      "muse-spark-1.2-contributor-free"
    ];

    let reply = null;
    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENCODE_API_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages: apiMessages
          })
        });

        const data = await response.json();
        
        if (!response.ok || data.error) {
          throw new Error(data.error?.message || `API Error: Status ${response.status}`);
        }

        reply = data.choices?.[0]?.message?.content;
        if (reply) {
          console.log(`Successfully generated XAI response using model: ${model}`);
          break; // Stop trying if successful
        }
      } catch (err: any) {
        console.warn(`Model ${model} failed: ${err.message}. Trying next fallback...`);
        lastError = err;
      }
    }

    if (!reply) {
      throw new Error(`All fallback models failed due to rate limits or errors. Last error: ${lastError?.message || 'Unknown'}`);
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("XAI API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
