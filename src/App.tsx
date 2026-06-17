/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Navbar from "../bid-engine/components/Navbar";
import FileUpload from "../bid-engine/components/FileUpload";
import RequirementsList from "../bid-engine/components/RequirementsList";
import ComplianceChecker from "../bid-engine/components/ComplianceChecker";
import ProposalDraft from "../bid-engine/components/ProposalDraft";
import WinScoreDashboard from "../bid-engine/components/WinScoreDashboard";
import {
  Cpu,
  FileText,
  CheckCircle,
  ShieldAlert,
  Award,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Zap,
  Activity,
  ShieldCheck,
  Target,
  AlertTriangle,
  ListChecks
} from "lucide-react";

const compactText = (value: any, max = 90) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
};

const normalizeRequirement = (row: any, index = 0) => {
  const requirementType = row.requirement_type || row.type || "mandatory";
  const requirementText = row.requirement_text || row.description || row.title || "";
  const extractedValue = row.extracted_value || "";
  const category =
    row.category ||
    (requirementType === "deadline"
      ? "Deadline"
      : requirementType === "evaluation"
        ? "Evaluation"
        : String(extractedValue).includes("Question")
          ? "Question"
          : "Mandatory");
  const prefix = category.slice(0, 3).toUpperCase() || "REQ";
  const status = row.compliance_status || row.status || "partial";

  return {
    ...row,
    id: row.id || row.requirement_id || `REQ-${index + 1}`,
    displayId: row.displayId || row.display_id || `${prefix}-${String(index + 1).padStart(3, "0")}`,
    title: row.title || compactText(requirementText, 72) || `Requirement ${index + 1}`,
    description: requirementText || row.content || "No requirement text was returned.",
    category,
    severity:
      row.severity ||
      (requirementType === "mandatory"
        ? "Critical"
        : requirementType === "deadline"
          ? "Important"
          : "Standard"),
    status,
    compliance_status: status,
    requirement_type: requirementType,
    extracted_value: extractedValue,
  };
};

const normalizeRequirements = (rows: any[] = []) => rows.map((row, index) => normalizeRequirement(row, index));

const gradeFromMatch = (status: string, confidence?: number | null) => {
  if (!status) return "Pending";
  if (status === "pass") return Number(confidence || 0) >= 75 ? "Outstanding" : "Strong";
  if (status === "partial") return "Partial";
  if (status === "fail") return "Poor";
  return "Pending";
};

const buildMatchMatrix = (rows: any[] = []) =>
  rows.reduce((matrix: any, row: any) => {
    const hasMatchEvidence = row.matched_evidence || row.match_reasoning || row.match_confidence !== undefined;
    if (!hasMatchEvidence) return matrix;

    const status = row.compliance_status || row.status || "partial";
    matrix[row.id] = {
      matchGrade: gradeFromMatch(status, row.match_confidence),
      reasoning: row.match_reasoning || "Compliance match was saved for this requirement.",
      recommendation:
        status === "pass"
          ? "Use the matched evidence directly in the proposal response."
          : status === "fail"
            ? "Resolve this gap before final submission or mark it as a delivery risk."
            : "Add stronger supporting proof before approving this response.",
      evidence: row.matched_evidence || row.extracted_value || "No saved evidence text was returned.",
      status,
    };
    return matrix;
  }, {});

const normalizeScore = (payload: any) => {
  const score = payload?.scores || payload?.record || payload;
  if (!score || (score.total_score === undefined && score.winScore === undefined)) return null;

  const riskPenalty = Number(score.risk_penalty_score ?? 35);
  const decision = score.decision || (Number(score.total_score ?? score.winScore) >= 70 ? "GO" : "NO-GO");

  return {
    winScore: Number(score.total_score ?? score.winScore ?? 0),
    benchmarks: {
      budgetAlignment: Number(score.budget_alignment ?? score.budgetAlignment ?? 0),
      capabilityMatch: Number(score.capability_match ?? score.capabilityMatch ?? 0),
      complianceScore: Number(score.compliance_score ?? score.complianceScore ?? 0),
      riskBuffer: Math.max(0, 100 - riskPenalty),
    },
    decision,
    remedialActions: [
      decision === "GO"
        ? "Proceed with proposal drafting while keeping final compliance proof attached."
        : "Close failed mandatory gaps before submitting this opportunity.",
      "Review budget alignment, matched evidence, and risk score before final approval.",
    ],
    raw: score,
  };
};

