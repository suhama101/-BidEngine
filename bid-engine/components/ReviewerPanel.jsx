"use client";

import React, { useState } from "react";
import { ClipboardCheck, FileWarning, WandSparkles, Copy, RefreshCw, ShieldAlert, Zap } from "lucide-react";

const renderItems = (items = [], emptyText = "No issues detected.") => {
  if (!items || items.length === 0) {
    return <p className="text-xs text-slate-400 italic">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-sky-100 bg-white p-4 text-xs text-slate-600 shadow-sm hover:shadow-md transition-shadow">
          {typeof item === "string" ? (
            <p className="font-medium leading-relaxed">{item}</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-4 rounded-full ${item.severity === 'high' ? 'bg-rose-500' : 'bg-sky-400'}`} />
                <p className="font-black text-slate-800 uppercase tracking-tight">{item.section_title || item.requirement_id || item.issue || `Issue ${index + 1}`}</p>
              </div>
              {item.issue && <p className="mt-1 text-slate-500 leading-relaxed">{item.issue}</p>}
              {item.severity && <span className="mt-2 inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200">Severity: {item.severity}</span>}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default function ReviewerPanel({
  onRunReview,
  isReviewing,
  reviewResult = null,
}) {
  const [copied, setCopied] = useState(false);
  const finalProposal = reviewResult?.final_proposal || "";

  const handleCopy = async () => {
    if (!finalProposal || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(finalProposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="reviewer-panel">
      {/* Strategy Card */}
      <div className="lg:col-span-1 bg-white/90 backdrop-blur-md p-8 rounded-[3rem] border border-sky-100 shadow-2xl space-y-6 h-fit relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400" />
        <div className="flex items-center gap-5 mb-8">
          <div className="bg-sky-500 p-4 rounded-3xl shadow-xl ring-8 ring-sky-50">
            <ClipboardCheck className="text-white h-7 w-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Reviewer Agent
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Policy Audit v4.0</span>
            </div>
          </div>
        </div>

        <button
          onClick={onRunReview}
          disabled={isReviewing}
          className={`w-full flex items-center justify-center gap-3 py-5 px-6 rounded-[1.5rem] font-black text-sm transition-all shadow-lg active:scale-[0.98] cursor-pointer ${isReviewing
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-200"
            }`}
        >
          {isReviewing ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span className="uppercase tracking-widest">Auditing Pipeline...</span>
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 fill-current" />
              <span className="uppercase tracking-widest">Initiate Quality Pass</span>
            </>
          )}
        </button>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Final Recommendation</label>
          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 relative overflow-hidden group">
            <div className={`text-center py-2 px-6 rounded-2xl text-[10px] font-black tracking-[0.3em] uppercase mb-4 border ${reviewResult?.final_recommendation === "GO"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-rose-50 text-rose-600 border-rose-100"
              }`}>
              {reviewResult?.final_recommendation || "System Pending"}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {reviewResult?.rationale || "The reviewer agent will provide a strategic go/no-go recommendation based on compliance fit and evidence strength."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Feedback Card */}
      <div className="lg:col-span-2 bg-white/90 backdrop-blur-md p-8 rounded-[3rem] border border-sky-100 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-yellow-400 rounded-3xl shadow-xl ring-8 ring-yellow-50">
              <FileWarning className="text-yellow-900 h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit Feedback Registry</h3>
              <p className="text-slate-400 text-[10px] font-black mt-1 uppercase tracking-[0.15em]">Neural Cleanup & Risk Mitigation</p>
            </div>
          </div>

          {finalProposal && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-3 px-6 py-3 bg-white hover:bg-sky-50 rounded-2xl border-2 border-sky-100 text-sky-600 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Copy className="h-4 w-4" />
              <span>{copied ? "Copied to Buffer" : "Copy Improved Version"}</span>
            </button>
          )}
        </div>

        {!reviewResult ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="p-8 bg-slate-50 rounded-full animate-bounce-slow">
              <ShieldAlert className="h-16 w-16 text-slate-200" />
            </div>
            <div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Feedback Matrix Offline</p>
              <p className="text-slate-300 text-[10px] uppercase font-bold mt-2">Generate proposal draft to enable audit protocols</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1">Weak Sections</h4>
                {renderItems(reviewResult.weak_sections, "Protocol verified: No weak sections.")}
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-1">Unsupported Claims</h4>
                {renderItems(reviewResult.unsupported_claims, "Protocol verified: No unsupported claims.")}
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-1">Compliance Gaps</h4>
                {renderItems(reviewResult.missing_compliance_points, "Protocol verified: No compliance gaps.")}
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest px-1">Language Optimization</h4>
                {renderItems(reviewResult.vague_language, "Language is precise and professional.")}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Strategic Suggestions</h4>
              {renderItems(reviewResult.suggestions, "Initial pass optimal.")}
            </div>

            <div className="relative group pt-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-yellow-400 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative bg-white rounded-[2rem] border border-sky-100 overflow-hidden shadow-2xl">
                <div className="px-8 py-4 bg-sky-50/50 border-b border-sky-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-600">Improved Master Draft</span>
                  <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
                </div>
                <textarea
                  readOnly
                  value={finalProposal}
                  className="w-full h-[400px] bg-white text-slate-800 p-8 focus:outline-none font-medium text-sm leading-relaxed resize-none custom-scrollbar"
                  placeholder="The agent will output the final, remediation-ready proposal draft here..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
