import React from 'react';
import { Heart, Sparkles, Database, ShieldCheck, Code, Layers } from 'lucide-react';

export default function Footer({ onOpenAbout }) {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/80 backdrop-blur-sm text-slate-600 text-xs py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Main byline */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Student Attendance System</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-indigo-600">
              Built by Mahi and Team
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
            </span>
          </div>

          {/* Tech Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
              <Code className="w-3 h-3 text-indigo-500" />
              React + Vite
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
              <Layers className="w-3 h-3 text-sky-500" />
              Tailwind CSS
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
              <Database className="w-3 h-3 text-emerald-500" />
              Node.js + SQLite WAL
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Ready & Live
            </span>
          </div>

          {/* Right link */}
          <div>
            <button
              onClick={onOpenAbout}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors underline decoration-slate-300 hover:decoration-indigo-500"
            >
              System & Team Info
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}
