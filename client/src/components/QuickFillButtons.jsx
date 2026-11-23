import React from 'react';
import { Shield, GraduationCap, AlertTriangle, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function QuickFillButtons({ onQuickLogin, onFillFields, disabled }) {
  const { demoUsers } = useAuth();

  const getRoleIcon = (role, email) => {
    if (role === 'admin') return <Shield className="w-5 h-5 text-purple-600" />;
    if (role === 'faculty') return <UserCheck className="w-5 h-5 text-indigo-600" />;
    if (email.includes('rohit')) return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    return <GraduationCap className="w-5 h-5 text-emerald-600" />;
  };

  const getCardBorder = (role, email) => {
    if (role === 'admin') return 'border-purple-200 hover:border-purple-400 bg-purple-50/30';
    if (role === 'faculty') return 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/30';
    if (email.includes('rohit')) return 'border-rose-200 hover:border-rose-400 bg-rose-50/40';
    return 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/30';
  };

  const getBadgeStyle = (role, email) => {
    if (role === 'admin') return 'bg-purple-100 text-purple-700';
    if (role === 'faculty') return 'bg-indigo-100 text-indigo-700';
    if (email.includes('rohit')) return 'bg-rose-100 text-rose-700 font-bold animate-pulse';
    return 'bg-emerald-100 text-emerald-700';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          Pre-Seeded Demo Accounts (1-Click Login)
        </label>
        <span className="text-[11px] text-slate-400 font-medium">Click to test instantly</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {demoUsers.map((u, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-2xl border transition-all text-left group relative ${getCardBorder(u.role, u.email)}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center shrink-0">
                  {getRoleIcon(u.role, u.email)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{u.name}</h4>
                  <span className="text-[10px] text-slate-500 truncate block">{u.email}</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${getBadgeStyle(u.role, u.email)}`}>
                {u.badge}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 line-clamp-1 mb-2.5">
              {u.description}
            </p>

            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/50">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onQuickLogin(u)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <span>Instant Sign In</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
              
              <button
                type="button"
                disabled={disabled}
                onClick={() => onFillFields(u.email, u.password)}
                className="py-1.5 px-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors"
                title="Fill credentials into form"
              >
                Fill
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
