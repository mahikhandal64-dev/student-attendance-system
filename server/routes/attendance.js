const express = require('express');
const { query, get, run, recalculateLowAttendanceAlerts } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get attendance sheet for a course and date
// (Returns all enrolled students and their attendance status if already marked)
router.get('/sheet', authenticate, requireRole('admin', 'faculty'), (req, res) => {
  const { course_id, date } = req.query;

  if (!course_id || !date) {
    return res.status(400).json({ message: 'course_id and date are required.' });
  }

  // Verify course exists
  const course = get('SELECT * FROM courses WHERE id = ?', [course_id]);
  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  // Get all enrolled students and any existing attendance record for this date
  const students = query(`
    SELECT u.id AS student_id, u.name, u.email, u.student_id AS roll_number, u.department,
           a.id AS attendance_id, a.status, a.remarks, a.updated_at
    FROM enrollments e
    JOIN users u ON u.id = e.student_id
    LEFT JOIN attendance a ON a.student_id = u.id AND a.course_id = ? AND a.date = ?
    WHERE e.course_id = ?
    ORDER BY u.name ASC
  `, [course_id, date, course_id]);

  const isAlreadyMarked = students.some(s => s.status !== null);

  res.json({
    course,
    date,
    is_already_marked: isAlreadyMarked,
    students: students.map(s => ({
      student_id: s.student_id,
      name: s.name,
      email: s.email,
      roll_number: s.roll_number,
      department: s.department,
      status: s.status || 'present', // default to 'present' if not marked
      is_marked: s.status !== null,
      remarks: s.remarks || ''
    }))
  });
});

// Mark / Update attendance with duplicate-entry protection
router.post('/mark', authenticate, requireRole('admin', 'faculty'), (req, res) => {
  const { course_id, date, records } = req.body;

  if (!course_id || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'course_id, date, and non-empty records array are required.' });
  }

  const markedBy = req.user.id;
  let updatedCount = 0;
  let insertedCount = 0;

  for (const r of records) {
    if (!r.student_id || !r.status) continue;

    // Check if record already exists for duplicate check tracking
    const existing = get(`
      SELECT id FROM attendance
      WHERE course_id = ? AND student_id = ? AND date = ?
    `, [course_id, r.student_id, date]);

    // UPSERT ensures duplicate-entry protection per course/student/date
    run(`
      INSERT INTO attendance (course_id, student_id, date, status, marked_by, remarks, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(course_id, student_id, date)
      DO UPDATE SET
        status = excluded.status,
        remarks = excluded.remarks,
        marked_by = excluded.marked_by,
        updated_at = CURRENT_TIMESTAMP
    `, [course_id, r.student_id, date, r.status, markedBy, r.remarks || '']);

    if (existing) {
      updatedCount++;
    } else {
      insertedCount++;
    }
  }

  // Recalculate low-attendance alerts
  const alertStats = recalculateLowAttendanceAlerts();

  res.json({
    message: 'Attendance saved successfully',
    summary: {
      total: records.length,
      inserted: insertedCount,
      updated: updatedCount,
      date,
      course_id,
      newAlertsGenerated: alertStats.newAlertsCount
    }
  });
});

