import { analyzeWithGroq } from '../groqClient.js';

export async function consultOnBid(scores, requirements, history) {
    const systemPrompt = `You are a Senior Bid Strategy Consultant. Your job is to provide a GO/NO-GO recommendation for a multi-million dollar RFP.
Analyze the win scores, technical gaps, and historical win rates.
Return a JSON object:
{
  "recommendation": "GO" | "NO-GO",
  "confidence_in_recommendation": number (0-100),
  "key_strengths": ["...", "..."],
  "critical_risks": ["...", "..."],
  "strategic_advice": "How to proceed if GO, or why to pivot if NO-GO."
}`;

    const userPrompt = `Win Scores: ${JSON.stringify(scores)}
Requirement Summary: ${JSON.stringify(requirements.slice(0, 10))}
Historical Win Rate: ${JSON.stringify(history.length ? (history.filter(h => h.outcome === 'win').length / history.length * 100).toFixed(1) + '%' : 'N/A')}

Provide your strategic consultation.`;

    return analyzeWithGroq(userPrompt, systemPrompt);
}
