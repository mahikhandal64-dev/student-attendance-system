import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AboutModal from './components/AboutModal';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AttendanceMarking from './pages/AttendanceMarking';
import AttendanceReports from './pages/AttendanceReports';
import CoursesPage from './pages/CoursesPage';
import StudentsDirectoryPage from './pages/StudentsDirectoryPage';
import NotificationsPage from './pages/NotificationsPage';

function AppContent() {
  const { isAuthenticated, loading, canMarkAttendance } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="font-extrabold text-slate-900 text-sm tracking-tight">Student Attendance System</div>
          <p className="text-xs text-indigo-600 font-semibold">Built by Mahi and Team</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Login onOpenAbout={() => setAboutModalOpen(true)} />
        <AboutModal isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onOpenAbout={() => setAboutModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <Dashboard 
            setCurrentTab={setCurrentTab} 
            onOpenAbout={() => setAboutModalOpen(true)} 
          />
        )}

        {currentTab === 'mark-attendance' && canMarkAttendance && (
          <AttendanceMarking />
        )}

        {currentTab === 'reports' && (
          <AttendanceReports />
        )}

        {currentTab === 'courses' && (
          <CoursesPage 
            onNavigateMark={() => setCurrentTab('mark-attendance')} 
          />
        )}

        {currentTab === 'students' && canMarkAttendance && (
          <StudentsDirectoryPage />
        )}

        {currentTab === 'notifications' && (
          <NotificationsPage />
        )}
      </main>

      {/* Global Footer with Mahi and Team recognition */}
      <Footer onOpenAbout={() => setAboutModalOpen(true)} />

      {/* About System & Team Modal */}
      <AboutModal isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
