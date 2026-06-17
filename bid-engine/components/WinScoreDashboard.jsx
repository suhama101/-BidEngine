"use client";

import React from "react";
import { Award, ShieldAlert, RefreshCw, BarChart3, Info, Check, X, Zap, Activity, ShieldCheck, Target, AlertTriangle, ListChecks } from "lucide-react";

export default function WinScoreDashboard({
  activeBidTitle,
  ratingAnalysis = null,
  onPredictScore,
  isPredicting,
  requirements = []
}) {
  if (requirements.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
        <ShieldAlert className="h-16 w-16 text-slate-300 mx-auto mb-6 animate-pulse-slow" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-sm">Win Predictor Offline</p>
        <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest">Initialize RFP analysis to generate telemetry</p>
      </div>
    );
  }

  if (!ratingAnalysis) {
    return (
      <div className="bg-white p-12 rounded-[3rem] border border-sky-100 shadow-2xl flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full blur-3xl -z-10" />
        <div className="p-6 bg-yellow-400 rounded-3xl shadow-xl ring-8 ring-yellow-50">
          <Zap className="h-12 w-12 text-yellow-900 animate-pulse" />
        </div>
        <div className="space-y-3">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Predictive Success Modeling</h3>
          <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">Ready to simulate market-fit telemetry and calculate your victory quotient based on RFP requirements.</p>
        </div>
        <button
          onClick={onPredictScore}
          disabled={isPredicting}
          className="btn-yellow flex items-center justify-center gap-4 py-5 w-72 text-sm"
        >
          {isPredicting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-yellow-900 border-t-transparent rounded-full" />
              RUNNING SIMULATIONS...
            </span>
          ) : (
            <>
              <Zap className="h-5 w-5 fill-current" />
              <span>EXECUTE NEURAL AUDIT</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="win-score-command-center">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Score Gauge */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-sky-100 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 to-yellow-400" />

          <div className="relative z-10 space-y-6 w-full">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-sky-50 rounded-full border border-sky-100 text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 mb-2">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>Predictive Success Probability</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Victory Quotient</h2>

            <div className="relative inline-flex items-center justify-center p-4">
              <svg className="w-56 h-56 transform -rotate-90">
                <circle
                  cx="112" cy="112" r="100"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="16"
                  className="text-slate-50"
                />
                <circle
                  cx="112" cy="112" r="100"
                  fill="transparent"
                  stroke="#0ea5e9"
                  strokeWidth="16"
                  strokeDasharray={628.3}
                  strokeDashoffset={628.3 - (628.3 * (ratingAnalysis?.winScore || 0)) / 100}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-black text-slate-900 tracking-tighter">
                  {ratingAnalysis?.winScore || 0}<span className="text-3xl text-sky-500">%</span>
                </span>
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full mt-4 uppercase tracking-widest border shadow-sm transition-colors ${(ratingAnalysis?.winScore || 0) >= 70
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                  }`}>
                  {ratingAnalysis?.decision || "ANALYSIS OFFLINE"}
                </span>
              </div>
            </div>

            <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed italic">
              "Aggregated likelihood of success based on capability alignment, compliance density, and market-fit telemetry."
            </p>

            <button
              onClick={onPredictScore}
              disabled={isPredicting}
              className="mt-8 btn-primary flex items-center justify-center gap-4 py-5 w-full text-sm"
            >
              {isPredicting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  SIMULATING...
                </span>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  <span>RECALCULATE SCORE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Breakdown Metrics */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Compliance Density", value: ratingAnalysis?.benchmarks?.complianceScore, color: "text-sky-600", bg: "bg-sky-50", icon: ShieldCheck },
            { label: "Capability Alignment", value: ratingAnalysis?.benchmarks?.capabilityMatch, color: "text-blue-600", bg: "bg-blue-50", icon: BarChart3 },
            { label: "Budget Synch", value: ratingAnalysis?.benchmarks?.budgetAlignment, color: "text-yellow-600", bg: "bg-yellow-50", icon: Target },
            { label: "Risk Mitigation", value: ratingAnalysis?.benchmarks?.riskBuffer, color: "text-emerald-600", bg: "bg-emerald-50", icon: AlertTriangle },
          ].map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className={`${metric.bg} p-8 rounded-[2rem] border border-white hover:border-slate-200 transition-all group overflow-hidden relative shadow-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 bg-white rounded-2xl shadow-sm ${metric.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`text-3xl font-black ${metric.color}`}>
                    {metric.value ?? 0}%
                  </span>
                </div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{metric.label}</h4>
                <div className="mt-4 w-full bg-white h-2 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out bg-current ${metric.color}`}
                    style={{ width: `${metric.value ?? 0}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-yellow-400 rounded-2xl shadow-lg">
                <ListChecks className="text-yellow-900 h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Strategic Remedial Vectors</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Neural Advisory Output</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(ratingAnalysis?.remedialActions || ["Awaiting simulation data..."]).map((action, idx) => (
                <div key={idx} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-yellow-200 transition-all">
                  <div className="h-8 w-8 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <span className="text-xs font-black text-yellow-900">{idx + 1}</span>
                  </div>
                  <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
