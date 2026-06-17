import { analyzeRequirement } from './analyst.js';
import { strategizeEvidence } from './strategist.js';
import { writeProposalResponse } from './writer.js';

/**
 * Agentic RAG Coordinator
 * Orchestrates multiple specialized agents to generate a high-quality proposal response.
 */
export async function generateAgenticDraft(requirement, capabilities, context = {}) {
    console.log(`[Agentic RAG] Starting coordination for Req: ${requirement.id}`);

    // Phase 1: Deep Analysis
    console.log(`[Agentic RAG] Running Analyst...`);
    const analysis = await analyzeRequirement(requirement, context);

    // Phase 2: Evidence Strategy
    console.log(`[Agentic RAG] Running Strategist...`);
    const strategy = await strategizeEvidence(analysis, capabilities);

    // Phase 3: Final Draft Production
    console.log(`[Agentic RAG] Running Writer Agent...`);
    const content = await writeProposalResponse(requirement, analysis, strategy, capabilities, {
        tone: context.tone || "expert, confident, and highly technical"
    });

    console.log(`[Agentic RAG] Coordination complete.`);

    return {
        section_title: requirement.requirement_text?.slice(0, 80) || requirement.title || "Proposal Section",
        content: content,
        requirement_id: requirement.id,
        analysis,
        strategy
    };
}
