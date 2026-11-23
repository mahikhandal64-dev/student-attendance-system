import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info', duration = 4000) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.id === toast?.id ? null : prev));
    }, duration);
  };

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Periodic refresh every 45 seconds
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setAnnouncements([]);
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      showToast('Failed to mark all as read', 'error');
    }
  };

  const triggerRecalculateAlerts = async () => {
    try {
      const res = await api.recalculateAlerts();
      await fetchNotifications();
      showToast(
        `Alerts recalculated: ${res.newAlertsCount || 0} new low-attendance alert(s) sent!`,
        'success',
        5000
      );
      return res;
    } catch (err) {
      console.error('Recalculate alerts failed:', err);
      showToast(err.message || 'Failed to recalculate alerts', 'error');
      throw err;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        announcements,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        triggerRecalculateAlerts,
        showToast,
      }}
    >
      {children}
      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce-short shadow-2xl">
          <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-3 border ${
            toast.type === 'success' ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50 backdrop-blur-md' :
            toast.type === 'error' ? 'bg-rose-900/90 text-rose-100 border-rose-500/50 backdrop-blur-md' :
            toast.type === 'warning' ? 'bg-amber-900/90 text-amber-100 border-amber-500/50 backdrop-blur-md' :
            'bg-slate-900/95 text-slate-100 border-slate-700 backdrop-blur-md'
          }`}>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-xs opacity-70 hover:opacity-100 px-1 py-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
