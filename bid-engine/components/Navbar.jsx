"use client";

import React, { useState } from "react";
import { FileText, Award, ShieldAlert, LogOut, CheckCircle, Menu, X, Cpu, User } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, userEmail, onSignOut }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "upload", step: "1", label: "Upload RFP", icon: FileText },
    { id: "requirements", step: "2", label: "Requirements", icon: CheckCircle },
    { id: "compliance", step: "3", label: "Compliance Check", icon: ShieldAlert },
    { id: "draft", step: "4", label: "AI Draft", icon: Cpu },
    { id: "score", step: "5", label: "Win Score", icon: Award },
  ];

  return (
    <nav className="w-full bg-white/70 backdrop-blur-xl border-b border-sky-100 sticky top-0 z-50 transition-all duration-500" id="bid-engine-nav">
      {/* Dynamic Progress Indicator (Sticky Header) */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-sky-500 transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(14,165,233,0.5)]"
        style={{ width: `${((menuItems.findIndex(i => i.id === activeTab) + 1) / menuItems.length) * 100}%` }} />

      <div className="px-6 lg:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-12">
          <div className="flex-shrink-0 flex items-center space-x-3 group cursor-pointer">
            <div className="bg-sky-500 p-2 rounded-2xl shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <Cpu className="h-7 w-7 text-white animate-pulse" />
            </div>
            <span className="font-sans font-black text-2xl tracking-tighter text-slate-900 group-hover:text-sky-600 transition-colors">
              BidEngine<span className="text-sky-500">.AI</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab && setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black transition-all duration-300 outline-none cursor-pointer group uppercase tracking-widest ${isActive
                    ? "bg-sky-500 text-white shadow-xl scale-[1.03]"
                    : "text-slate-400 hover:text-slate-900 hover:bg-sky-50"
                    }`}
                >
                  <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Section */}
        <div className="hidden lg:flex items-center space-x-6">
          {userEmail && (
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-2xl shadow-sm group hover:border-sky-200 transition-all">
              <div className="w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center text-yellow-900 shadow-sm transition-transform group-hover:rotate-6">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active Session</span>
                <span className="text-slate-900 text-[10px] font-black font-mono tracking-tight">{userEmail}</span>
              </div>
            </div>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center space-x-2 px-6 py-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-2xl text-xs font-black text-slate-500 hover:text-rose-500 transition-all duration-300 group cursor-pointer shadow-sm"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              <span className="uppercase tracking-widest">Sign Out</span>
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center p-3 rounded-2xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 focus:outline-none transition-all"
          >
            {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-2xl border-b border-sky-100 px-4 pt-4 pb-8 space-y-3 animate-in slide-in-from-top-4 duration-300">
          <div className="px-4 py-3 mb-4 bg-yellow-50 border border-yellow-100 rounded-[1.5rem] flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400 flex items-center justify-center text-yellow-900 shadow-md">
              <User className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-black text-yellow-700 uppercase tracking-widest block">Active Ops Profile</span>
              <span className="text-slate-900 text-xs font-black font-mono truncate block">{userEmail}</span>
            </div>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab && setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-4 w-full px-5 py-4 rounded-[1.5rem] text-sm font-black transition-all uppercase tracking-[0.1em] ${isActive
                  ? "bg-sky-500 text-white shadow-xl"
                  : "text-slate-500 hover:bg-sky-50 hover:text-sky-600"
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-6 mt-6 border-t border-slate-100">
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="flex items-center space-x-4 w-full px-6 py-5 bg-rose-50 text-rose-600 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-sm hover:bg-rose-100 transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span>Terminate Session</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
