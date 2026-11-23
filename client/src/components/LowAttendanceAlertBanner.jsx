import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LowAttendanceAlertBanner({ lowAttendanceCourses = [], lowStudentsCount = 0, onNavigateReports }) {
  const { isStudent, isFaculty, isAdmin } = useAuth();

  if (isStudent && lowAttendanceCourses.length > 0) {
    return (
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 p-4 text-white shadow-lg shadow-rose-500/20 border border-rose-400/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-200 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight">ATTENDANCE SHORTAGE WARNING</span>
                <span className="bg-white text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Below 75%
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5 leading-relaxed">
                You have critical attendance shortage in <strong>{lowAttendanceCourses.map(c => `${c.code} (${c.percentage}%)`).join(', ')}</strong>. The minimum institutional threshold is 75% to appear in examinations.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateReports}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-rose-700 font-bold text-xs hover:bg-rose-50 transition-colors shadow-xs"
          >
            <span>View Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if ((isFaculty || isAdmin) && lowStudentsCount > 0) {
    return (
      <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-300/80 p-4 text-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Student Attendance Advisory</span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {lowStudentsCount} At-Risk Student(s)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {lowStudentsCount} enrolled student(s) have fallen below the 75% mandatory attendance threshold across courses.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateReports}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-xs"
          >
            <span>Filter At-Risk Students</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
