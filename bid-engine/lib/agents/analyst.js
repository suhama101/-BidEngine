import { analyzeWithGroq } from '../groqClient.js';

export async function analyzeRequirement(requirement, context = {}) {
    const systemPrompt = `You are a Senior RFP Analyst. Your job is to break down a specific RFP requirement into its core technical and functional components.
Identify:
1. Primary Goal: What is the main thing the client wants?
2. Critical Success Factors: What must be proved to "pass"?
3. Implied Risks: What could go wrong if this is not met?

Return a JSON object:
{
  "primary_goal": "...",
  "success_factors": ["...", "..."],
  "risks": ["...", "..."],
  "technical_keywords": ["...", "..."]
}`;

    const userPrompt = `Requirement: ${requirement.requirement_text}
Context: ${JSON.stringify(context)}

Analyze this requirement for a proposal response.`;

    return analyzeWithGroq(userPrompt, systemPrompt);
}
