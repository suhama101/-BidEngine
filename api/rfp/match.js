import { matchRequirementToCapabilities } from "../../bid-engine/lib/datasetAnalysis.js";
import { retrieveAndMatch, buildCapabilityIndex } from "../../bid-engine/lib/semanticRetriever.js";
import { CAPABILITY_LIBRARY } from "../../bid-engine/lib/sampleData.js";
import { requireAuthenticatedUser, requireWorkspaceOwner } from "../_lib/requestAuth.js";
import { getSupabaseAdminOrNull } from "../_lib/supabase.js";

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));

const readBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

const normalizeRequirement = (req, index = 0) => ({
  id: req.id || `REQ-${String(index + 1).padStart(3, "0")}`,
  requirement_text: req.requirement_text || req.description || req.title || "",
  requirement_type: req.requirement_type || "mandatory",
  compliance_status: req.compliance_status || "partial",
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = readBody(req);
    const { workspaceId, requirements: clientRequirements = [], entities: clientEntities = null } = body;
    const auth = await requireAuthenticatedUser(req);
    if (auth.errorResponse) return res.status(auth.errorResponse.status).json(auth.errorResponse.body);

    const { supabase, user } = auth;
    const workspaceDb = getSupabaseAdminOrNull() || supabase;
    let mode = "dataset";
    let requirements = [];
    let capabilities = [];

    if (workspaceId && isUuid(workspaceId)) {
      const ownership = await requireWorkspaceOwner(req, workspaceId);
      if (ownership.errorResponse) return res.status(ownership.errorResponse.status).json(ownership.errorResponse.body);

      const { data: dbRequirements, error: reqError } = await workspaceDb
        .from("rfp_requirements")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (reqError) throw reqError;
      requirements = dbRequirements || [];
    }

    if (requirements.length === 0 && clientRequirements.length > 0) {
      mode = "sample_mode";
      requirements = clientRequirements.map(normalizeRequirement);
    }

    if (requirements.length === 0) {
      return res.status(200).json({
        success: true,
        mode,
        message: "No requirements found. Run extraction first.",
        matches: [],
        requirements: [],
      });
    }

    const { data: dbCapabilities, error: capError } = await workspaceDb
      .from("capability_library")
      .select("*")
      .eq("user_id", user.id);

    if (!capError && dbCapabilities?.length) {
      capabilities = dbCapabilities;
    } else {
      mode = "sample_mode";
      capabilities = CAPABILITY_LIBRARY.map((item) => ({
        external_id: item.id,
        domain: item.skills?.[0] || item.client_type || "General",
        project_name: item.project_name,
        description: item.description,
        project_summary: item.description,
        certification: item.certifications?.join(", ") || "N/A",
        certifications: item.certifications || [],
        skills: item.skills || [],
        year_completed: item.year_completed,
        contract_value: item.contract_value,
        duration_months: null,
        client_type: item.client_type,
      }));
    }

    // ── RAG Pipeline: Vector Search + LLM Reranking ────────────────────────
    // Step 1: Build the capability vector index (embedding all capabilities)
    console.log(`[RAG Match] Building vector index for ${capabilities.length} capabilities...`);
    await buildCapabilityIndex(capabilities, user.id || 'sample');

    const { auditCompliance } = await import("../../bid-engine/lib/agents/auditor.js");

    // Step 2: For each requirement, run the full RAG pipeline
    const matchPool = requirements.slice(0, 10);
    const matches = await Promise.all(matchPool.map(async (requirement, index) => {
      const normalized = normalizeRequirement(requirement, index);

      try {
        // Phase A: Semantic Vector Retrieval + LLM Reranking
        const ragResult = await retrieveAndMatch(normalized, capabilities, user.id || 'sample', {
          topK: 5,
          skipRerank: false,
        });

        // Phase B: AI Auditor deep compliance verification (using retrieved evidence)
        const aiMatch = await auditCompliance(normalized, capabilities);

        return {
          requirement_id: normalized.id,
          requirement_text: normalized.requirement_text,
          compliance_status: aiMatch.compliance_status || ragResult.compliance_status,
          confidence_score: aiMatch.confidence || ragResult.confidence,
          evidence: ragResult.evidence || aiMatch.evidence,
          reasoning: `[RAG] ${ragResult.reasoning} [Auditor] ${aiMatch.reasoning || ''}`.trim(),
          retrieval_method: ragResult.retrieval_method,
          retrieved_chunks: ragResult.retrieved_chunks,
        };
      } catch (err) {
        console.error(`RAG pipeline failed for requirement ${normalized.id}:`, err.message);
        // Fallback to keyword heuristic if RAG fails
        const match = matchRequirementToCapabilities(normalized, capabilities, {});
        return {
          requirement_id: normalized.id,
          requirement_text: normalized.requirement_text,
          compliance_status: match.compliance_status,
          confidence_score: match.confidence,
          evidence: match.evidence,
          reasoning: `[Fallback] ${match.reasoning}`,
          retrieval_method: 'keyword_fallback',
          retrieved_chunks: [],
        };
      }
    }));

    if (workspaceId && isUuid(workspaceId)) {
      const updateResults = await Promise.all(matches.map((match) =>
        workspaceDb
          .from("rfp_requirements")
          .update({
            compliance_status: match.compliance_status,
            extracted_value: match.evidence,
            matched_evidence: match.evidence,
            match_confidence: match.confidence_score,
            match_reasoning: match.reasoning,
          })
          .eq("id", match.requirement_id)
          .eq("workspace_id", workspaceId)
      ));
      const updateError = updateResults.find((result) => result.error)?.error;
      if (updateError) {
        throw new Error(`Failed to save compliance match results: ${updateError.message}`);
      }
    }

    const requirementsWithMatches = requirements.map((requirement, index) => {
      const normalized = normalizeRequirement(requirement, index);
      const match = matches.find((item) => item.requirement_id === normalized.id);
      return {
        ...requirement,
        compliance_status: match?.compliance_status || "partial",
        matched_evidence: match?.evidence,
        match_confidence: match?.confidence_score,
        match_reasoning: match?.reasoning,
      };
    });

    return res.status(200).json({
      success: true,
      mode,
      workspaceId,
      matches,
      requirements: requirementsWithMatches,
      capability_count: capabilities.length,
      retrieval_pipeline: "vector_search_with_llm_rerank",
    });
  } catch (err) {
    console.error("Failure in matching route:", err);
    return res.status(500).json({
      success: false,
      mode: "sample_mode_unavailable",
      error: "Matching system encountered error: " + err.message,
    });
  }
}
