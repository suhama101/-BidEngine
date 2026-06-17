import { analyzeWithGroq } from '../groqClient.js';

export async function auditCompliance(requirement, capabilities) {
    const systemPrompt = `You are a Senior Compliance Auditor. Your job is to strictly evaluate if our corporate capabilities satisfy a specific RFP requirement.
Analyze the requirement against the available evidence.
Return a JSON object:
{
  "compliance_status": "pass" | "fail" | "partial",
  "confidence": number (0-100),
  "evidence": "Brief summary of the best matching evidence",
  "reasoning": "Detailed explanation of why we pass or fail",
  "matched_capability_id": "id of the best match"
}`;

    const userPrompt = `Requirement: ${requirement.requirement_text}
Capabilities: ${JSON.stringify(capabilities.slice(0, 10))}

Audit our compliance for this requirement.`;

    return analyzeWithGroq(userPrompt, systemPrompt);
}
