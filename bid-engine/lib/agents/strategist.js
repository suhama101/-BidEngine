import { analyzeWithGroq } from '../groqClient.js';

export async function strategizeEvidence(analysis, capabilities = []) {
    const systemPrompt = `You are a Proposal Strategist. Your job is to select the BEST evidence from the capability library to satisfy the Requirement Analysis.
Evaluate each capability based on:
1. Relevance to the Primary Goal.
2. Directness of the Proof (Did we do exactly what is asked?).
3. Recentness and Scale.

Return a JSON object:
{
  "primary_evidence_id": "...",
  "supporting_evidence_ids": ["...", "..."],
  "strategy_notes": "How we will position the evidence to win.",
  "gaps_found": ["What is still missing?"]
}`;

    const userPrompt = `Requirement Analysis: ${JSON.stringify(analysis)}
Available Capabilities: ${JSON.stringify(capabilities.slice(0, 15))}

Select the best evidence for this requirement.`;

    return analyzeWithGroq(userPrompt, systemPrompt);
}
