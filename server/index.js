require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const subjectsRoutes = require('./routes/subjects');
const attendanceRoutes = require('./routes/attendance');
const notificationsRoutes = require('./routes/notifications');
const studentsRoutes = require('./routes/students');
const { get } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', subjectsRoutes);
app.use('/api/subjects', subjectsRoutes); // Alias for compatibility
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/students', studentsRoutes);

// System info & health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Student Attendance System',
    built_by: 'Mahi and Team',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/system-info', (req, res) => {
  try {
    const studentCount = get("SELECT COUNT(*) AS c FROM users WHERE role = 'student'")?.c || 0;
    const facultyCount = get("SELECT COUNT(*) AS c FROM users WHERE role = 'faculty'")?.c || 0;
    const courseCount = get("SELECT COUNT(*) AS c FROM courses")?.c || 0;
    const attendanceCount = get("SELECT COUNT(*) AS c FROM attendance")?.c || 0;

    res.json({
      systemName: 'Student Attendance System',
      tagline: 'Modern, real-time campus attendance management & tracking',
      developedBy: 'Mahi and Team',
      stats: {
        students: studentCount,
        faculty: facultyCount,
        courses: courseCount,
        records: attendanceCount
      },
      engine: 'Node.js + Express + SQLite DatabaseSync',
      version: '1.0.0'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Production static file serving from ../client/dist
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// SPA catch-all route after all /api routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send('Student Attendance System API is running. Build the React frontend with: npm run build');
    }
  } else {
    res.status(404).json({ message: 'API endpoint not found' });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Student Attendance System Server Started!`);
  console.log(`🛠️  Built by Mahi and Team`);
  console.log(`📡 API listening on http://localhost:${PORT}`);
  console.log(`====================================================`);
});
