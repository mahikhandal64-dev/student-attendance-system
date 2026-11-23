// API Client - Built by Mahi and Team
// Automatically handles JWT auth headers and relative /api endpoints for production & dev

const API_BASE = '/api';

export const getAuthToken = () => {
  return localStorage.getItem('attendance_token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('attendance_token', token);
  } else {
    localStorage.removeItem('attendance_token');
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('attendance_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('attendance_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('attendance_user');
  }
};

// Generic fetch wrapper with auth header
export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token expired, clear and trigger event
    setAuthToken(null);
    setStoredUser(null);
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  // Check if response is JSON or blob/text
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'API request failed');
  }

  return response;
}

// API Service Functions
export const api = {
  // Auth
  getDemoUsers: () => apiFetch('/auth/demo-users'),
  login: (email, password) => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: (userData) => apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  getCurrentUser: () => apiFetch('/auth/me'),

  // Courses
  getCourses: (facultyOnly = false) => apiFetch(`/courses${facultyOnly ? '?faculty_only=true' : ''}`),
  getCourse: (id) => apiFetch(`/courses/${id}`),
  getCourseStudents: (id) => apiFetch(`/courses/${id}/students`),
  createCourse: (data) => apiFetch('/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Attendance
  getAttendanceSheet: (courseId, date) => apiFetch(`/attendance/sheet?course_id=${courseId}&date=${date}`),
  markAttendance: (courseId, date, records) => apiFetch('/attendance/mark', {
    method: 'POST',
    body: JSON.stringify({ course_id: courseId, date, records }),
  }),
  getReports: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.student_id) params.append('student_id', filters.student_id);
    if (filters.course_id) params.append('course_id', filters.course_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.low_attendance_only) params.append('low_attendance_only', 'true');
    return apiFetch(`/attendance/reports?${params.toString()}`);
  },
  recalculateAlerts: () => apiFetch('/attendance/recalculate-alerts', {
    method: 'POST',
  }),
  downloadCsv: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.student_id) params.append('student_id', filters.student_id);
    if (filters.course_id) params.append('course_id', filters.course_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/attendance/export-csv?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Failed to generate CSV export');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Notifications & Announcements
  getNotifications: () => apiFetch('/notifications'),
  markNotificationRead: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => apiFetch('/notifications/read-all', { method: 'PUT' }),
  postAnnouncement: (data) => apiFetch('/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Students
  getStudents: () => apiFetch('/students'),
  getStudentDetails: (id) => apiFetch(`/students/${id}`),

  // System
  getSystemInfo: () => apiFetch('/system-info'),
};
