"use client";

import React, { useState } from "react";
import { ListChecks, Search, Tag, AlertCircle, ArrowRight, Layers, FileSearch, Sparkles } from "lucide-react";

export default function RequirementsList({
  requirements = [],
  onSelectRequirement,
}) {
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = ["All", ...new Set(requirements.map((r) => r.category).filter(Boolean))];

  const filtered = requirements.filter((r) => {
    const matchesSearch =
      (r.title || "").toLowerCase().includes(filter.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white/95 backdrop-blur-2xl p-10 rounded-[4rem] border border-sky-100 shadow-[0_40px_100px_-30px_rgba(14,165,233,0.1)] space-y-10 animate-in fade-in duration-1000" id="bid-requirements-list">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <div className="bg-sky-500 p-4 rounded-3xl shadow-xl ring-8 ring-sky-50 transition-transform hover:rotate-3">
            <ListChecks className="text-white h-7 w-7" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Requirements Registry</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Decomposed Logical Units</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-sky-500 transition-colors" />
            <input
              type="text"
              placeholder="Search specifications..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all w-full sm:w-64 placeholder:text-slate-300"
            />
          </div>

          <div className="relative group">
            <Tag className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-yellow-500 transition-colors" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-14 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 appearance-none transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-10 bg-slate-50 rounded-full animate-pulse-soft">
              <FileSearch className="h-16 w-16 text-slate-200" />
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No sequence matches found</p>
              <p className="text-slate-300 text-[10px] uppercase font-bold">Try adjusting your filters or re-extracting RFP text</p>
            </div>
          </div>
        ) : (
          filtered.map((req, index) => (
            <div
              key={req.id}
              onClick={() => onSelectRequirement && onSelectRequirement(req)}
              className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 hover:border-sky-300 transition-all duration-500 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(14,165,233,0.15)] cursor-pointer relative overflow-hidden flex flex-col h-full active:scale-[0.97]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />

              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100 uppercase tracking-widest">
                  {req.category || "General"}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${req.severity === 'Critical'
                    ? "bg-rose-50 text-rose-500 border-rose-100"
                    : "bg-emerald-50 text-emerald-500 border-emerald-100"
                  }`}>
                  {req.severity || "Standard"}
                </span>
              </div>

              <h4 className="text-xl font-black text-slate-900 leading-tight mb-4 group-hover:text-sky-600 transition-colors">
                {req.title || `Requirement ${index + 1}`}
              </h4>

              <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3 mb-8 flex-grow">
                {req.description || "The exact requirement statement extracted from the source document."}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 group-hover:scale-125 transition-transform" />
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{req.displayId || `R-${index + 1}`}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-sky-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                  <span className="uppercase tracking-widest">Draft Response</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
