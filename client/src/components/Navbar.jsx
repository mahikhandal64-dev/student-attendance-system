import React, { useState } from 'react';
import { 
  GraduationCap, 
  CalendarCheck, 
  BarChart3, 
  BookOpen, 
  Users, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  ShieldCheck,
  User,
  AlertTriangle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar({ currentTab, setCurrentTab, onOpenAbout }) {
  const { user, logout, isAdmin, isFaculty, canMarkAttendance } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, triggerRecalculateAlerts } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await triggerRecalculateAlerts();
    } finally {
      setRecalculating(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, show: true },
    { id: 'mark-attendance', label: 'Mark Attendance', icon: CalendarCheck, show: canMarkAttendance },
    { id: 'reports', label: 'Attendance Reports', icon: BarChart3, show: true },
    { id: 'courses', label: 'Courses', icon: BookOpen, show: true },
    { id: 'students', label: 'Students Directory', icon: Users, show: canMarkAttendance },
    { id: 'notifications', label: 'Notifications', icon: Bell, show: true, badge: unreadCount },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentTab('dashboard')} 
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight block leading-tight">
                  Student Attendance
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 tracking-wide flex items-center gap-1">
                  Built by Mahi & Team
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                </span>
              </div>
            </button>

            {/* Team Info Pill */}
            <button
              onClick={onOpenAbout}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200/60"
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Team Info</span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Notifications Popover Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className={`relative p-2 rounded-xl transition-colors ${
                  notifDropdownOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Notifications & Alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Box */}
              {notifDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Notifications & Alerts</span>
                      {unreadCount > 0 && (
                        <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                      {canMarkAttendance && (
                        <button
                          onClick={handleRecalculate}
                          disabled={recalculating}
                          title="Recalculate Low Attendance Alerts"
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200/60"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-indigo-600' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.is_read) markAsRead(notif.id);
                            if (notif.link) {
                              if (notif.link.includes('reports')) setCurrentTab('reports');
                              else if (notif.link.includes('dashboard')) setCurrentTab('dashboard');
                              else setCurrentTab('notifications');
                            }
                            setNotifDropdownOpen(false);
                          }}
                          className={`p-3 text-left transition-colors cursor-pointer flex gap-3 ${
                            notif.is_read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50'
                          }`}
                        >
                          <div className="pt-0.5 shrink-0">
                            {notif.type === 'warning' ? (
                              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4" />
                              </div>
                            ) : notif.type === 'success' ? (
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <Bell className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 self-center"></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setCurrentTab('notifications');
                        setNotifDropdownOpen(false);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View All Notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  {user?.name}
                </span>
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                  {user?.role}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Built by Mahi and Team</span>
            <button
              onClick={onOpenAbout}
              className="text-xs font-semibold text-indigo-600"
            >
              Project Details
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
