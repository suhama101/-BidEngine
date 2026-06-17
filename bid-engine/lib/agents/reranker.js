import { analyzeWithGroq } from '../groqClient.js';

/**
 * Reranker Agent — LLM-powered Cross-Encoder Reranking
 * 
 * After initial vector retrieval returns top-K candidates,
 * this agent uses an LLM to re-score and reorder them
 * based on deep semantic understanding.
 * 
 * This is equivalent to a Cross-Encoder reranker (e.g., Cohere Rerank, 
 * BGE-reranker) but uses Groq's LLM for zero-cost inference.
 * 
 * Pipeline Position:
 *   Query → Vector Search (Retriever) → TOP-K → RERANKER → Final Ranked Evidence
 */
export async function rerankEvidence(requirementText, candidates) {
    if (!candidates || candidates.length === 0) return [];
    if (candidates.length === 1) return candidates;

    const systemPrompt = `You are a Precision Reranking Agent. Your job is to reorder a list of evidence candidates based on their TRUE relevance to a specific RFP requirement.

For each candidate, evaluate:
1. Direct Relevance: Does the evidence directly prove we can meet this requirement?
2. Certification Match: Do the certifications cover what is being asked?
3. Scale & Recency: Is this evidence recent and at appropriate scale?

Return a JSON object:
{
  "ranked_ids": ["id1", "id2", ...],
  "scores": {"id1": 95, "id2": 82, ...},
  "reasoning": "Brief explanation of top pick"
}

IMPORTANT: ranked_ids must contain ONLY IDs from the provided candidates. Do not invent IDs.`;

    const candidateSummaries = candidates.map(c => ({
        id: c.id,
        similarity_score: (c.score * 100).toFixed(1),
        text: c.text?.slice(0, 300),
    }));

    const userPrompt = `REQUIREMENT: ${requirementText}

RETRIEVED CANDIDATES (from vector search):
${JSON.stringify(candidateSummaries, null, 2)}

Rerank these candidates by TRUE relevance to the requirement.`;

    try {
        const result = await analyzeWithGroq(userPrompt, systemPrompt);

        if (result.ranked_ids && Array.isArray(result.ranked_ids)) {
            // Rebuild the candidates array in the reranked order
            const reranked = [];
            for (const id of result.ranked_ids) {
                const candidate = candidates.find(c => c.id === id);
                if (candidate) {
                    reranked.push({
                        ...candidate,
                        rerank_score: result.scores?.[id] || candidate.score * 100,
                        reranked: true,
                    });
                }
            }
            // Add any candidates that weren't in the reranked list
            for (const c of candidates) {
                if (!reranked.find(r => r.id === c.id)) {
                    reranked.push({ ...c, rerank_score: 0, reranked: false });
                }
            }
            console.log(`[Reranker] Reranked ${reranked.length} candidates. Top: ${reranked[0]?.id} (score: ${reranked[0]?.rerank_score})`);
            return reranked;
        }

        return candidates;
    } catch (err) {
        console.error('[Reranker] LLM reranking failed, using vector scores:', err.message);
        return candidates;
    }
}
