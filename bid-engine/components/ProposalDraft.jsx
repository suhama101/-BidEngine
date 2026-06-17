"use client";

import React, { useState, useEffect } from "react";
import { Copy, Sparkles, Check, FileEdit, Save, Cpu, Settings2, CheckCircle, Zap, MessageSquare } from "lucide-react";

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="proposal-draft-arena">
      {/* Configuration Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-[3rem] border border-sky-100 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />

          <div className="flex items-center gap-5">
            <div className="p-4 bg-sky-500 rounded-3xl shadow-xl ring-8 ring-sky-50">
              <Settings2 className="text-white h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Draft Engine</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Neural Synthesis Unit</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-sky-50/50 rounded-3xl border border-sky-100 group">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 flex items-center gap-3 mb-3">
                <div className="w-1.5 h-3 bg-sky-500 rounded-full" />
                Target Node
              </span>
              <p className="text-sm font-black text-slate-800 leading-relaxed">
                {activeRequirement?.title || "Establish Requirement Context..."}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Linguistic Modulation</label>
              <div className="grid grid-cols-1 gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300 flex items-center justify-between px-6 ${tone === t
                      ? "bg-sky-600 border-sky-500 text-white shadow-xl scale-[1.02]"
                      : "bg-white border-slate-100 text-slate-400 hover:border-sky-300 hover:bg-sky-50"
                      }`}
                  >
                    <span>{t}</span>
                    {tone === t && <Zap className="h-4 w-4 fill-current" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Evidence Injection</label>
              <textarea
                value={capabilityInfo}
                onChange={(e) => setCapabilityInfo(e.target.value)}
                placeholder="Synchronize specific proof points..."
                className="w-full h-40 bg-slate-50 text-slate-800 p-6 rounded-[2rem] border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/5 text-sm font-medium leading-relaxed shadow-inner"
              />
            </div>

            <button
              onClick={() => onGenerateDraft && onGenerateDraft({ requirement: activeRequirement, tone, capabilityInfo })}
              disabled={isDrafting || !activeRequirement}
              className="w-full btn-primary py-6 mt-4"
            >
              {isDrafting ? (
                <span className="flex items-center gap-3 justify-center">
                  <span className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" />
                  <span className="uppercase tracking-widest font-black">Synthesizing...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-4">
                  <Sparkles className="h-6 w-6" />
                  <span className="uppercase tracking-widest font-black">Generate Proposal</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {activeRequirement && (
          <div className="bg-yellow-50/50 border border-yellow-100 p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <MessageSquare className="h-12 w-12 text-yellow-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-700 flex items-center gap-3 mb-4">
              <div className="w-1.5 h-3 bg-yellow-400 rounded-full" />
              Primary Clause
            </span>
            <p className="text-sm text-slate-600 leading-relaxed font-bold italic">"{activeRequirement.description || activeRequirement.requirement_text}"</p>
          </div>
        )}
      </div>

      {/* Primary Editor Surface */}
      <div className="lg:col-span-2 bg-white/90 backdrop-blur-md p-10 rounded-[3.5rem] border border-sky-100 shadow-2xl flex flex-col min-h-[750px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-50/50 rounded-full blur-[100px] -z-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pb-8 border-b border-slate-100 mb-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-yellow-400 rounded-3xl shadow-xl ring-8 ring-yellow-50">
              <FileEdit className="text-yellow-900 h-7 w-7" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Proposal Composer</h3>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Stream Active</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCopy}
              className="px-8 py-4 bg-white hover:bg-sky-50 border-2 border-sky-100 rounded-2xl text-[10px] font-black text-sky-600 transition-all flex items-center gap-3 uppercase tracking-widest cursor-pointer shadow-sm active:scale-95"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy Draft"}</span>
            </button>

            <button
              onClick={() => onSaveDraft && onSaveDraft(editorContent)}
              disabled={isSavingDraft || !editorContent}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 text-white text-[10px] font-black rounded-2xl transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 uppercase tracking-widest cursor-pointer active:scale-95"
            >
              {isSavingDraft ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="h-4 w-4" />}
              <span>Commit Edits</span>
            </button>
          </div>
        </div>

        <div className="flex-grow relative flex flex-col">
          {!editorContent && !isDrafting ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 pointer-events-none">
              <div className="p-12 bg-slate-50 rounded-full mb-6">
                <Cpu className="h-24 w-24 opacity-20" />
              </div>
              <p className="font-black uppercase tracking-[0.4em] text-[12px] text-slate-300">Awaiting Neural Sequence</p>
            </div>
          ) : null}

          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="flex-grow w-full bg-slate-50/30 text-slate-900 p-10 rounded-[2.5rem] border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/5 font-sans text-xl leading-[1.8] shadow-inner resize-none custom-scrollbar font-medium"
            placeholder={isDrafting ? "Swarm agents are composing your response..." : "Initiate neural generation or begin manual drafting here..."}
          />
        </div>

        <div className="mt-10 flex items-center justify-between px-4 pt-10 border-t border-slate-100">
          <div className="flex gap-12">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Lexical Load</span>
              <span className="text-xl font-black text-slate-900 tracking-tight">{editorContent.split(/\s+/).filter(Boolean).length} Words</span>
            </div>
            <div className="flex flex-col gap-1.5 border-l border-slate-100 pl-12">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Optimization</span>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-sky-500" />
                <span className="text-xl font-black text-sky-600 tracking-tight">HIGH</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            Cloud Synched
          </div>
        </div>
      </div>
    </div>
  );
}
