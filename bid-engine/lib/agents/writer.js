import { runBidCompletion } from '../groqClient.js';

export async function writeProposalResponse(requirement, analysis, strategy, evidenceList = [], options = {}) {
    const tone = options.tone || "professional and compliant";

    const systemPrompt = `You are a Lead Proposal Writer. Your job is to write a premium, high-scoring response to an RFP requirement.
Use the provided Requirement Analysis and Evidence Strategy to craft a compelling response.
Rules:
1. Be direct: Start with "We confirm..." or "Our solution provides..."
2. Be evidence-based: Specifically mention the projects and certifications provided in the Strategy.
3. Be persuasive: Highlight the benefits, not just the features.
4. Tone: ${tone}.
5. Use Markdown formatting.`;

    const userPrompt = `
Requirement: ${requirement.requirement_text}
Analysis: ${JSON.stringify(analysis)}
Strategy: ${JSON.stringify(strategy)}
Primary Evidence: ${JSON.stringify(evidenceList.find(e => (e.external_id || e.id) === strategy.primary_evidence_id) || "N/A")}
Supporting Evidence: ${JSON.stringify(evidenceList.filter(e => strategy.supporting_evidence_ids?.includes(e.external_id || e.id)))}

Write the full proposal response paragraph(s).`;

    return runBidCompletion(systemPrompt, userPrompt, 0.4);
}
