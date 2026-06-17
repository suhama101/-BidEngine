"use client";

import React, { useState } from "react";
import { Lightbulb, Play, ShieldAlert, CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";

export default function ComplianceChecker({
  requirements = [],
  matchMatrix = {},
  onRunMatch,
  isMatching,
}) {
  const [capabilitiesInput, setCapabilitiesInput] = useState("");

  const getGradeStyle = (grade) => {
    switch (grade?.toLowerCase()) {
      case "compliant":
      case "strong":
        return { bg: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 };
      case "partial":
        return { bg: "bg-amber-50 text-amber-600 border-amber-100", icon: AlertCircle };
      case "non-compliant":
      case "fail":
        return { bg: "bg-rose-50 text-rose-600 border-rose-100", icon: XCircle };
      default:
        return { bg: "bg-slate-50 text-slate-400 border-slate-100", icon: Info };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="compliance-checklist-container">
      {/* Capability Profile Setup */}
      <div className="lg:col-span-1 bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] border border-sky-100 shadow-xl space-y-8 h-fit relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
        <div className="pb-6 border-b border-slate-100">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
            <div className="p-3 bg-sky-500 rounded-2xl shadow-xl">
              <Lightbulb className="text-white h-7 w-7" />
            </div>
            Capability Core
          </h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-3 px-1">
            Historical Performance Telemetry
          </p>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3 px-1">
            <div className="w-1.5 h-4 bg-sky-500 rounded-full" />
            Proof Evidence Library
          </label>
          <textarea
            value={capabilitiesInput}
            onChange={(e) => setCapabilitiesInput(e.target.value)}
            placeholder="Paste technical stack, certifications, and project experience..."
            className="w-full h-80 bg-slate-50 text-slate-700 p-6 rounded-3xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/5 font-medium text-sm leading-relaxed shadow-inner"
          />
        </div>

        <button
          onClick={() => onRunMatch && onRunMatch(capabilitiesInput.split("\n").filter(Boolean))}
          disabled={isMatching || requirements.length === 0}
          className="w-full btn-primary py-5 text-sm"
        >
          {isMatching ? (
            <span className="flex items-center justify-center gap-3">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              RUNNING AUDIT...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-4">
              <Play className="h-5 w-5 fill-current" />
              <span>VALIDATE FIT</span>
            </span>
          )}
        </button>
      </div>

      {/* Compliance / Gap Matrix Display */}
      <div className="lg:col-span-2 bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] border border-sky-100 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full blur-3xl -z-10" />
        <div className="pb-6 border-b border-slate-100">
          <h3 className="text-2xl font-black text-slate-900 px-1">Compliance Matrix Architecture</h3>
          <p className="text-slate-400 text-[10px] font-bold px-1 mt-2 uppercase tracking-widest">
            Risk Vectors <span className="text-slate-300 px-2">|</span> Capability Alignment Visualization
          </p>
        </div>

        {requirements.length === 0 ? (
          <div className="text-center py-24 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <ShieldAlert className="h-16 w-16 text-slate-300 mx-auto mb-6 animate-pulse-slow" />
            <p className="text-slate-500 font-extrabold uppercase tracking-widest text-sm">Gap Matrix Offline</p>
            <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest">Initialize document analysis to generate matrix</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[750px] overflow-y-auto pr-3 custom-scrollbar">
            {requirements.map((req) => {
              const matrixItem = matchMatrix[req.id] || {
                matchGrade: "Pending",
                reasoning: "Awaiting capability evaluation.",
                recommendation: "Run capability matching to view strategic advisory comments.",
              };
              const style = getGradeStyle(matrixItem.matchGrade);
              const GradeIcon = style.icon;
              const displayId = req.displayId || req.display_id || req.id;

              return (
                <div key={req.id} className="p-8 bg-white rounded-[2rem] border border-slate-100 group hover:border-sky-300 transition-all duration-500 relative overflow-hidden shadow-sm hover:shadow-lg">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-50 group-hover:bg-sky-500 transition-colors" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-50 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl text-sky-600 border border-slate-100 uppercase">
                        {displayId}
                      </span>
                      <h4 className="text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">{req.title || "Requirement"}</h4>
                    </div>

                    {/* Match Badge */}
                    <div className={`flex items-center gap-3 px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm transition-all duration-500 ${style.bg}`}>
                      <GradeIcon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span>{matrixItem.matchGrade}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-3 bg-slate-200 rounded-full" />
                        Prerequisite Spec
                      </span>
                      <p className="text-slate-600 text-sm leading-relaxed italic">"{req.description || req.requirement_text}"</p>
                    </div>

                    <div className="bg-sky-50/50 p-6 rounded-[1.5rem] border border-sky-100 group-hover:border-sky-300 transition-all shadow-inner">
                      <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-3 bg-sky-500 rounded-full shadow-lg" />
                        AI Strategic Advisory
                      </span>
                      <p className="text-slate-800 text-sm leading-relaxed font-bold">
                        {matrixItem.recommendation || "Pending telemetry validation."}
                      </p>
                    </div>
                  </div>

                  {matrixItem.reasoning && matrixItem.matchGrade !== "Pending" && (
                    <div className="mt-6 text-[13px] bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-500 font-medium">
                      <span className="font-black text-sky-600 mr-2 uppercase tracking-tighter">Synthesis Logic:</span> {matrixItem.reasoning}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