// Comprehensive attendance reports & stats
router.get('/reports', authenticate, (req, res) => {
  const {
    student_id,
    course_id,
    start_date,
    end_date,
    low_attendance_only
  } = req.query;

  // If student is logged in, restrict to their own records
  const targetStudentId = req.user.role === 'student' ? req.user.id : student_id;

  // 1. Overall student-wise breakdown
  let studentQuery = `
    SELECT u.id, u.name, u.email, u.student_id AS roll_number, u.department,
           COUNT(DISTINCT a.id) AS total_records,
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_count,
           COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_count,
           COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_count
    FROM users u
    JOIN enrollments e ON e.student_id = u.id
    LEFT JOIN attendance a ON a.student_id = u.id
  `;
  const studentParams = [];
  const studentWheres = ["u.role = 'student'"];

  if (targetStudentId) {
    studentWheres.push('u.id = ?');
    studentParams.push(targetStudentId);
  }
  if (course_id) {
    studentWheres.push('e.course_id = ?');
    studentParams.push(course_id);
    studentWheres.push('(a.course_id = ? OR a.course_id IS NULL)');
    studentParams.push(course_id);
  }
  if (start_date) {
    studentWheres.push('(a.date >= ? OR a.date IS NULL)');
    studentParams.push(start_date);
  }
  if (end_date) {
    studentWheres.push('(a.date <= ? OR a.date IS NULL)');
    studentParams.push(end_date);
  }

  studentQuery += ' WHERE ' + studentWheres.join(' AND ');
  studentQuery += ' GROUP BY u.id ORDER BY u.name ASC';

  const rawStudents = query(studentQuery, studentParams);

  // Total distinct class dates held (for the selected course, or overall)
  let totalDatesSql = 'SELECT COUNT(DISTINCT date) AS total_sessions FROM attendance WHERE 1=1';
  const totalDatesParams = [];
  if (course_id) {
    totalDatesSql += ' AND course_id = ?';
    totalDatesParams.push(course_id);
  }
  if (start_date) {
    totalDatesSql += ' AND date >= ?';
    totalDatesParams.push(start_date);
  }
  if (end_date) {
    totalDatesSql += ' AND date <= ?';
    totalDatesParams.push(end_date);
  }
  const totalSessionsRow = get(totalDatesSql, totalDatesParams);
  const totalSessions = totalSessionsRow ? totalSessionsRow.total_sessions : 0;

  let studentStats = rawStudents.map(s => {
    // Each student can have multiple classes across subjects
    const present = s.present_count || 0;
    const late = s.late_count || 0;
    const absent = s.absent_count || 0;
    const totalMarked = present + late + absent;
    // Total classes could be totalMarked or totalSessions
    const totalClasses = totalMarked > 0 ? totalMarked : totalSessions;
    const attended = present + late;
    const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 100;
    const isLow = percentage < 75 && totalClasses >= 2;

    return {
      student_id: s.id,
      name: s.name,
      email: s.email,
      roll_number: s.roll_number,
      department: s.department,
      total_classes: totalClasses,
      attended_classes: attended,
      present_count: present,
      late_count: late,
      absent_count: absent,
      percentage,
      is_low_attendance: isLow
    };
  });

  if (low_attendance_only === 'true') {
    studentStats = studentStats.filter(s => s.is_low_attendance);
  }

  // 2. Course-wise breakdown for the logged in user or overall
  let courseStatsSql = `
    SELECT c.id, c.code, c.name, c.schedule, c.room, u.name AS faculty_name,
           COUNT(DISTINCT a.date) AS total_sessions,
           COUNT(a.id) AS total_records,
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_count,
           COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_count,
           COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_count
    FROM courses c
    LEFT JOIN users u ON u.id = c.faculty_id
    LEFT JOIN attendance a ON a.course_id = c.id
  `;
  const courseWheres = ['1=1'];
  const courseParams = [];

  if (targetStudentId) {
    courseWheres.push('a.student_id = ?');
    courseParams.push(targetStudentId);
  }
  if (course_id) {
    courseWheres.push('c.id = ?');
    courseParams.push(course_id);
  }
  if (start_date) {
    courseWheres.push('(a.date >= ? OR a.date IS NULL)');
    courseParams.push(start_date);
  }
  if (end_date) {
    courseWheres.push('(a.date <= ? OR a.date IS NULL)');
    courseParams.push(end_date);
  }

  courseStatsSql += ' WHERE ' + courseWheres.join(' AND ');
  courseStatsSql += ' GROUP BY c.id ORDER BY c.code ASC';

  const courseStats = query(courseStatsSql, courseParams).map(c => {
    const present = c.present_count || 0;
    const late = c.late_count || 0;
    const totalMarked = present + late + (c.absent_count || 0);
    const attended = present + late;
    const percentage = totalMarked > 0 ? Math.round((attended / totalMarked) * 100) : 100;
    return {
      ...c,
      attended_classes: attended,
      percentage,
      is_low_attendance: percentage < 75 && (c.total_sessions >= 2 || totalMarked >= 2)
    };
  });

  // 3. Detailed individual attendance logs (limited to 100 for fast UI load)
  let logsSql = `
    SELECT a.id, a.date, a.status, a.remarks, a.created_at,
           c.code AS course_code, c.name AS course_name,
           u.id AS student_id, u.name AS student_name, u.student_id AS roll_number,
           f.name AS marked_by_name
    FROM attendance a
    JOIN courses c ON c.id = a.course_id
    JOIN users u ON u.id = a.student_id
    LEFT JOIN users f ON f.id = a.marked_by
    WHERE 1=1
  `;
  const logsParams = [];

  if (targetStudentId) {
    logsSql += ' AND a.student_id = ?';
    logsParams.push(targetStudentId);
  }
  if (course_id) {
    logsSql += ' AND a.course_id = ?';
    logsParams.push(course_id);
  }
  if (start_date) {
    logsSql += ' AND a.date >= ?';
    logsParams.push(start_date);
  }
  if (end_date) {
    logsSql += ' AND a.date <= ?';
    logsParams.push(end_date);
  }

  logsSql += ' ORDER BY a.date DESC, c.code ASC, u.name ASC LIMIT 150';
  const records = query(logsSql, logsParams);

  // Overall totals
  const totalClassesRecorded = studentStats.reduce((acc, s) => acc + s.total_classes, 0);
  const totalAttendedRecorded = studentStats.reduce((acc, s) => acc + s.attended_classes, 0);
  const overallPercentage = totalClassesRecorded > 0 ? Math.round((totalAttendedRecorded / totalClassesRecorded) * 100) : 100;
  const lowAttendanceCount = studentStats.filter(s => s.is_low_attendance).length;

  res.json({
    summary: {
      total_students: studentStats.length,
      total_classes_recorded: totalClassesRecorded,
      total_attended: totalAttendedRecorded,
      overall_percentage: overallPercentage,
      low_attendance_count: lowAttendanceCount
    },
    studentStats,
    courseStats,
    records
  });
});

