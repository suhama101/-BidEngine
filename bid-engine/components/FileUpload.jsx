"use client";

import React, { useState } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle, PlayCircle, ShieldCheck, Sparkles, Cpu } from "lucide-react";

export default function FileUpload({
  onTextParsed,
  isProcessing,
  initialText = "",
}) {
  const [inputText, setInputText] = useState(initialText);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => setInputText(event.target.result);
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => setInputText(event.target.result);
      reader.readAsText(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="file-upload-interface">
      {/* Upload Zone */}
      <div className="space-y-6">
        <div className="bg-white/90 backdrop-blur-md p-10 rounded-[3rem] border-2 border-sky-100 shadow-2xl relative overflow-hidden h-full flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full blur-3xl -z-10" />
          <div className="flex items-center gap-5 transition-all mb-8">
            <div className="bg-sky-500 p-4 rounded-3xl shadow-xl ring-8 ring-sky-50">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">RFP Ingestion</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Neural Parsing Enabled</span>
              </div>
            </div>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex-grow border-2 border-dashed rounded-[2.5rem] transition-all duration-500 flex flex-col items-center justify-center p-10 space-y-6 relative overflow-hidden group ${dragActive
                ? "border-sky-500 bg-sky-50 scale-[1.01]"
                : "border-slate-200 bg-slate-50/50 hover:border-sky-300 hover:bg-sky-50/30"
              }`}
          >
            <div className="p-8 bg-white rounded-[2rem] shadow-xl group-hover:scale-110 transition-transform duration-500">
              <FileText className={`h-16 w-16 transition-colors duration-500 ${dragActive ? "text-sky-500" : "text-slate-300 group-hover:text-sky-400"}`} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-black text-slate-900 uppercase tracking-tight">Drop Specification Here</p>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">or click to browse local storage</p>
            </div>

            <input
              type="file"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".txt,.md,.pdf,.docx"
            />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: CheckCircle, label: "Structural Validation", color: "text-emerald-500" },
              { icon: ShieldCheck, label: "Security Audit", color: "text-sky-500" },
              { icon: Sparkles, label: "Entity Extraction", color: "text-yellow-500" }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center text-center space-y-2 shadow-sm">
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor/Processor Zone */}
      <div className="space-y-6">
        <div className="bg-white/90 backdrop-blur-md p-10 rounded-[3rem] border border-sky-100 shadow-2xl space-y-8 relative overflow-hidden flex flex-col h-full">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-50 rounded-full blur-3xl -z-10" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-400 rounded-2xl shadow-lg ring-4 ring-yellow-50">
                <Cpu className="text-yellow-900 h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Specification Workshop</h3>
            </div>
            <button
              onClick={() => setInputText("")}
              className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-2xl transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-grow">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Synchronize RFP plaintext here for neural processing..."
              className="w-full h-full min-h-[400px] bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/5 text-lg leading-relaxed text-slate-800 font-medium resize-none shadow-inner custom-scrollbar"
            />
          </div>

          <button
            onClick={() => onTextParsed && onTextParsed(inputText)}
            disabled={isProcessing || !inputText.trim()}
            className="w-full btn-primary py-5 text-sm flex items-center justify-center gap-4 active:scale-[0.98] mt-4"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" />
                <span>SYNCHRONIZING WITH LLAMA-3.3...</span>
              </>
            ) : (
              <>
                <PlayCircle className="h-7 w-7" />
                <span className="text-lg">INITIALIZE RFP AUDIT</span>
                <Sparkles className="h-5 w-5 animate-pulse" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
