"use client";

import React from "react";
import { Award, ShieldAlert, RefreshCw, BarChart3, Info, Check, X, Zap, Activity, ShieldCheck, Target, AlertTriangle, ListChecks, ArrowUpRight, TrendingUp } from "lucide-react";

export default function WinScoreDashboard({
  activeBidTitle,
  ratingAnalysis = null,
  onPredictScore,
  isPredicting,
  requirements = []
}) {
  if (requirements.length === 0) {
    return (
      <div className="text-center py-40 bg-white/95 backdrop-blur-2xl rounded-[4rem] border-2 border-dashed border-sky-100 shadow-xl flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
        <div className="p-10 bg-slate-50 rounded-full">
          <ShieldAlert className="h-20 w-20 text-slate-200 animate-pulse-soft" />
        </div>
        <div className="space-y-3">
          <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">Win Predictor Offline</p>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] bg-slate-50 px-6 py-2 rounded-full">Initialize RFP sequences to generate telemetry</p>
        </div>
      </div>
    );
  }

  if (!ratingAnalysis) {
    return (
      <div className="bg-white/95 backdrop-blur-2xl p-20 rounded-[4rem] border border-sky-100 shadow-[0_40px_100px_-30px_rgba(14,165,233,0.1)] flex flex-col items-center justify-center text-center space-y-12 relative overflow-hidden animate-in zoom-in-95 duration-1000">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-50 rounded-full blur-[100px] -z-10 translate-x-20 -translate-y-20 opacity-50" />

        <div className="relative">
          <div className="absolute inset-0 bg-yellow-400 rounded-full blur-[40px] opacity-20 animate-pulse" />
          <div className="p-10 bg-yellow-400 rounded-[3rem] shadow-2xl ring-12 ring-yellow-50 relative z-10 transition-transform hover:scale-110 active:scale-95 duration-500">
            <Zap className="h-16 w-16 text-yellow-900 fill-current" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-5xl font-black text-slate-900 tracking-tighter">Win-Probability <br /><span className="text-vibrant-sky">Telemetry.</span></h3>
          <p className="text-slate-500 text-base font-medium max-w-sm mx-auto leading-relaxed">Ready to simulate market-fit dynamics and calculate your victory quotient based on RFP requirements.</p>
        </div>

        <button
          onClick={onPredictScore}
          disabled={isPredicting}
          className="btn-yellow flex items-center justify-center gap-6 py-6 w-96 text-sm group"
        >
          {isPredicting ? (
            <RefreshCw className="h-6 w-6 animate-spin" />
          ) : (
            <TrendingUp className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          )}
          <span className="uppercase tracking-[0.2em] font-black">
            {isPredicting ? "Running Simulations..." : "Execute Victory Audit"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000" id="win-score-command-center">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Main Score Gauge */}
        <div className="lg:col-span-2 bg-white/95 backdrop-blur-2xl p-12 rounded-[4rem] border border-sky-100 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-blue-500 to-yellow-400" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-sky-50 rounded-full blur-[80px] -z-10" />

          <div className="relative z-10 space-y-10 w-full">
            <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-sky-50 rounded-full border border-sky-100 text-[11px] font-black uppercase tracking-[0.3em] text-sky-600 mb-2">
              <Activity className="h-5 w-5 animate-pulse" />
              <span>Neural Victory Engine</span>
            </div>

            <div className="relative inline-flex items-center justify-center p-6 group">
              <div className="absolute inset-0 bg-sky-500/5 rounded-full blur-[60px] scale-0 group-hover:scale-100 transition-transform duration-1000" />
              <svg className="w-72 h-72 transform -rotate-90 drop-shadow-[0_10px_20px_rgba(14,165,233,0.1)]">
                <circle
                  cx="144" cy="144" r="130"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="20"
                  className="text-slate-50"
                />
                <circle
                  cx="144" cy="144" r="130"
                  fill="transparent"
                  stroke="url(#victory-gradient)"
                  strokeWidth="20"
                  strokeDasharray={816.8}
                  strokeDashoffset={816.8 - (816.8 * (ratingAnalysis?.winScore || 0)) / 100}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="victory-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-8xl font-black text-slate-900 tracking-tighter tabular-nums">
                  {ratingAnalysis?.winScore || 0}<span className="text-4xl text-sky-500 font-black">%</span>
                </span>
                <span className={`text-[12px] font-black px-8 py-2.5 rounded-2xl mt-8 uppercase tracking-[0.4em] border shadow-xl transition-all duration-500 ${(ratingAnalysis?.winScore || 0) >= 70
                  ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-200"
                  : "bg-rose-500 text-white border-rose-400 shadow-rose-200"
                  }`}>
                  {ratingAnalysis?.decision || "ANALYSIS_OFFLINE"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Victory Quotient</h2>
              <p className="text-slate-400 text-xs font-bold max-w-sm mx-auto leading-relaxed italic px-4">
                "Aggregated likelihood of success based on capability alignment, compliance density, and market-fit telemetry."
              </p>
            </div>

            <button
              onClick={onPredictScore}
              disabled={isPredicting}
              className="mt-12 btn-primary w-full py-6 group"
            >
              <RefreshCw className={`h-6 w-6 ${isPredicting ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
              <span className="uppercase tracking-[0.2em] font-black">
                {isPredicting ? "Recalculating Telemetry..." : "Recalculate Win Prediction"}
              </span>
            </button>
          </div>
        </div>

        {/* Breakdown Metrics */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: "Compliance Density", value: ratingAnalysis?.benchmarks?.complianceScore, color: "text-sky-600", bg: "bg-sky-50", icon: ShieldCheck },
              { label: "Capability Alignment", value: ratingAnalysis?.benchmarks?.capabilityMatch, color: "text-blue-600", bg: "bg-blue-50", icon: BarChart3 },
              { label: "Budget Synch", value: ratingAnalysis?.benchmarks?.budgetAlignment, color: "text-yellow-600", bg: "bg-yellow-50", icon: Target },
              { label: "Risk Mitigation", value: ratingAnalysis?.benchmarks?.riskBuffer, color: "text-emerald-600", bg: "bg-emerald-50", icon: AlertTriangle },
            ].map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className={`${metric.bg}/40 backdrop-blur-md p-10 rounded-[3rem] border border-white hover:border-sky-200 transition-all group overflow-hidden relative shadow-sm hover:shadow-xl`}>
                  <div className="flex items-center justify-between mb-8">
                    <div className={`p-4 bg-white rounded-2xl shadow-xl ${metric.color} transition-transform group-hover:rotate-6`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <span className={`text-4xl font-black ${metric.color} block tracking-tighter`}>
                        {metric.value ?? 0}%
                      </span>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Efficiency Load</span>
                    </div>
                  </div>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{metric.label}</h4>
                  <div className="w-full bg-white/80 h-3 rounded-full overflow-hidden shadow-inner border border-slate-50">
                    <div
                      className={`h-full rounded-full transition-all duration-1500 cubic-bezier(0.34, 1.56, 0.64, 1) bg-current ${metric.color}`}
                      style={{ width: `${metric.value ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white/95 backdrop-blur-2xl p-10 rounded-[4rem] border border-sky-100 shadow-2xl space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp className="h-32 w-32 text-sky-500" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-yellow-400 rounded-3xl shadow-xl ring-8 ring-yellow-50">
                  <ListChecks className="text-yellow-900 h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Strategic Remediation Matrix</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                    Neural Advisory Sequence
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-3 px-6 py-3 bg-slate-50 hover:bg-sky-50 rounded-2xl border border-slate-100 text-sky-600 text-[10px] font-black uppercase tracking-widest transition-all">
                <span>View Full Context</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {(ratingAnalysis?.remedialActions || ["Awaiting simulation data..."]).map((action, idx) => (
                <div key={idx} className="flex items-start gap-6 p-7 bg-slate-50/50 hover:bg-white rounded-[2.5rem] border border-slate-100 hover:border-yellow-200 transition-all duration-500 group/item shadow-sm hover:shadow-lg">
                  <div className="h-10 w-10 rounded-2xl bg-yellow-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xl group-hover/item:rotate-12 transition-transform">
                    <span className="text-sm font-black text-yellow-900">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-slate-700 font-bold leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
