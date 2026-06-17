"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, ArrowRight, Zap, Sparkles, FileScan, ShieldCheck, RefreshCw, Cpu } from "lucide-react";

export default function FileUpload({ onTextParsed, isProcessing, initialText = "" }) {
  const [text, setText] = useState(initialText);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const performFileUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bidTitle", file.name.replace(/\.[^.]+$/, ""));

    try {
      const response = await fetch("/api/rfp/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("bid_engine_token")}`
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await response.json();
      if (onTextParsed) {
        // Pass the extracted text and the workspace metadata back to App.tsx
        onTextParsed(data.rawText, data);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      performFileUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      performFileUpload(e.dataTransfer.files[0]);
    }
  };

  const isProcessingCombined = isProcessing || isUploading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 min-h-[600px] animate-in fade-in zoom-in-95 duration-1000" id="file-upload-portal">
      {/* Upload Zone */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-yellow-500 rounded-[3.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="bg-white/95 backdrop-blur-2xl p-12 rounded-[3.5rem] border-2 border-sky-100 shadow-[0_40px_100px_-30px_rgba(14,165,233,0.1)] relative overflow-hidden h-full flex flex-col justify-center text-center space-y-10 group-hover:border-sky-300 transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full blur-3xl -z-10 -translate-y-12 translate-x-12" />

          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-sky-50 rounded-full border border-sky-100 text-[10px] font-black uppercase tracking-[0.3em] text-sky-600 mb-4 animate-pulse-soft">
              <Upload className="h-4 w-4" />
              <span>Secure Document Portal</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
              DEPOSIT YOUR <br />
              <span className="text-vibrant-sky italic">RFP SEQUENCE.</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
              Inject tender documents, technical specifications, or raw RFP text into our neural extraction hive.
            </p>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isProcessingCombined && fileInputRef.current?.click()}
            className={`relative border-4 border-dashed rounded-[3rem] p-16 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center space-y-6 group/drop ${dragActive
              ? "bg-sky-50 border-sky-400 scale-[1.02]"
              : "bg-slate-50/50 border-slate-100 hover:border-sky-200 hover:bg-sky-50/30"
              } ${isProcessingCombined ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt" />
            <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl group-hover/drop:scale-110 group-hover/drop:rotate-6 transition-all duration-500 ring-4 ring-sky-50">
              {isProcessingCombined ? (
                <div className="animate-spin h-12 w-12 border-4 border-sky-500 border-t-transparent rounded-full" />
              ) : (
                <FileScan className={`h-12 w-12 ${dragActive ? 'text-sky-600' : 'text-sky-500'}`} />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black text-slate-800 uppercase tracking-widest">
                {isProcessingCombined ? "Processing Sequence..." : "Drop Master File"}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">DOCX, PDF, or Plaintext Transmissions</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-12 pt-4 opacity-40 group-hover:opacity-100 transition-opacity">
            <ShieldCheck className="h-6 w-6 text-slate-300" />
            <div className="w-px h-6 bg-slate-100" />
            <RefreshCw className="h-6 w-6 text-slate-300" />
            <div className="w-px h-6 bg-slate-100" />
            <Cpu className="h-6 w-6 text-slate-300" />
          </div>
        </div>
      </div>

      {/* Manual Input / Preview */}
      <div className="flex flex-col h-full space-y-10">
        <div className="bg-white/95 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-sky-100 shadow-[0_40px_80px_-20px_rgba(14,165,233,0.08)] space-y-8 relative overflow-hidden flex flex-col h-full group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full blur-2xl -z-10 translate-x-10 -translate-y-10" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-yellow-400 rounded-3xl shadow-xl ring-8 ring-yellow-50 group-hover:rotate-6 transition-transform">
                <FileText className="text-yellow-900 h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">RFP Terminal</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Buffer Sequence</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${text.length > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-300 border-slate-100"}`}>
              {text.length > 0 ? "Data Input Confirmed" : "Buffer Empty"}
            </div>
          </div>

          <div className="flex-grow flex flex-col relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste raw RFP content here for immediate neural classification..."
              className="flex-grow w-full bg-slate-50/50 text-slate-900 p-8 rounded-[2rem] border border-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/5 transition-all text-base font-medium leading-relaxed shadow-inner resize-none custom-scrollbar"
            />

            {text.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 pointer-events-none p-12">
                <Sparkles className="h-16 w-16 mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Neural Hive Awaiting Stream</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onTextParsed && onTextParsed(text)}
            disabled={isProcessingCombined || !text.trim()}
            className="w-full btn-primary py-6 relative overflow-hidden group-buttons"
          >
            {isProcessingCombined ? (
              <span className="flex items-center gap-4 justify-center">
                <span className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" />
                <span className="uppercase tracking-[0.2em] font-black">Analyzing Data Matrix...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-4">
                <Zap className="h-6 w-6 fill-current animate-pulse-soft" />
                <span className="uppercase tracking-[0.2em] font-black">Initiate RFP Extraction</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
