import React from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Database, Cpu, Layers } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Project Showcase
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Student Attendance System</h2>
          <p className="text-indigo-200 text-sm mt-1 flex items-center gap-1.5 font-medium">
            Designed & Built by Mahi and Team
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-300" />
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Team Recognition Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Developed by Mahi and Team</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                A robust, enterprise-grade attendance solution engineered for educational institutions. Featuring real-time marking, automated low-attendance warnings (&lt;75%), role-based permissions, and instant CSV reporting.
              </p>
            </div>
          </div>

          {/* Core Feature Highlights */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Included Core Capabilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Role-Based Authentication
                </div>
                <p className="text-slate-500 text-[11px]">
                  Admin, Faculty, and Student tiers with JWT tokens & bcrypt hashed passwords.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Interactive Attendance Marking
                </div>
                <p className="text-slate-500 text-[11px]">
                  Course & date picker, Present/Late/Absent toggles, "Mark All Present" helper, and duplicate-entry protection.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Automated Low-Attendance Alerts
                </div>
                <p className="text-slate-500 text-[11px]">
                  Instant alerts for students below 75% attendance threshold with recalculate triggers.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Reports & CSV Export
                </div>
                <p className="text-slate-500 text-[11px]">
                  Student-wise and subject-wise metrics, total vs attended classes, and 1-click CSV download.
                </p>
              </div>
            </div>
          </div>

          {/* Architecture info */}
          <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Zero-Configuration Architecture
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Powered by Node.js built-in <strong>SQLite (DatabaseSync)</strong> running in WAL mode. Requires no external database servers or complex configuration. The Express backend serves the React production bundle from <code className="bg-white px-1.5 py-0.5 rounded text-indigo-700">../client/dist</code> with SPA fallback.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Close Window
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
