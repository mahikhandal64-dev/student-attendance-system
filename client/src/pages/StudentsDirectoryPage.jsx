import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Sparkles, 
  X, 
  Mail, 
  GraduationCap, 
  Filter 
} from 'lucide-react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

export default function StudentsDirectoryPage() {
  const { showToast } = useNotifications();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKw, setSearchKw] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Selected student profile modal
  const [profileModal, setProfileModal] = useState(null);
  const [profileCourses, setProfileCourses] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await api.getStudents();
      setStudents(data || []);
    } catch (err) {
      console.error('Failed to load students:', err);
      showToast('Failed to load student roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = async (student) => {
    setProfileModal(student);
    setLoadingProfile(true);
    try {
      const details = await api.getStudentDetails(student.id);
      setProfileCourses(details.courses || []);
    } catch (err) {
      showToast('Failed to load student profile details: ' + err.message, 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const filtered = students.filter(s => {
    const matchesKw = !searchKw || 
      s.name.toLowerCase().includes(searchKw.toLowerCase()) ||
      s.email.toLowerCase().includes(searchKw.toLowerCase()) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(searchKw.toLowerCase()));

    const matchesDept = !departmentFilter || s.department === departmentFilter;
    return matchesKw && matchesDept;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Campus Registry</span>
            <span>•</span>
            <span>Built by Mahi & Team</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Students Directory & Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Student rolls, overall attendance verification, and academic status monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            {students.length} Total Registered Students
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchKw}
            onChange={(e) => setSearchKw(e.target.value)}
            placeholder="Search by student name, roll number, email..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics Engineering">Electronics Engineering</option>
          </select>
        </div>
      </div>

      {/* Students Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading student directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No students found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Attended / Total</th>
                  <th className="py-3 px-4 text-center">Overall Attendance</th>
                  <th className="py-3 px-4 text-center">Status Flag</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const isLow = s.percentage < 75;

                  return (
                    <tr 
                      key={s.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isLow ? 'bg-rose-50/25' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs">{s.name}</div>
                            <div className="text-[11px] text-slate-400">{s.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {s.roll_number || 'STU-2024'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {s.department}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {s.attended_classes} / {s.total_marked || 0}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-sm font-black ${
                          s.percentage >= 85 ? 'text-emerald-600' :
                          s.percentage >= 75 ? 'text-indigo-600' : 'text-rose-600'
                        }`}>
                          {s.percentage}%
                        </span>
                        <div className="w-16 bg-slate-200 h-1 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.percentage >= 85 ? 'bg-emerald-500' :
                              s.percentage >= 75 ? 'bg-indigo-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, s.percentage))}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>SHORTAGE (&lt;75%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Eligible</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenProfile(s)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      {profileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-indigo-800 to-violet-800 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-lg">
                  {profileModal.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">{profileModal.name}</h3>
                  <p className="text-xs text-indigo-200">
                    Roll: {profileModal.roll_number || 'STU-2024'} • {profileModal.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileModal(null)}
                className="text-indigo-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Overall Attendance</span>
                  <span className={`text-xl font-black ${
                    profileModal.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {profileModal.percentage}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Sessions Recorded</span>
                  <span className="text-sm font-bold text-slate-800">
                    {profileModal.attended_classes} attended / {profileModal.total_marked || 0} classes
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Course-By-Course Breakdown
                </h4>
                
                {loadingProfile ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Loading course breakdown...
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {profileCourses.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{c.code} - {c.name}</div>
                          <span className="text-[11px] text-slate-500">
                            Faculty: {c.faculty_name} • {c.attended_classes} of {c.total_classes} attended
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-black text-sm block ${
                            c.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {c.percentage}%
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            c.percentage >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.percentage >= 75 ? 'Eligible' : 'Shortage'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setProfileModal(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
