/**
 * BidEngine AI — Semantic RAG Retriever
 * 
 * This is the central Retrieval-Augmented Generation (RAG) pipeline.
 * It replaces the old keyword-based `matchRequirementToCapabilities` with
 * a real vector retrieval + LLM reranking pipeline.
 * 
 * Full Pipeline:
 *   1. EMBED:     Requirement text → Dense Vector (TF-IDF 768-dim)
 *   2. RETRIEVE:  Vector → Cosine Similarity Search → Top-K candidates
 *   3. RERANK:    Candidates → LLM Cross-Encoder Reranker → Ranked Evidence
 *   4. FORMAT:    Ranked Evidence → Structured compliance result
 * 
 * This architecture follows the standard RAG pattern used by:
 *   - Pinecone + Cohere Rerank
 *   - ChromaDB + LangChain
 *   - pgvector + custom retriever
 */

import { getOrBuildIndex, semanticSearch } from './vectorStore.js';
import { rerankEvidence } from './agents/reranker.js';
import { resetVectorizer } from './embeddingService.js';

/**
 * Build the vector index for a set of capabilities.
 * Should be called once per workspace/user session.
 */
export async function buildCapabilityIndex(capabilities, userId = 'sample') {
    resetVectorizer(); // Reset so it re-fits on the new corpus
    return getOrBuildIndex(userId, capabilities);
}

/**
 * Full RAG Retrieval Pipeline for a single requirement.
 * 
 * @param {object} requirement - The RFP requirement to match
 * @param {Array} capabilities - The full capability library
 * @param {string} userId - Cache key for the index
 * @param {object} options - Additional options
 * @returns {Promise<object>} - Compliance match result with evidence
 */
export async function retrieveAndMatch(requirement, capabilities, userId = 'sample', options = {}) {
    const requirementText = requirement.requirement_text || requirement.description || '';
    if (!requirementText) {
        return {
            compliance_status: 'fail',
            confidence: 0,
            evidence: 'No requirement text provided.',
            reasoning: 'Empty requirement cannot be matched.',
            retrieval_method: 'none',
            retrieved_chunks: [],
        };
    }

    // Step 1+2: Build/Get Index & Semantic Search
    const index = await getOrBuildIndex(userId, capabilities);
    const topK = Math.min(options.topK || 5, capabilities.length);
    const retrieved = await semanticSearch(requirementText, index, topK);

    if (retrieved.length === 0) {
        return {
            compliance_status: 'fail',
            confidence: 0,
            evidence: 'No semantically similar capabilities found.',
            reasoning: 'Vector search returned zero results above threshold.',
            retrieval_method: 'vector_search',
            retrieved_chunks: [],
        };
    }

    // Step 3: LLM Reranking (Cross-Encoder)
    let rankedEvidence;
    try {
        if (!options.skipRerank && retrieved.length > 1) {
            rankedEvidence = await rerankEvidence(requirementText, retrieved);
        } else {
            rankedEvidence = retrieved;
        }
    } catch (err) {
        console.error('[SemanticRetriever] Reranking failed, using vector order:', err.message);
        rankedEvidence = retrieved;
    }

    // Step 4: Format the result
    const best = rankedEvidence[0];
    const bestScore = best.rerank_score || (best.score * 100);
    const status = bestScore < 25 ? 'fail' : bestScore >= 55 ? 'pass' : 'partial';

    // Find the full capability record for the best match
    const bestCapability = capabilities.find(c =>
        (c.external_id || c.id) === best.id
    ) || { project_name: best.metadata?.project_name || 'Unknown' };

    return {
        compliance_status: status,
        confidence: Math.round(bestScore),
        evidence: `${best.id}: ${bestCapability.description || bestCapability.project_summary || bestCapability.project_name}`,
        reasoning: `Semantic vector search (cosine similarity: ${best.score.toFixed(3)}) identified "${bestCapability.project_name}" as the strongest evidence match. ${rankedEvidence[0]?.reranked ? 'LLM reranker confirmed this ranking.' : ''} Certifications: ${bestCapability.certification || (bestCapability.certifications || []).join(', ') || 'N/A'}.`,
        retrieval_method: 'vector_search_with_rerank',
        capability: bestCapability,
        retrieved_chunks: rankedEvidence.slice(0, 3).map(r => ({
            id: r.id,
            score: r.score,
            rerank_score: r.rerank_score,
            text: r.text?.slice(0, 200),
        })),
    };
}

/**
 * Batch RAG retrieval for multiple requirements.
 * Builds the index once and queries it for each requirement.
 */
export async function retrieveAndMatchBatch(requirements, capabilities, userId = 'sample', options = {}) {
    // Build index once
    await buildCapabilityIndex(capabilities, userId);

    // Run retrieval for each requirement (with concurrency limit)
    const results = [];
    const batchSize = options.concurrency || 3;

    for (let i = 0; i < requirements.length; i += batchSize) {
        const batch = requirements.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(req => retrieveAndMatch(req, capabilities, userId, options))
        );
        results.push(...batchResults);
    }

    return results;
}
