import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Sparkles, 
  Plus, 
  UserCheck, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function CoursesPage({ onNavigateMark }) {
  const { isAdmin, isFaculty } = useAuth();
  const { showToast } = useNotifications();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected course for enrolled students modal
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Add course modal state (admin)
  const [addCourseModal, setAddCourseModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newSchedule, setNewSchedule] = useState('Mon, Wed 10:00 AM');
  const [newRoom, setNewRoom] = useState('Room 101');
  const [newCredits, setNewCredits] = useState('4');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await api.getCourses();
      setCourses(data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudents = async (course) => {
    setSelectedCourse(course);
    setLoadingStudents(true);
    try {
      const students = await api.getCourseStudents(course.id);
      setEnrolledStudents(students || []);
    } catch (err) {
      showToast('Failed to load enrolled students: ' + err.message, 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      showToast('Course code and title are required', 'error');
      return;
    }

    try {
      setCreating(true);
      await api.createCourse({
        code: newCode,
        name: newName,
        schedule: newSchedule,
        room: newRoom,
        credits: Number(newCredits) || 4,
      });
      showToast('New course registered successfully!', 'success');
      setAddCourseModal(false);
      setNewCode('');
      setNewName('');
      await loadCourses();
    } catch (err) {
      showToast('Failed to create course: ' + err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Curriculum Management</span>
            <span>•</span>
            <span>Built by Mahi & Team</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Active Curriculum Subjects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enrolled classes, faculty assignments, schedule timelines, and student rosters.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setAddCourseModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Course</span>
          </button>
        )}
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs space-y-2">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading course catalogue...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-black text-sm px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    {course.code}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {course.credits} Credits
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                  {course.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Department of {course.department}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-400 font-medium">Faculty:</span>
                  <span className="font-bold">{course.faculty_name || 'Dr. Assigned Professor'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-400 font-medium">Schedule:</span>
                  <span className="font-semibold">{course.schedule}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-400 font-medium">Room / Lab:</span>
                  <span className="font-semibold">{course.room}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/50">
                  <span className="text-slate-400 font-medium">Enrolled Students:</span>
                  <span className="font-extrabold text-indigo-700">{course.enrolled_students_count || 6} enrolled</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenStudents(course)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Roster</span>
                </button>

                {(isFaculty || isAdmin) && (
                  <button
                    type="button"
                    onClick={onNavigateMark}
                    className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
                  >
                    Mark
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enrolled Students Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-indigo-800 to-violet-800 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-200">
                  {selectedCourse.code} • Enrolled Student Roster
                </span>
                <h3 className="text-lg font-extrabold">{selectedCourse.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-indigo-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {loadingStudents ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading enrolled student attendance...
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No students currently enrolled in this subject.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {enrolledStudents.map((s, idx) => {
                    const isShortage = s.is_low_attendance;

                    return (
                      <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-400 w-5">{idx + 1}</span>
                          <div>
                            <span className="font-extrabold text-slate-900">{s.name}</span>
                            <span className="text-[11px] text-slate-500 block">
                              Roll: {s.student_id || 'STU-2024'} • {s.department}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className={`text-sm font-black ${
                              s.percentage >= 85 ? 'text-emerald-600' :
                              s.percentage >= 75 ? 'text-indigo-600' : 'text-rose-600'
                            }`}>
                              {s.percentage}%
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {s.attended_classes} of {s.total_classes} attended
                            </span>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isShortage ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isShortage ? '⚠️ Shortage' : 'Eligible'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal (Admin) */}
      {addCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-indigo-800 to-violet-800 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base">Add New Curriculum Course</h3>
              <button
                onClick={() => setAddCourseModal(false)}
                className="text-indigo-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Code * (e.g. CS106)
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="CS106"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Machine Learning"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    value={newCredits}
                    onChange={(e) => setNewCredits(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Room / Lab
                  </label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Class Schedule
                </label>
                <input
                  type="text"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  placeholder="e.g. Tue, Thu 02:00 PM"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddCourseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50"
                >
                  {creating ? 'Registering...' : 'Register Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
