"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Search, HelpCircle, FileText, ShieldCheck, Zap, ArrowUpRight, BadgeCheck } from "lucide-react";

const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case "pass":
    case "compliant":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
        icon: BadgeCheck,
        label: "Fully Compliant"
      };
    case "partial":
    case "partially compliant":
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
        icon: AlertTriangle,
        label: "Partial Match"
      };
    case "fail":
    case "non-compliant":
      return {
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-100",
        icon: XCircle,
        label: "Gap Detected"
      };
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-400",
        border: "border-slate-100",
        icon: HelpCircle,
        label: "Pending Analysis"
      };
  }
};

export default function ComplianceChecker({
  requirements = [],
  matchMatrix = {},
  onRunMatch,
  isMatching,
}) {
  const requirementsWithMatrix = requirements.map((req) => ({
    ...req,
    matrix: matchMatrix[req.id] || null,
  }));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000" id="compliance-matrix">
      <div className="bg-white/95 backdrop-blur-2xl p-10 rounded-[4rem] border border-sky-100 shadow-[0_40px_100px_-30px_rgba(14,165,233,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-sky-500 p-4 rounded-3xl shadow-xl ring-8 ring-sky-50">
            <ShieldCheck className="text-white h-7 w-7" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Compliance Matrix</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Cross-Reference Audit Pipeline</p>
            </div>
          </div>
        </div>

        <button
          onClick={onRunMatch}
          disabled={isMatching || requirements.length === 0}
          className={`btn-primary px-10 py-5 ${isMatching ? "bg-slate-100 ring-0 cursor-not-allowed text-slate-400" : ""}`}
        >
          {isMatching ? (
            <>
              <Zap className="h-5 w-5 animate-spin fill-current" />
              <span className="uppercase tracking-widest text-sm">Auditing Evidence...</span>
            </>
          ) : (
            <>
              <BadgeCheck className="h-5 w-5" />
              <span className="uppercase tracking-widest text-sm">Execute Compliance Pass</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requirementsWithMatrix.length === 0 ? (
          <div className="bg-white p-24 rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center">
            <div className="p-10 bg-slate-50 rounded-full mb-6">
              <FileText className="h-16 w-16 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Compliance registry empty</p>
            <p className="text-slate-300 text-[10px] uppercase font-bold mt-2">Initialize extraction sequence to enable matrix</p>
          </div>
        ) : (
          requirementsWithMatrix.map((req, index) => {
            const styles = getStatusStyles(req.matrix?.status || req.compliance_status || "pending");
            const Icon = styles.icon;

            return (
              <div
                key={req.id}
                className="group bg-white/95 backdrop-blur-md rounded-[3rem] border border-slate-100 hover:border-sky-200 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl p-2"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Status Sidebar */}
                  <div className={`lg:w-72 ${styles.bg} p-8 flex flex-col items-center justify-center text-center space-y-4 rounded-[2.5rem] relative overflow-hidden transition-colors duration-500`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Icon className="h-24 w-24" />
                    </div>
                    <div className={`p-4 bg-white rounded-2xl shadow-sm ${styles.text}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${styles.text}`}>
                        {styles.label}
                      </span>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">
                          {req.matrix?.matchGrade === 'Outstanding' ? '100' :
                            req.matrix?.matchGrade === 'Strong' ? '85' :
                              req.matrix?.matchGrade === 'Partial' ? '50' : '0'}
                        </span>
                        <span className="text-xs font-black text-slate-400 uppercase">Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-grow p-10 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100 uppercase tracking-widest">
                            {req.category || "General Requirement"}
                          </span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                            {req.displayId || `REQ-${index + 1}`}
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                          {req.title}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed italic max-w-3xl">
                          "{req.description || req.requirement_text}"
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
                          Expert Validated
                        </div>
                      </div>
                    </div>

                    {req.matrix && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="w-1.5 h-3 bg-sky-500 rounded-full" />
                            Correlated Evidence
                          </h4>
                          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 relative group/cite">
                            <div className="absolute top-4 right-4 opacity-0 group-hover/cite:opacity-100 transition-opacity">
                              <ArrowUpRight className="h-4 w-4 text-sky-400" />
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              {req.matrix.evidence || "Evidence sync in progress..."}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="w-1.5 h-3 bg-yellow-400 rounded-full" />
                            Compliance Rational
                          </h4>
                          <div className="p-6 bg-yellow-50/30 rounded-3xl border border-yellow-100">
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              {req.matrix.reasoning || "Analyzing match criteria..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
