import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CalendarCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Users, 
  ArrowRight, 
  FileDown, 
  Sparkles,
  RefreshCw,
  BellRing,
  TrendingUp,
  ShieldCheck,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import LowAttendanceAlertBanner from '../components/LowAttendanceAlertBanner';

export default function Dashboard({ setCurrentTab, onOpenAbout }) {
  const { user, isAdmin, isFaculty, isStudent, canMarkAttendance } = useAuth();
  const { announcements, triggerRecalculateAlerts } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [reports, courseList, sysInfo] = await Promise.all([
        api.getReports(),
        api.getCourses(isFaculty),
        api.getSystemInfo().catch(() => null)
      ]);
      setReportData(reports);
      setCourses(courseList || []);
      setSystemStats(sysInfo);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await triggerRecalculateAlerts();
      await loadDashboardData();
    } finally {
      setRecalculating(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      await api.downloadCsv();
    } catch (err) {
      alert('Failed to download CSV: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading campus attendance metrics...</p>
        </div>
      </div>
    );
  }

  // Calculate Student-specific figures if student
  const studentStats = reportData?.studentStats?.[0];
  const overallPercentage = isStudent 
    ? (studentStats?.percentage ?? 100)
    : (reportData?.summary?.overall_percentage ?? 100);

  const lowAttendanceCourses = (reportData?.courseStats || []).filter(c => c.is_low_attendance);
  const lowStudentsCount = reportData?.summary?.low_attendance_count || 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Welcome Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold mb-2">
            <span className="capitalize">{user?.role} Portal</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Built by Mahi & Team
              <Sparkles className="w-3 h-3 text-amber-500" />
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {isStudent && `Roll No: ${user?.student_id || 'STU-2024'} • Department: ${user?.department || 'Computer Science'}`}
            {isFaculty && `Faculty Department: ${user?.department || 'Computer Science'} • Today's lectures are ready to mark.`}
            {isAdmin && `Campus Administrative Overview • Real-time synchronization active.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {canMarkAttendance && (
            <button
              onClick={() => setCurrentTab('mark-attendance')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mark Today's Attendance</span>
            </button>
          )}

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition-colors"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Download CSV</span>
          </button>

          {canMarkAttendance && (
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              title="Recalculate <75% Low Attendance Alerts"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Recalculate Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Low Attendance Warning Alert Banner */}
      <LowAttendanceAlertBanner
        lowAttendanceCourses={lowAttendanceCourses}
        lowStudentsCount={lowStudentsCount}
        onNavigateReports={() => setCurrentTab('reports')}
      />

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Overall Percentage / Status */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isStudent ? 'Your Overall Attendance' : 'Campus Attendance Rate'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              overallPercentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {overallPercentage >= 75 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black tracking-tight ${
                overallPercentage >= 85 ? 'text-emerald-600' :
                overallPercentage >= 75 ? 'text-indigo-600' : 'text-rose-600'
              }`}>
                {overallPercentage}%
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                overallPercentage >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
              }`}>
                {overallPercentage >= 75 ? 'Eligible (≥75%)' : 'Shortage Alert (<75%)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {overallPercentage >= 75 ? 'Above mandatory threshold' : 'Immediate attention required'}
            </p>
          </div>
        </div>

        {/* Metric 2: Classes Attended / Enrolled */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isStudent ? 'Attended Classes' : 'Active Courses'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {isStudent ? (studentStats?.attended_classes ?? 0) : courses.length}
              </span>
              {isStudent && (
                <span className="text-xs text-slate-500 font-semibold">
                  / {studentStats?.total_classes ?? 0} total sessions
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isStudent 
                ? `${studentStats?.present_count || 0} Present • ${studentStats?.late_count || 0} Late` 
                : `${systemStats?.stats?.courses || courses.length} total active curriculum subjects`}
            </p>
          </div>
        </div>

        {/* Metric 3: Absences / Students Enrolled */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isStudent ? 'Classes Missed (Absent)' : 'Total Students'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isStudent ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
            }`}>
              {isStudent ? <Clock className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {isStudent ? (studentStats?.absent_count ?? 0) : (systemStats?.stats?.students || 6)}
              </span>
              {isStudent && (
                <span className="text-xs text-rose-600 font-bold">
                  absences
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isStudent 
                ? 'Absences count against your 75% quota' 
                : 'Enrolled across all semester courses'}
            </p>
          </div>
        </div>

        {/* Metric 4: Low Attendance Flag Count */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isStudent ? 'Shortage Warning Courses' : 'Students Below 75%'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              (isStudent ? lowAttendanceCourses.length : lowStudentsCount) > 0 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black tracking-tight ${
                (isStudent ? lowAttendanceCourses.length : lowStudentsCount) > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {isStudent ? lowAttendanceCourses.length : lowStudentsCount}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                (isStudent ? lowAttendanceCourses.length : lowStudentsCount) > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {(isStudent ? lowAttendanceCourses.length : lowStudentsCount) > 0 ? 'Needs Attention' : 'All Clear'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Automated notifications dispatched to students
            </p>
          </div>
        </div>

      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Course Attendance Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {isStudent ? 'Course-Wise Attendance Breakdown' : 'Curriculum Course Attendance Rates'}
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time status based on recorded lecture sessions
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('reports')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Full Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {reportData?.courseStats?.map((course) => {
                const pct = course.percentage;
                const isShortage = pct < 75;

                return (
                  <div 
                    key={course.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{course.code}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-slate-700 text-xs truncate max-w-xs">{course.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Faculty: {course.faculty_name || 'Assigned Professor'} • Room: {course.room}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-black ${
                          pct >= 85 ? 'text-emerald-600' :
                          pct >= 75 ? 'text-indigo-600' : 'text-rose-600'
                        }`}>
                          {pct}%
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isShortage 
                            ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isShortage ? '⚠️ < 75% Warning' : 'Safe'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden relative">
                      {/* 75% threshold marker line */}
                      <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-slate-400/80 z-10" title="75% Minimum Threshold" />
                      
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                          pct >= 75 ? 'bg-gradient-to-r from-indigo-500 to-violet-500' :
                          'bg-gradient-to-r from-rose-500 to-red-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>{course.attended_classes || 0} attended of {course.total_sessions || course.total_records || 0} classes</span>
                      <span>Required for exam: 75%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Attendance Logs Snippet */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Recent Attendance Logs
                </h2>
                <p className="text-xs text-slate-500">Latest session verifications</p>
              </div>
              <button
                onClick={() => setCurrentTab('reports')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                View History
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {reportData?.records?.slice(0, 5).map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{r.course_code}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 truncate">{r.student_name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{r.date} • {r.remarks || 'Standard session'}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                    r.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                    r.status === 'late' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Campus Announcements & System Status */}
        <div className="space-y-6">
          
          {/* Announcements Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Campus Notices</h3>
                  <span className="text-[11px] text-slate-400">Official bulletins</span>
                </div>
              </div>
              <button
                onClick={() => setCurrentTab('notifications')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                All
              </button>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-slate-900 text-xs">{a.title}</h4>
                    {a.priority === 'high' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-md">
                        High
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                    {a.content}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    By {a.author_name} {a.course_code ? `• ${a.course_code}` : '• Campus-wide'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Info & Credits Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white rounded-3xl p-6 shadow-md shadow-indigo-900/20 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-white/20 text-white">
                Engineered Solution
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Student Attendance System</h3>
              <p className="text-xs text-indigo-200 mt-1 flex items-center gap-1 font-semibold">
                Built by Mahi and Team
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </p>
            </div>
            <p className="text-xs text-indigo-100/90 leading-relaxed">
              Featuring SQLite zero-setup database with WAL mode, duplicate-entry protection, automatic low-attendance notifications (&lt;75%), and CSV generation.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenAbout}
                className="w-full py-2 px-3 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs transition-colors shadow-xs"
              >
                View System Architecture & Team
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
