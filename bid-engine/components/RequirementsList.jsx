"use client";

import React, { useState } from "react";
import { FileSpreadsheet, ChevronRight, ListFilter, ShieldAlert } from "lucide-react";

export default function RequirementsList({
  requirements = [],
  onSelectRequirement,
}) {
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = ["All", ...new Set(requirements.map((r) => r.category).filter(Boolean))];

  const filteredRequirements =
    filterCategory === "All"
      ? requirements
      : requirements.filter((r) => r.category === filterCategory);

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
      case "mandatory":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "medium":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-sky-50 text-sky-600 border-sky-100";
    }
  };

  const getCategoryBadge = (category) => {
    return "bg-white text-slate-500 border-slate-200";
  };

  return (
    <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] border border-sky-100 shadow-2xl space-y-8" id="bid-requirements-list">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-sky-500 rounded-2xl shadow-xl">
              <FileSpreadsheet className="text-white h-7 w-7" />
            </div>
            Requirement Repository
          </h2>
          <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest px-1">
            Atomic Clauses <span className="text-slate-300 px-2">|</span> Validated by Agentic Swarm
          </p>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <ListFilter className="text-slate-400 h-5 w-5 shrink-0" />
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shrink-0 shadow-inner">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filterCategory === cat
                    ? "bg-white text-sky-600 shadow-md border border-sky-100"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredRequirements.length === 0 ? (
        <div className="text-center py-24 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <ShieldAlert className="h-16 w-16 text-slate-300 mx-auto mb-6 animate-pulse-slow" />
          <p className="text-slate-500 font-extrabold uppercase tracking-widest text-sm">Requirement Catalog Empty</p>
          <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest">Initialize RFP analysis to populate repository</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredRequirements.map((req, index) => (
            <div
              key={req.id || index}
              onClick={() => onSelectRequirement && onSelectRequirement(req)}
              className="bg-white border border-slate-100 hover:border-sky-300 rounded-[2rem] p-8 hover:bg-sky-50/30 transition-all duration-500 cursor-pointer group relative overflow-hidden shadow-sm hover:shadow-xl"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-sky-50 to-transparent pointer-events-none -z-10" />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[10px] font-black tracking-widest text-sky-600 px-4 py-1.5 bg-sky-50 rounded-full border border-sky-100 uppercase">
                      {req.displayId || req.display_id || req.id || `REQ-${index + 1}`}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm ${getSeverityBadge(req.severity)}`}>
                      {req.severity || "Standard"}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm ${getCategoryBadge(req.category)}`}>
                      {req.category || "General"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors duration-300 leading-tight">
                    {req.title || `Requirement ${index + 1}`}
                  </h3>
                </div>

                <button className="hidden sm:inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 bg-sky-50 px-6 py-3 rounded-2xl border border-sky-100 group-hover:shadow-lg">
                  <span>Synthesize</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <p className="text-slate-500 text-[14px] mt-6 leading-relaxed border-t border-slate-50 pt-6 font-medium italic group-hover:text-slate-700 transition-colors">
                "{req.description || req.requirement_text}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
