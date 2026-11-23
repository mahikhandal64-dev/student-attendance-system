import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileDown, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Calendar, 
  BookOpen, 
  Users, 
  Sparkles,
  RefreshCw,
  TrendingDown,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function AttendanceReports() {
  const { user, isStudent, canMarkAttendance } = useAuth();
  const { triggerRecalculateAlerts, showToast } = useNotifications();

  // Filter States
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState('student-wise'); // 'student-wise' | 'subject-wise' | 'detailed-logs'

  // Data States
  const [courses, setCourses] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Search keyword for table
  const [searchKeyword, setSearchKeyword] = useState('');

  // 1. Initial Load: Courses & Students directory
  useEffect(() => {
    Promise.all([
      api.getCourses(),
      canMarkAttendance ? api.getStudents().catch(() => []) : Promise.resolve([])
    ]).then(([courseData, studentData]) => {
      setCourses(courseData || []);
      setStudentsList(studentData || []);
    });
  }, [canMarkAttendance]);

  // 2. Fetch reports when filters change
  useEffect(() => {
    fetchReportData();
  }, [selectedCourseId, selectedStudentId, startDate, endDate, lowOnly]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const data = await api.getReports({
        course_id: selectedCourseId,
        student_id: selectedStudentId,
        start_date: startDate,
        end_date: endDate,
        low_attendance_only: lowOnly
      });
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      setExporting(true);
      await api.downloadCsv({
        course_id: selectedCourseId,
        student_id: selectedStudentId,
        start_date: startDate,
        end_date: endDate
      });
      showToast('Attendance report CSV downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to download CSV: ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await triggerRecalculateAlerts();
      await fetchReportData();
    } finally {
      setRecalculating(false);
    }
  };

  const clearFilters = () => {
    setSelectedCourseId('');
    setSelectedStudentId('');
    setStartDate('');
    setEndDate('');
    setLowOnly(false);
    setSearchKeyword('');
  };

  // Filtered Student List
  const filteredStudentStats = (reports?.studentStats || []).filter(s => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    return s.name.toLowerCase().includes(kw) || 
           s.email.toLowerCase().includes(kw) || 
           (s.roll_number && s.roll_number.toLowerCase().includes(kw));
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Attendance Analytics & Reporting Engine</span>
            <span>•</span>
            <span>Built by Mahi & Team</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Attendance Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track student-wise & subject-wise percentages, flag attendance below 75%, and export CSV records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-102 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{exporting ? 'Generating CSV...' : 'Download CSV Export'}</span>
          </button>

          {canMarkAttendance && (
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              title="Recalculate <75% Low Attendance Alerts"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Recalculate Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-600" />
            Report Filters
          </span>
          {(selectedCourseId || selectedStudentId || startDate || endDate || lowOnly) && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-800"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Filter 1: Subject / Course */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Filter by Subject:
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            >
              <option value="">All Subjects</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Student (Faculty/Admin) */}
          {canMarkAttendance && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Filter by Student:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              >
                <option value="">All Students</option>
                {studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.roll_number || 'STU'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter 3: Date Range Start */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              From Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
          </div>

          {/* Filter 4: Date Range End */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              To Date:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
          </div>

        </div>

        {/* Low Attendance Toggle checkbox */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
            />
            <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Only show students below mandatory 75% attendance threshold
            </span>
          </label>

          <span className="text-[11px] text-slate-400 font-medium">
            Threshold: 75% • Below 75% triggers alert warnings
          </span>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('student-wise')}
          className={`py-2.5 px-4 text-xs font-extrabold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'student-wise'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student-Wise Summary</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-bold">
            {reports?.studentStats?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('subject-wise')}
          className={`py-2.5 px-4 text-xs font-extrabold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'subject-wise'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subject-Wise Summary</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-bold">
            {reports?.courseStats?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('detailed-logs')}
          className={`py-2.5 px-4 text-xs font-extrabold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'detailed-logs'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Detailed Session Logs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-bold">
            {reports?.records?.length || 0}
          </span>
        </button>
      </div>

      {/* Tab 1: Student-Wise Summary */}
      {activeTab === 'student-wise' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Student Attendance Table</span>
              <span className="text-[11px] text-slate-400">({filteredStudentStats.length} students listed)</span>
            </div>

            {/* Quick search input */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Search by name, roll no..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4 text-center">Total Sessions</th>
                  <th className="py-3 px-4 text-center">Attended</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-center">Status Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudentStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No student records match the active criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudentStats.map((s) => {
                    const isLow = s.percentage < 75;

                    return (
                      <tr 
                        key={s.student_id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isLow ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-xs">{s.name}</div>
                          <div className="text-[11px] text-slate-500">{s.email} • {s.department}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {s.roll_number || 'STU-2024'}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {s.total_classes}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {s.attended_classes}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            ({s.present_count}P + {s.late_count}L)
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`font-bold px-2 py-0.5 rounded-md ${
                            s.absent_count > 0 ? 'bg-rose-50 text-rose-700' : 'text-slate-400'
                          }`}>
                            {s.absent_count}
                          </span>
                        </td>

                        {/* Percentage Gauge Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className={`text-sm font-black ${
                              s.percentage >= 85 ? 'text-emerald-600' :
                              s.percentage >= 75 ? 'text-indigo-600' : 'text-rose-600 font-extrabold'
                            }`}>
                              {s.percentage}%
                            </span>
                          </div>
                          {/* Mini Progress */}
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                s.percentage >= 85 ? 'bg-emerald-500' :
                                s.percentage >= 75 ? 'bg-indigo-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, s.percentage))}%` }}
                            />
                          </div>
                        </td>

                        {/* Status Flag */}
                        <td className="py-3.5 px-4 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>⚠️ SHORTAGE (&lt;75%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Eligible (≥75%)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Subject-Wise Summary */}
      {activeTab === 'subject-wise' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(reports?.courseStats || []).map((c) => {
            const isLow = c.percentage < 75;

            return (
              <div 
                key={c.id} 
                className={`p-5 rounded-3xl bg-white border shadow-xs space-y-3 transition-all ${
                  isLow ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-indigo-700">{c.code}</span>
                      <span className="text-slate-300">•</span>
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">{c.name}</h3>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Faculty: {c.faculty_name || 'Assigned'} • Schedule: {c.schedule}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    c.percentage >= 85 ? 'bg-emerald-100 text-emerald-800' :
                    c.percentage >= 75 ? 'bg-indigo-100 text-indigo-800' :
                    'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {c.percentage}% Avg
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-slate-400 z-10" title="75% Threshold" />
                  <div 
                    className={`h-full rounded-full ${
                      c.percentage >= 85 ? 'bg-emerald-500' :
                      c.percentage >= 75 ? 'bg-indigo-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, c.percentage))}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Sessions</span>
                    <span className="font-extrabold text-slate-800">{c.total_sessions || 0}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Present</span>
                    <span className="font-extrabold text-emerald-600">{c.present_count || 0}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Absent</span>
                    <span className="font-extrabold text-rose-600">{c.absent_count || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Detailed Session Logs */}
      {activeTab === 'detailed-logs' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Detailed Verification Logs</span>
            <span className="text-[11px] text-slate-400">Showing up to recent 150 entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll No.</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(reports?.records || []).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {r.date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{r.course_code}</span>
                      <span className="text-[11px] text-slate-400 block truncate">{r.course_name}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {r.student_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {r.roll_number || 'STU'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        r.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'late' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic">
                      {r.remarks || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {r.marked_by_name || 'Faculty'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