export default function App() {
  const [screen, setScreen] = useState<"landing" | "login" | "signup" | "dashboard">("landing");
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [userEmail, setUserEmail] = useState("expert@bidengine.ai");
  const [userName, setUserName] = useState("Bid Analyst");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dashboard states
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [rfpText, setRfpText] = useState("");
  const [requirements, setRequirements] = useState<any[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [matchMatrix, setMatchMatrix] = useState<any>({});
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  const [activeDraft, setActiveDraft] = useState<any>(null);
  const [activeDraftText, setActiveDraftText] = useState("");
  const [ratingAnalysis, setRatingAnalysis] = useState<any>(null);

  // loading states
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const getAuthHeaders = (headers: Record<string, string> = {}) => {
    const token = localStorage.getItem("bid_engine_token");
    return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
  };

  useEffect(() => {
    if (requirements.length === 0) {
      setSelectedRequirement(null);
      return;
    }

    if (!selectedRequirement || !requirements.some((req) => req.id === selectedRequirement.id)) {
      setSelectedRequirement(requirements[0]);
    }
  }, [requirements, selectedRequirement]);

  useEffect(() => {
    if (!selectedRequirement || savedDrafts.length === 0) {
      setActiveDraft(null);
      setActiveDraftText("");
      return;
    }
    const cleanText = (selectedRequirement.description || selectedRequirement.requirement_text || "").slice(0, 30).toLowerCase();
    const matched = savedDrafts.find((d: any) =>
      String(d.section_title || "").toLowerCase().includes(cleanText)
    );
    if (matched) {
      setActiveDraft(matched);
      setActiveDraftText(matched.content || "");
    } else {
      setActiveDraft(null);
      setActiveDraftText("");
    }
  }, [selectedRequirement, savedDrafts]);

  useEffect(() => {
    let cancelled = false;

    const syncSession = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.user?.id) {
          throw new Error(data.error || "Authentication required");
        }

        if (cancelled) return;

        setUserEmail(data.user.email || "");
        setUserName(
          data.user.fullName ||
          data.user.full_name ||
          data.user.email?.split("@")[0] ||
          "Bid Analyst"
        );
        setIsAuthenticated(true);
        setScreen("dashboard");
      } catch {
        if (cancelled) return;
        setIsAuthenticated(false);
        setScreen("landing");
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    syncSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const readApiResponse = async (response: Response) => {
    const raw = await response.text();
    if (!raw) return {};

    try {
      return JSON.parse(raw);
    } catch {
      return {
        error: raw.length > 160 ? `${response.status} ${response.statusText}` : raw,
      };
    }
  };

  const loadWorkspaceDetails = async (workspaceId: string) => {
    if (!workspaceId) return;

    const response = await fetch(`/api/workspaces?workspaceId=${encodeURIComponent(workspaceId)}`, {
      credentials: "include",
      headers: getAuthHeaders(),
    });
    const data: any = await readApiResponse(response);
    if (!response.ok) {
      throw new Error(data.error || `Failed to load workspace (${response.status}).`);
    }

    const normalizedRequirements = normalizeRequirements(data.requirements || []);
    const drafts = data.drafts || [];
    const firstDraft = drafts[0] || null;

    setCurrentWorkspace(data.workspace || null);
    setRfpText(data.workspace?.raw_text || "");
    setRequirements(normalizedRequirements);
    setMatchMatrix(buildMatchMatrix(normalizedRequirements));
    setSavedDrafts(drafts);
    setActiveDraft(firstDraft);
    setActiveDraftText(firstDraft?.content || "");
    setRatingAnalysis(normalizeScore(data.score));
  };

  const loadLatestWorkspace = async () => {
    if (!isAuthenticated) return;

    setIsLoadingWorkspace(true);
    try {
      const response = await fetch("/api/workspaces", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const data: any = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || `Failed to load workspaces (${response.status}).`);
      }

      const latest = data.workspaces?.[0];
      if (latest?.id) {
        await loadWorkspaceDetails(latest.id);
      } else {
        setCurrentWorkspace(null);
        setRfpText("");
        setRequirements([]);
        setMatchMatrix({});
        setSavedDrafts([]);
        setActiveDraft(null);
        setActiveDraftText("");
        setRatingAnalysis(null);
      }
    } catch (error: any) {
      setAlert({ type: "error", text: error.message || "Could not load saved workspace data." });
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void loadLatestWorkspace();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userEmail, password: loginPassword }),
      });

      const data: any = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || `Authentication failed (${response.status}).`);
      }

      const token = data.session?.access_token || data.token;
      if (token) {
        localStorage.setItem("bid_engine_token", token);
      }

      setUserEmail(data.user?.email || userEmail);
      setUserName(data.user?.fullName || userName);
      setLoginPassword("");
      setIsAuthenticated(true);
      setScreen("dashboard");
    } catch (error: any) {
      setAuthMessage({
        type: "error",
        text: error.message || "Authentication failed.",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthMessage(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userEmail, password: signupPassword, fullName: userName }),
      });

      const data: any = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || `Registration failed (${response.status}).`);
      }

      const token = data.session?.access_token || data.token;
      if (token) {
        localStorage.setItem("bid_engine_token", token);
      }

      setUserEmail(data.user?.email || userEmail);
      setUserName(data.user?.fullName || userName);
      setSignupPassword("");
      setIsAuthenticated(true);
      setScreen("dashboard");
    } catch (error: any) {
      setAuthMessage({
        type: "error",
        text: error.message || "Registration failed.",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout transport errors and still clear local state.
    } finally {
      localStorage.removeItem("bid_engine_token");
      setIsAuthenticated(false);
      setUserEmail("");
      setUserName("Bid Analyst");
      setLoginPassword("");
      setSignupPassword("");
      setAuthMessage(null);
      setCurrentWorkspace(null);
      setRfpText("");
      setRequirements([]);
      setMatchMatrix({});
      setSavedDrafts([]);
      setActiveDraft(null);
      setActiveDraftText("");
      setRatingAnalysis(null);
      setScreen("landing");
    }
  };

  // 1. Text Parsing & RFP Extraction
  const executeRfpAnalysis = async (text: string, meta: any = {}) => {
    setIsAnalyzing(true);
    setRfpText(text);
    setAlert(null);

    try {
      const response = await fetch("/api/rfp/analyze", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          rawText: text,
          workspaceId: meta.workspaceId || meta.workspace?.id || null,
          bidTitle: meta.fileName || currentWorkspace?.title || `RFP Workspace - ${new Date().toLocaleDateString()}`,
        }),
      });
      const data: any = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || `RFP analysis failed (${response.status}).`);
      }

      await loadWorkspaceDetails(data.workspaceId);
      setAlert({
        type: "success",
        text: `Saved workspace and ${data.requirements?.length || 0} extracted requirements to Supabase.`,
      });
      setActiveTab("requirements");
    } catch (error: any) {
      setAlert({ type: "error", text: error.message || "RFP analysis failed." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Map Capabilites
  const executeMatching = async (capsList: string[]) => {
    if (!currentWorkspace?.id) {
      setAlert({ type: "error", text: "Analyze an RFP first so the workspace exists in Supabase." });
      return;
    }

    setIsMatching(true);
    setAlert(null);

    try {
      const response = await fetch("/api/rfp/match", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          capabilityNotes: capsList.join("\n"),
        }),
      });
      const data: any = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || `Compliance matching failed (${response.status}).`);
      }

      const normalizedRequirements = normalizeRequirements(data.requirements || []);
      setRequirements(normalizedRequirements);
      setMatchMatrix(buildMatchMatrix(normalizedRequirements));
      setAlert({
        type: "success",
        text: `Saved compliance matches for ${data.matches?.length || normalizedRequirements.length} requirements.`,
      });
      setActiveTab("compliance");
    } catch (error: any) {
      setAlert({ type: "error", text: error.message || "Compliance matching failed." });
    } finally {
      setIsMatching(false);
    }
  };

  // 3. Draft Responses
  const executeDrafting = async (params: any) => {
    if (!currentWorkspace?.id) {
      setAlert({ type: "error", text: "Analyze an RFP first so a draft can be saved to Supabase." });
      return;
    }

    setIsDrafting(true);
    setAlert(null);

    try {
      const response = await fetch("/api/rfp/draft", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          requirementId: params.requirement?.id,
          tone: params.tone,
          capabilityInfo: params.capabilityInfo,
        }),
      });
      const data: any = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || `Proposal drafting failed (${response.status}).`);
      }

      const drafts = data.drafts || [];
      const draft =
        drafts.find((item: any) =>
          params.requirement?.description &&
          String(item.section_title || "").includes(compactText(params.requirement.description, 30))
        ) || drafts[0] || null;

      setSavedDrafts(drafts);
      setActiveDraft(draft);
      setActiveDraftText(draft?.content || "");
      setAlert({ type: "success", text: `Generated and saved ${drafts.length || 0} proposal draft sections.` });
      setActiveTab("draft");
    } catch (error: any) {
      setAlert({ type: "error", text: error.message || "Proposal drafting failed." });
    } finally {
      setIsDrafting(false);
    }
  };

  // 4. Rate Bid
  const executePredictScore = async () => {
    if (!currentWorkspace?.id) {
      setAlert({ type: "error", text: "Analyze an RFP first so the win score can be saved to Supabase." });
      return;
    }

    setIsPredicting(true);
    setAlert(null);

    try {
      const response = await fetch("/api/rfp/score", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          rawText: rfpText,
        }),
      });
      const data: any = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || `Win score failed (${response.status}).`);
      }

      setRatingAnalysis(normalizeScore(data.scores || data.record));
      setAlert({ type: "success", text: "Calculated and saved win probability plus GO/NO-GO decision." });
      setActiveTab("score");
    } catch (error: any) {
      setAlert({ type: "error", text: error.message || "Win probability scoring failed." });
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSaveDraft = async (content: string) => {
    if (!activeDraft?.id) {
      setAlert({ type: "error", text: "Generate a draft first before saving edits." });
      return;
    }

    setIsSavingDraft(true);
    setAlert(null);

    try {
      const response = await fetch("/api/rfp/draft", {
        method: "PATCH",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          draftId: activeDraft.id,
          content,
          status: "edited",
        }),
      });
      const data: any = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || `Saving draft failed (${response.status}).`);
      }

      setActiveDraft(data.draft);
      setActiveDraftText(data.draft?.content || content);
      setSavedDrafts((drafts) => drafts.map((draft) => (draft.id === data.draft?.id ? data.draft : draft)));
      setAlert({ type: "success", text: "Draft edits saved to Supabase." });
    } catch (error: any) {
      setAlert({ type: "error", text: error.message || "Saving draft failed." });
    } finally {
      setIsSavingDraft(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center space-y-6">
        <div className="p-6 bg-white rounded-3xl border border-sky-100 shadow-2xl relative">
          <div className="absolute inset-0 bg-sky-500/10 rounded-3xl blur-2xl animate-pulse" />
          <Cpu className="h-16 w-16 text-sky-500 animate-pulse relative z-10" />
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Initializing Data Stream...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900">
      {screen === "landing" && (
        <div className="min-h-screen flex flex-col justify-between relative overflow-hidden" id="root-landing-portal">
          {/* Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-sky-200/30 rounded-full blur-[140px] animate-pulse-soft" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-yellow-200/20 rounded-full blur-[140px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[20%] right-[10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '4s' }} />
          </div>

          <header className="border-b border-slate-100 bg-white/80 backdrop-blur-xl px-8 py-6 max-w-7xl mx-auto w-full flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center space-x-4">
              <div className="bg-sky-500 p-2.5 rounded-2xl shadow-xl hover:rotate-6 transition-transform animate-float">
                <Cpu className="h-7 w-7 text-white" />
              </div>
              <span className="font-black text-3xl tracking-tighter text-slate-800">
                BidEngine<span className="text-sky-500">.AI</span>
              </span>
            </div>
            <div className="flex items-center space-x-8">
              <button onClick={() => setScreen("login")} className="text-sm font-black uppercase tracking-widest text-slate-400 hover:text-sky-600 transition cursor-pointer">
                Sign In
              </button>
              <button
                onClick={() => setScreen(isAuthenticated ? "dashboard" : "login")}
                className="px-8 py-4 bg-yellow-400 text-yellow-950 hover:bg-yellow-300 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-xl hover:shadow-[0_15px_25px_-5px_rgba(234,179,8,0.4)] flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="flex-grow flex flex-col items-center">
            <section className="relative px-6 py-24 md:py-40 max-w-6xl mx-auto text-center space-y-10">
              <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-sky-50 rounded-full border border-sky-100 text-sky-600 text-[10px] font-black uppercase tracking-[0.3em] animate-bounce shadow-sm">
                <Sparkles className="h-4 w-4" />
                <span>Next-Gen Agentic RAG Pipeline</span>
              </div>

              <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-slate-900 leading-[0.85] animate-in fade-in zoom-in duration-1000">
                WIN MORE <br />
                <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-[0_15px_15px_rgba(14,165,233,0.2)]">
                  BIDS FASTER.
                </span>
              </h1>

              <p className="text-slate-500 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-bold italic">
                "Transform complex RFPs into high-scoring proposal drafts in seconds. Engineered for elite bidding teams."
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-12">
                <button
                  onClick={() => setScreen(isAuthenticated ? "dashboard" : "login")}
                  className="cursor-pointer w-full sm:w-auto px-12 py-6 bg-sky-600 hover:bg-sky-500 text-white font-black text-sm rounded-[2rem] transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(14,165,233,0.5)] hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.2em]"
                >
                  <span>Start Building Bids</span>
                  <ArrowRight className="h-6 w-6" />
                </button>
                <div className="hidden sm:block w-px h-16 bg-slate-200" />
                <button
                  onClick={() => setScreen("signup")}
                  className="cursor-pointer w-full sm:w-auto px-12 py-6 bg-white border-2 border-slate-100 hover:border-yellow-400 text-slate-600 hover:text-slate-900 font-black text-sm rounded-[2rem] transition-all duration-300 uppercase tracking-[0.2em] shadow-sm hover:shadow-xl"
                >
                  Get Professional Access
                </button>
              </div>
            </section>

            {/* Metrics Section */}
            <section className="w-full max-w-7xl mx-auto px-6 py-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 bg-white/95 backdrop-blur-3xl border border-sky-100 rounded-[4rem] p-16 text-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom-10 duration-1000">
                <div className="space-y-4">
                  <span className="text-6xl md:text-7xl font-black text-slate-900 block tracking-tighter transition-all hover:scale-110">120<span className="text-sky-500">K+</span></span>
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.3em] bg-slate-50 py-2 rounded-full w-fit mx-auto px-6">Data Points Indexed</p>
                </div>
                <div className="space-y-4 border-y md:border-y-0 md:border-x border-slate-100 py-10 md:py-0">
                  <span className="text-6xl md:text-7xl font-black text-slate-900 block tracking-tighter transition-all hover:scale-110">10<span className="text-yellow-500">X</span></span>
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.3em] bg-slate-50 py-2 rounded-full w-fit mx-auto px-6">Efficiency Multiplier</p>
                </div>
                <div className="space-y-4">
                  <span className="text-6xl md:text-7xl font-black text-slate-900 block tracking-tighter transition-all hover:scale-110">85<span className="text-blue-500"> %</span></span>
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.3em] bg-slate-50 py-2 rounded-full w-fit mx-auto px-6">Target Accuracy</p>
                </div>
              </div>
            </section>
          </main>

          <footer className="py-20 bg-white border-t border-slate-100 text-center">
            <div className="flex justify-center gap-12 mb-10">
              <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">
              &copy; {new Date().getFullYear()} BidEngine AI Forge Operations
            </p>
          </footer>
        </div>
      )}

      {screen === "login" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-100 relative selection:bg-sky-500/30" id="root-login-screen">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1)_0%,transparent_70%)]" />
          <div className="w-full max-w-md bg-white p-12 rounded-[3.5rem] border border-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] space-y-10 relative z-10">
            <div className="text-center space-y-6">
              <button onClick={() => setScreen("landing")} className="inline-flex flex-col items-center gap-4">
                <div className="p-4 bg-sky-500 rounded-[2rem] shadow-2xl rotate-3">
                  <Cpu className="h-10 w-10 text-white" />
                </div>
                <span className="font-black text-4xl tracking-tighter text-slate-950">BidEngine<span className="text-sky-500">.AI</span></span>
              </button>
              <h2 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em] pt-4 border-t border-slate-50">Personnel Authentication</h2>
            </div>

            {authMessage && (
              <div className={`p-5 rounded-2xl text-xs font-black uppercase tracking-widest border animate-in slide-in-from-top-2 duration-300 shadow-sm ${authMessage.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                {authMessage.text}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-2">Access Identity</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-5 rounded-[1.5rem] border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all font-bold placeholder:text-slate-300"
                  placeholder="name@company.com"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-2">Encryption Key</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-5 rounded-[1.5rem] border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all font-bold placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-6 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 text-white font-black rounded-[1.5rem] text-xs uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl hover:shadow-[0_20px_40px_-5px_rgba(14,165,233,0.4)] cursor-pointer active:scale-[0.98]"
              >
                {isAuthenticating ? "SYNCHRONIZING..." : "INITIATE SESSION"}
              </button>
            </form>

            <div className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pt-8 border-t border-slate-50 flex flex-col gap-4">
              <span>New Operational Personnel?</span>
              <button onClick={() => setScreen("signup")} className="text-sky-600 hover:text-sky-500 transition cursor-pointer bg-sky-50 py-3 rounded-xl border border-sky-100">Establish Identity</button>
            </div>
          </div>
        </div>
      )}

      {screen === "signup" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-100 relative selection:bg-sky-500/30" id="root-signup-screen">
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-sky-500 via-yellow-400 to-blue-500" />
          <div className="w-full max-w-md bg-white p-12 rounded-[3.5rem] border border-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] space-y-8 relative z-10">
            <div className="text-center space-y-6">
              <button onClick={() => setScreen("landing")} className="inline-flex flex-col items-center gap-4">
                <div className="p-4 bg-sky-500 rounded-[2rem] shadow-2xl">
                  <Cpu className="h-8 w-8 text-white" />
                </div>
                <span className="font-black text-4xl tracking-tighter text-slate-900">BidEngine<span className="text-sky-500">.AI</span></span>
              </button>
              <h2 className="text-xl font-black text-slate-400 uppercase tracking-[0.3em] pt-4 border-t border-slate-50">Identity Registration</h2>
            </div>

            {authMessage && (
              <div className={`p-5 rounded-2xl text-xs font-black uppercase tracking-widest border animate-in slide-in-from-top-2 duration-300 shadow-sm ${authMessage.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                {authMessage.text}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2 px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-5 rounded-[1.5rem] border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all font-bold placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2 px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Work Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-5 rounded-[1.5rem] border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all font-bold placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2 px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Secure Phrase</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-5 rounded-[1.5rem] border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all font-bold placeholder:text-slate-300"
                />
              </div>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-6 bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-200 text-yellow-950 font-black rounded-[1.5rem] text-xs uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl hover:shadow-[0_20px_40px_-5px_rgba(234,179,8,0.3)] cursor-pointer mt-4"
              >
                {isAuthenticating ? "CONFIGURING..." : "ESTABLISH IDENTITY"}
              </button>
            </form>

            <div className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pt-8 border-t border-slate-50 flex flex-col gap-4">
              <span>Legacy Personnel Logged?</span>
              <button onClick={() => setScreen("login")} className="text-sky-600 hover:text-sky-500 transition cursor-pointer bg-sky-50 py-3 rounded-xl border border-sky-100 uppercase">Return to Forge</button>
            </div>
          </div>
        </div>
      )}

      {screen === "dashboard" && (
        <div className="min-h-screen bg-slate-50 flex flex-col overflow-y-auto relative" id="root-dashboard-hub">
          {/* Global Light Accents */}
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-sky-400/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-yellow-400/5 rounded-full blur-[120px]" />
          </div>

          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userEmail={userEmail}
            onSignOut={handleSignOut}
          />

          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12 flex-grow w-full space-y-12 animate-in fade-in duration-1000">
            {alert && (
              <div className={`p-6 rounded-[2rem] flex items-start gap-6 text-sm font-black uppercase tracking-widest border shadow-2xl animate-in slide-in-from-top-6 duration-700 ${alert.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                <div className={`p-2 rounded-xl ${alert.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  <ShieldAlert className="h-6 w-6 shrink-0" />
                </div>
                <div className="pt-2">{alert.text}</div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 pb-12 border-b border-slate-100">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full bg-sky-500 animate-ping" />
                  <span className="text-[12px] font-black text-sky-600 uppercase tracking-[0.4em]">
                    Neural Command Center
                  </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter flex items-center gap-6">
                  PROPOSAL <span className="text-sky-500 drop-shadow-sm">FORGE</span>
                </h1>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] pt-4 flex items-center gap-4">
                  <div className="h-px w-10 bg-slate-200" />
                  Mission Parameters <span className="text-slate-200">|</span> RFP Sequence Optimization
                </p>
              </div>

              <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl flex items-center gap-6 group hover:border-sky-300 transition-all">
                <div className="bg-sky-50 p-4 rounded-3xl group-hover:rotate-6 transition-transform">
                  <Cpu className="h-8 w-8 text-sky-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Neural Context</span>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${currentWorkspace?.id ? "bg-emerald-500" : "bg-amber-400"} animate-pulse`} />
                    <span className={`text-xl font-black tracking-tight ${currentWorkspace?.id ? "text-slate-900" : "text-amber-600"}`}>
                      {isLoadingWorkspace ? "SYNCHRONIZING..." : currentWorkspace?.title ? compactText(currentWorkspace.title, 20) : "VIRTUAL_TEMP_01"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Main Grid Area */}
            <div className="relative min-h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              {activeTab === "upload" && (
                <FileUpload
                  onTextParsed={executeRfpAnalysis}
                  isProcessing={isAnalyzing}
                  initialText={rfpText}
                />
              )}

              {activeTab === "requirements" && (
                <RequirementsList
                  requirements={requirements}
                  onSelectRequirement={(req) => {
                    setSelectedRequirement(req);
                    setActiveTab("draft");
                  }}
                />
              )}

              {activeTab === "compliance" && (
                <ComplianceChecker
                  requirements={requirements}
                  matchMatrix={matchMatrix}
                  onRunMatch={executeMatching}
                  isMatching={isMatching}
                />
              )}

              {activeTab === "draft" && (
                <ProposalDraft
                  activeRequirement={selectedRequirement}
                  activeDraft={activeDraft}
                  onGenerateDraft={executeDrafting}
                  onSaveDraft={handleSaveDraft}
                  draftResponse={activeDraftText}
                  isDrafting={isDrafting}
                  isSavingDraft={isSavingDraft}
                />
              )}

              {activeTab === "score" && (
                <WinScoreDashboard
                  activeBidTitle={currentWorkspace?.title || "Project Alpha Sequence"}
                  ratingAnalysis={ratingAnalysis}
                  onPredictScore={executePredictScore}
                  isPredicting={isPredicting}
                  requirements={requirements}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
