import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Megaphone, 
  RefreshCw, 
  CheckCheck, 
  Plus, 
  Send, 
  X, 
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    announcements, 
    markAsRead, 
    markAllAsRead, 
    triggerRecalculateAlerts, 
    showToast,
    fetchNotifications 
  } = useNotifications();
  
  const { canMarkAttendance, user } = useAuth();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'warning' | 'announcement'
  const [recalculating, setRecalculating] = useState(false);
  
  // Announcement Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('normal');
  const [sendingAnn, setSendingAnn] = useState(false);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await triggerRecalculateAlerts();
    } finally {
      setRecalculating(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    try {
      setSendingAnn(true);
      const res = await api.postAnnouncement({
        title: annTitle,
        content: annContent,
        priority: annPriority,
      });
      showToast(`Announcement broadcasted to ${res.recipientsCount} student(s)!`, 'success');
      setModalOpen(false);
      setAnnTitle('');
      setAnnContent('');
      await fetchNotifications();
    } catch (err) {
      showToast('Failed to post announcement: ' + err.message, 'error');
    } finally {
      setSendingAnn(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'warning') return n.type === 'warning';
    if (activeFilter === 'announcement') return n.type === 'announcement';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts & Notifications Center</span>
            <span>•</span>
            <span>Built by Mahi & Team</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Alerts & Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated &lt;75% low-attendance warnings, faculty announcements, and academic reminders.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-indigo-600" />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}

          {canMarkAttendance && (
            <>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
              >
                <Megaphone className="w-4 h-4" />
                <span>Broadcast Notice</span>
              </button>

              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                title="Recalculate <75% Low Attendance Alerts"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Recalculate Alerts</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`py-2 px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeFilter === 'all'
              ? 'border-indigo-600 text-indigo-700 bg-white font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>All Notifications</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-bold">
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('warning')}
          className={`py-2 px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeFilter === 'warning'
              ? 'border-rose-600 text-rose-700 bg-white font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Low-Attendance Warnings</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
            {notifications.filter(n => n.type === 'warning').length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('announcement')}
          className={`py-2 px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeFilter === 'announcement'
              ? 'border-indigo-600 text-indigo-700 bg-white font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
          <span>Announcements</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-bold">
            {notifications.filter(n => n.type === 'announcement').length}
          </span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 text-slate-400 text-xs space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No notifications in this filter.</p>
            <p className="text-[11px]">System notifications and attendance alerts will appear here.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isWarning = n.type === 'warning';
            const isSuccess = n.type === 'success';

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                  !n.is_read
                    ? isWarning
                      ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                      : 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Icon Badge */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isWarning ? 'bg-rose-100 text-rose-700' :
                  isSuccess ? 'bg-emerald-100 text-emerald-700' :
                  'bg-indigo-100 text-indigo-700'
                }`}>
                  {isWarning ? <AlertTriangle className="w-5 h-5" /> :
                   isSuccess ? <CheckCircle2 className="w-5 h-5" /> :
                   <Megaphone className="w-5 h-5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">{n.title}</h3>
                      {!n.is_read && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/40">
                    <span className="text-[10px] text-slate-400 capitalize">
                      Category: {n.type} • Automated notification
                    </span>

                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-indigo-800 to-violet-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">Broadcast Campus Notice</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-indigo-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Mandatory Attendance Advisory for Semester Finals"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 text-slate-900 bg-white"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Warning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Announcement Content / Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Type the announcement details to be delivered directly to enrolled students..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingAnn}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingAnn ? 'Broadcasting...' : 'Broadcast Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
