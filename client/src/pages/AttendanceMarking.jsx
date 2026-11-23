import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save, 
  Users, 
  Sparkles, 
  AlertTriangle,
  RotateCcw,
  CheckCheck,
  ShieldCheck,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function AttendanceMarking() {
  const { user, isFaculty } = useAuth();
  const { showToast, triggerRecalculateAlerts } = useNotifications();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Load courses
  useEffect(() => {
    api.getCourses(isFaculty)
      .then((data) => {
        setCourses(data || []);
        if (data && data.length > 0) {
          setSelectedCourseId(String(data[0].id));
        }
      })
      .catch((err) => setErrorMsg('Failed to load courses: ' + err.message));
  }, [isFaculty]);

  // 2. Load attendance sheet whenever course or date changes
  useEffect(() => {
    if (!selectedCourseId || !selectedDate) return;
    loadSheet(selectedCourseId, selectedDate);
  }, [selectedCourseId, selectedDate]);

  const loadSheet = async (courseId, date) => {
    setLoadingSheet(true);
    setErrorMsg('');
    setSaveSuccessMsg('');
    try {
      const data = await api.getAttendanceSheet(courseId, date);
      setStudents(data.students || []);
      setIsAlreadyMarked(data.is_already_marked || false);
    } catch (err) {
      console.error('Error loading attendance sheet:', err);
      setErrorMsg(err.message || 'Failed to load attendance roster.');
    } finally {
      setLoadingSheet(false);
    }
  };

  // Toggle individual student status
  const handleStatusChange = (studentId, status) => {
    setStudents(prev =>
      prev.map(s => (s.student_id === studentId ? { ...s, status } : s))
    );
  };

  // Change individual student remarks
  const handleRemarksChange = (studentId, remarks) => {
    setStudents(prev =>
      prev.map(s => (s.student_id === studentId ? { ...s, remarks } : s))
    );
  };

  // Helper 1: Mark All Present
  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
    showToast('All enrolled students set to Present!', 'success');
  };

  // Helper 2: Mark All Absent
  const handleMarkAllAbsent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'absent' })));
    showToast('All enrolled students set to Absent!', 'warning');
  };

  // Quick Date Helpers
  const setToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Save / Update Attendance Submission
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedDate) {
      setErrorMsg('Please select course and date.');
      return;
    }

    if (students.length === 0) {
      setErrorMsg('No students found to mark attendance for.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSaveSuccessMsg('');

    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        status: s.status,
        remarks: s.remarks || ''
      }));

      const res = await api.markAttendance(Number(selectedCourseId), selectedDate, records);
      setIsAlreadyMarked(true);
      setSaveSuccessMsg(
        `Attendance successfully saved! (${res.summary.inserted} recorded, ${res.summary.updated} updated). Duplicate-entry protection active.`
      );
      showToast('Attendance records saved successfully!', 'success');

      // Refresh alerts in background
      triggerRecalculateAlerts();
    } catch (err) {
      console.error('Save attendance failed:', err);
      setErrorMsg(err.message || 'Failed to save attendance records.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCourse = courses.find(c => String(c.id) === String(selectedCourseId));

  // Count summary
  const presentCount = students.filter(s => s.status === 'present').length;
  const lateCount = students.filter(s => s.status === 'late').length;
  const absentCount = students.filter(s => s.status === 'absent').length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Attendance Marking Desk</span>
            <span>•</span>
            <span>Built by Mahi & Team</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mark & Verify Attendance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Select subject and date to record daily student attendance with automated duplicate-entry protection.
          </p>
        </div>

        {/* Protection Pill */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Duplicate-Entry Protection Active (UPSERT)</span>
        </div>
      </div>

      {/* Control Panel: Course, Date, & Quick Helpers */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Select Course */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Select Subject / Course *
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name} ({c.enrolled_students_count || 6} students)
                </option>
              ))}
            </select>
            {selectedCourse && (
              <span className="text-[11px] text-slate-400 mt-1 block">
                Schedule: {selectedCourse.schedule} • Room: {selectedCourse.room}
              </span>
            )}
          </div>

          {/* Select Date */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Session Date *
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={setToday}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-1.5 py-0.5 rounded bg-indigo-50"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={setYesterday}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-800 px-1.5 py-0.5 rounded bg-slate-100"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Session date format: YYYY-MM-DD
            </span>
          </div>

          {/* Status Badge & Fast Action Helpers */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Session Status
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  isAlreadyMarked 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                }`}>
                  {isAlreadyMarked ? (
                    <>
                      <Info className="w-4 h-4 text-amber-700" />
                      <span>Previously Saved (Editing Mode)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      <span>New Attendance Session</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Quick Helper Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={handleMarkAllAbsent}
                className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs transition-colors"
                title="Mark All Absent"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>All Absent</span>
              </button>
            </div>
          </div>

        </div>

        {/* Live Counters Pill */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-500">Live Session Counters:</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              {presentCount} Present
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
              {lateCount} Late
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
              {absentCount} Absent
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Total Enrolled: {students.length} students
          </span>
        </div>
      </div>

      {/* Messages */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Students Attendance Sheet Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Enrolled Student Roster
            </h2>
            <span className="text-xs text-slate-400 font-medium">({students.length} students)</span>
          </div>
          
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>1-Click "All Present"</span>
          </button>
        </div>

        {loadingSheet ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading class roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No students enrolled in this course yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4 text-center">Attendance Toggle</th>
                  <th className="py-3 px-4">Remarks (Optional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, idx) => {
                  const currentStatus = student.status || 'present';

                  return (
                    <tr 
                      key={student.student_id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        currentStatus === 'absent' ? 'bg-rose-50/30' :
                        currentStatus === 'late' ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-xs">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {student.email} • {student.department}
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {student.roll_number || 'STU-2024'}
                        </span>
                      </td>

                      {/* Status Toggle Buttons */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'present')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          {/* Late Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'late')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30 ring-2 ring-amber-500/30'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Late</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'absent')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/30 ring-2 ring-rose-500/30'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </td>

                      {/* Remarks Input */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={student.remarks || ''}
                          onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                          placeholder="e.g. Excused, Late 10m..."
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Submit Button Bar */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Changes will be securely saved with atomic transaction support.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadSheet(selectedCourseId, selectedDate)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-colors"
            >
              Reset Sheet
            </button>

            <button
              type="button"
              disabled={saving || loadingSheet || students.length === 0}
              onClick={handleSaveAttendance}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-102 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Records...' : isAlreadyMarked ? 'Update Attendance' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
