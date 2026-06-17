/**
 * BidEngine AI — In-Memory Vector Store with Cosine Similarity
 * 
 * This implements a REAL vector database using dense embeddings.
 * Architecture:
 *   Document → Embedding Model → Vector → Cosine Similarity Search → Top-K Retrieval
 * 
 * We use an in-process vector index because:
 *   1. The capability library is <100 documents (no need for external DB overhead)
 *   2. Embeddings are generated once and cached per session
 *   3. Cosine similarity on 768-dim vectors is O(n) and takes <1ms for n<1000
 * 
 * This is architecturally equivalent to FAISS IndexFlatIP for small corpora.
 */

import { generateEmbedding, generateEmbeddings } from './embeddingService.js';

// ── In-Memory Vector Index ──────────────────────────────────────────────────

class VectorIndex {
    constructor() {
        /** @type {Array<{id: string, vector: number[], metadata: object, text: string}>} */
        this.documents = [];
        this.dimension = null;
    }

    /**
     * Add a document with its embedding vector to the index.
     */
    addDocument(id, vector, text, metadata = {}) {
        if (!this.dimension) this.dimension = vector.length;
        if (vector.length !== this.dimension) {
            throw new Error(`Dimension mismatch: expected ${this.dimension}, got ${vector.length}`);
        }
        // Upsert: replace if exists
        const existingIdx = this.documents.findIndex(d => d.id === id);
        const doc = { id, vector, text, metadata };
        if (existingIdx >= 0) {
            this.documents[existingIdx] = doc;
        } else {
            this.documents.push(doc);
        }
    }

    /**
     * Cosine Similarity: dot(A, B) / (||A|| * ||B||)
     */
    static cosineSimilarity(a, b) {
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
    }

    /**
     * Perform semantic similarity search.
     * Returns top-K documents ranked by cosine similarity.
     * 
     * @param {number[]} queryVector - The embedding of the search query
     * @param {number} topK - Number of results to return
     * @param {number} threshold - Minimum similarity score (0-1)
     * @returns {Array<{id: string, score: number, text: string, metadata: object}>}
     */
    search(queryVector, topK = 5, threshold = 0.0) {
        if (this.documents.length === 0) return [];

        const scored = this.documents.map(doc => ({
            id: doc.id,
            score: VectorIndex.cosineSimilarity(queryVector, doc.vector),
            text: doc.text,
            metadata: doc.metadata,
        }));

        return scored
            .filter(item => item.score >= threshold)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    get size() {
        return this.documents.length;
    }
}

// ── Singleton Index Cache ───────────────────────────────────────────────────
// We maintain one global index per capability set to avoid re-embedding on every request.

/** @type {Map<string, VectorIndex>} */
const indexCache = new Map();

/**
 * Build or retrieve a vector index for the given capabilities.
 * Capabilities are chunked into text, embedded, and stored.
 * 
 * @param {string} indexKey - Cache key (e.g., user ID or "sample")
 * @param {Array<object>} capabilities - Capability library records
 * @returns {Promise<VectorIndex>}
 */
export async function getOrBuildIndex(indexKey, capabilities) {
    // Return cached index if capabilities haven't changed
    if (indexCache.has(indexKey)) {
        const cached = indexCache.get(indexKey);
        if (cached.size === capabilities.length) {
            return cached;
        }
    }

    console.log(`[VectorStore] Building new index for "${indexKey}" with ${capabilities.length} documents...`);
    const index = new VectorIndex();

    // Convert capabilities into rich text chunks for embedding
    const texts = capabilities.map(cap => {
        return [
            cap.project_name || '',
            cap.description || cap.project_summary || '',
            `Domain: ${cap.domain || 'General'}`,
            `Skills: ${(cap.skills || []).join(', ')}`,
            `Certifications: ${(cap.certifications || []).join(', ') || cap.certification || 'N/A'}`,
            `Client: ${cap.client_type || 'N/A'}`,
            `Year: ${cap.year_completed || 'N/A'}`,
        ].filter(Boolean).join('. ');
    });

    // Generate embeddings in batch
    const vectors = await generateEmbeddings(texts);

    // Index each capability
    for (let i = 0; i < capabilities.length; i++) {
        const cap = capabilities[i];
        const id = cap.external_id || cap.id || `CAP-${i}`;
        index.addDocument(id, vectors[i], texts[i], {
            project_name: cap.project_name,
            domain: cap.domain,
            certification: cap.certification,
            client_type: cap.client_type,
            skills: cap.skills,
            description: cap.description || cap.project_summary,
        });
    }

    indexCache.set(indexKey, index);
    console.log(`[VectorStore] Index built: ${index.size} documents, ${index.dimension}-dim vectors`);
    return index;
}

/**
 * Semantic Retrieval: Find the most relevant capabilities for a given requirement.
 * 
 * Pipeline:
 *   Requirement Text → Embedding → Cosine Similarity Search → Top-K Evidence
 * 
 * @param {string} requirementText - The requirement to match against
 * @param {VectorIndex} index - The pre-built vector index
 * @param {number} topK - Number of results
 * @returns {Promise<Array<{id: string, score: number, text: string, metadata: object}>>}
 */
export async function semanticSearch(requirementText, index, topK = 5) {
    const queryVector = await generateEmbedding(requirementText);
    const results = index.search(queryVector, topK, 0.15);

    console.log(`[VectorStore] Semantic search for "${requirementText.slice(0, 60)}..." → ${results.length} results (top score: ${results[0]?.score?.toFixed(3) || 'N/A'})`);
    return results;
}

/**
 * Clear all cached indices.
 */
export function clearIndexCache() {
    indexCache.clear();
}

export { VectorIndex };