// CSV Export route
router.get('/export-csv', authenticate, (req, res) => {
  const { student_id, course_id, start_date, end_date } = req.query;

  const targetStudentId = req.user.role === 'student' ? req.user.id : student_id;

  let sql = `
    SELECT a.date, c.code AS course_code, c.name AS course_name,
           u.student_id AS roll_number, u.name AS student_name, u.department,
           a.status, a.remarks, f.name AS marked_by
    FROM attendance a
    JOIN courses c ON c.id = a.course_id
    JOIN users u ON u.id = a.student_id
    LEFT JOIN users f ON f.id = a.marked_by
    WHERE 1=1
  `;
  const params = [];

  if (targetStudentId) {
    sql += ' AND a.student_id = ?';
    params.push(targetStudentId);
  }
  if (course_id) {
    sql += ' AND a.course_id = ?';
    params.push(course_id);
  }
  if (start_date) {
    sql += ' AND a.date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND a.date <= ?';
    params.push(end_date);
  }

  sql += ' ORDER BY a.date DESC, c.code ASC, u.name ASC';

  const rows = query(sql, params);

  // CSV escape helper
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = ['Date', 'Course Code', 'Course Name', 'Roll Number / Student ID', 'Student Name', 'Department', 'Status', 'Remarks', 'Marked By'];
  const csvLines = [headers.join(',')];

  for (const r of rows) {
    csvLines.push([
      escapeCsv(r.date),
      escapeCsv(r.course_code),
      escapeCsv(r.course_name),
      escapeCsv(r.roll_number || 'N/A'),
      escapeCsv(r.student_name),
      escapeCsv(r.department),
      escapeCsv(r.status.toUpperCase()),
      escapeCsv(r.remarks || ''),
      escapeCsv(r.marked_by || 'Faculty')
    ].join(','));
  }

  const csvContent = csvLines.join('\r\n');
  const filename = `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csvContent);
});

// Trigger recalculation of low-attendance alerts
router.post('/recalculate-alerts', authenticate, requireRole('admin', 'faculty'), (req, res) => {
  const result = recalculateLowAttendanceAlerts();
  res.json({
    message: `Alerts recalculation completed. ${result.newAlertsCount} new alert(s) dispatched.`,
    ...result
  });
});

module.exports = router;
