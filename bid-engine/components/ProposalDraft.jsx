"use client";

import React, { useState, useEffect } from "react";
import { Copy, Sparkles, Check, FileEdit, Save, Cpu, Settings2, CheckCircle } from "lucide-react";

export default function ProposalDraft({
  activeRequirement,
  activeDraft = null,
  onGenerateDraft,
  onSaveDraft,
  draftResponse,
  isDrafting,
  isSavingDraft,
}) {
  const [tone, setTone] = useState("Technical");
  const [editorContent, setEditorContent] = useState("");
  const [capabilityInfo, setCapabilityInfo] = useState("");
  const [copied, setCopied] = useState(false);

  const tones = ["Technical", "Persuasive", "Conservative"];

  useEffect(() => {
    setEditorContent(draftResponse || "");
  }, [draftResponse]);

  useEffect(() => {
    if (activeRequirement) {
      setCapabilityInfo(`Holds ${activeRequirement.title} capacity, leveraging secure server nodes and standardized operating guarantees.`);
    }
  }, [activeRequirement]);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(editorContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="proposal-draft-arena">
      {/* Configuration Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-sky-200 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-sky-500 rounded-xl shadow-lg">
                <Settings2 className="text-white h-5 w-5" />
              </div>
              Draft Orchestrator
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 px-1">
              Neural Synthesis Configuration
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 flex items-center gap-2 mb-2">
                Target Node
              </span>
              <p className="text-xs font-bold text-slate-800 line-clamp-2">
                {activeRequirement?.title || "No Target Selected"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Linguistic Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter border transition-all duration-300 ${tone === t
                        ? "bg-sky-500 border-sky-400 text-white shadow-lg"
                        : "bg-white border-slate-200 text-slate-500 hover:border-sky-300"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Contextual Injection</label>
              <textarea
                value={capabilityInfo}
                onChange={(e) => setCapabilityInfo(e.target.value)}
                placeholder="Specific evidence to include in this section..."
                className="w-full h-32 bg-slate-50 text-slate-700 p-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500/50 text-xs font-medium"
              />
            </div>

            <button
              onClick={() => onGenerateDraft && onGenerateDraft({ requirement: activeRequirement, tone, capabilityInfo })}
              disabled={isDrafting || !activeRequirement}
              className="w-full btn-primary py-4 mt-2"
            >
              {isDrafting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Synthesizing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Response</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {activeRequirement && (
          <div className="bg-yellow-50/50 border border-yellow-100 p-5 rounded-3xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-700 flex items-center gap-2 mb-3">
              Source Requirement
            </span>
            <p className="text-[13px] text-slate-600 leading-relaxed italic">"{activeRequirement.description || activeRequirement.requirement_text}"</p>
          </div>
        )}
      </div>

      {/* Primary Editor Surface */}
      <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-2xl flex flex-col min-h-[600px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-3xl -z-10" />
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-400 rounded-2xl shadow-lg ring-4 ring-yellow-50">
              <FileEdit className="text-yellow-900 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Executive Proposal Composer</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Draft Stream Active</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all flex items-center gap-2 uppercase tracking-widest cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={() => onSaveDraft && onSaveDraft(editorContent)}
              disabled={isSavingDraft || !editorContent}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest cursor-pointer"
            >
              {isSavingDraft ? <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Save className="h-4 w-4" />}
              <span>Commit Edits</span>
            </button>
          </div>
        </div>

        <div className="flex-grow relative">
          {!editorContent && !isDrafting ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 space-y-4">
              <Cpu className="h-20 w-20 opacity-20" />
              <p className="font-extrabold uppercase tracking-[0.3em] text-[10px] text-slate-400">Awaiting Neural Sequence</p>
            </div>
          ) : null}

          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="w-full h-full min-h-[500px] bg-slate-50/50 text-slate-800 p-8 rounded-[2rem] border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/5 font-sans text-lg leading-relaxed shadow-inner resize-none custom-scrollbar"
            placeholder={isDrafting ? "Swarm agents are composing your response..." : "Your professional proposal draft will appear here..."}
          />
        </div>

        <div className="mt-8 flex items-center justify-between px-2 pt-6 border-t border-slate-100">
          <div className="flex gap-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex flex-col">
              <span className="text-slate-300 mb-1">Tokens</span>
              <span className="text-slate-900">{editorContent.split(/\s+/).filter(Boolean).length} Words</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex flex-col border-l border-slate-100 pl-6">
              <span className="text-slate-300 mb-1">Status</span>
              <span className="text-sky-600">OPTIMIZED</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            Auto-Sync Ready
          </div>
        </div>
      </div>
    </div>
  );
}
