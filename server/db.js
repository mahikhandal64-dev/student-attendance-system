const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'attendance.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize schema
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'faculty', 'student')),
      student_id TEXT,
      department TEXT DEFAULT 'Computer Science',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      faculty_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      department TEXT DEFAULT 'Computer Science',
      credits INTEGER DEFAULT 4,
      schedule TEXT DEFAULT 'Mon, Wed, Fri 10:00 AM',
      room TEXT DEFAULT 'Lab 301',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late')),
      marked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_id, student_id, date)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('warning', 'info', 'success', 'announcement')),
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('normal', 'high', 'urgent')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initSchema();

// Helper wrappers
const normalizeParams = (params) => {
  if (params === undefined || params === null) return [];
  if (Array.isArray(params)) return params;
  return [params];
};

const query = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...normalizeParams(params));
};

const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...normalizeParams(params));
};

const run = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.run(...normalizeParams(params));
};

const exec = (sql) => {
  return db.exec(sql);
};

// Recalculate low-attendance alerts function
// Flags any student whose attendance in a course is < 75%
const recalculateLowAttendanceAlerts = () => {
  // Find all enrollments
  const enrollments = query(`
    SELECT e.student_id, e.course_id, u.name AS student_name, u.email AS student_email,
           c.code AS course_code, c.name AS course_name
    FROM enrollments e
    JOIN users u ON u.id = e.student_id
    JOIN courses c ON c.id = e.course_id
  `);

  let newAlertsCount = 0;
  const now = new Date().toISOString();

  for (const enr of enrollments) {
    // Total classes held for this course
    const totalClassesRow = get(`
      SELECT COUNT(DISTINCT date) AS total_classes
      FROM attendance
      WHERE course_id = ?
    `, [enr.course_id]);

    const totalClasses = totalClassesRow ? totalClassesRow.total_classes : 0;
    if (totalClasses < 2) continue; // Don't trigger if fewer than 2 classes have taken place

    // Attended classes for this student in this course (present or late)
    const attendedRow = get(`
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) AS present_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) AS late_count,
        COUNT(*) AS recorded_count
      FROM attendance
      WHERE course_id = ? AND student_id = ?
    `, [enr.course_id, enr.student_id]);

    // In most attendance policies: present = 100%, late = counts as attended (or present with late tag)
    const presentCount = attendedRow ? attendedRow.present_count : 0;
    const lateCount = attendedRow ? attendedRow.late_count : 0;
    const attendedTotal = presentCount + lateCount;
    const percentage = totalClasses > 0 ? Math.round((attendedTotal / totalClasses) * 100) : 100;

    if (percentage < 75) {
      // Check if an unread or recent alert for this course already exists today
      const existingAlert = get(`
        SELECT id FROM notifications
        WHERE user_id = ? 
          AND type = 'warning' 
          AND title LIKE ?
          AND created_at >= date('now', '-3 days')
      `, [enr.student_id, `%${enr.course_code}%`]);

      if (!existingAlert) {
        run(`
          INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
          VALUES (?, ?, ?, 'warning', '/reports', 0, CURRENT_TIMESTAMP)
        `, [
          enr.student_id,
          `Low Attendance Alert: ${enr.course_code}`,
          `Your attendance in ${enr.course_name} (${enr.course_code}) is currently ${percentage}% (${attendedTotal}/${totalClasses} classes), which is below the mandatory 75% threshold. Please consult your faculty.`
        ]);
        newAlertsCount++;
      }
    }
  }

  return { newAlertsCount, timestamp: now };
};

module.exports = {
  db,
  query,
  get,
  run,
  exec,
  recalculateLowAttendanceAlerts
};
