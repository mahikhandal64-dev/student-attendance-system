const express = require('express');
const { query, get } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all students directory
router.get('/', authenticate, (req, res) => {
  const students = query(`
    SELECT u.id, u.name, u.email, u.student_id AS roll_number, u.department, u.created_at,
           COUNT(a.id) AS total_records,
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_count,
           COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_count,
           COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_count
    FROM users u
    LEFT JOIN attendance a ON a.student_id = u.id
    WHERE u.role = 'student'
    GROUP BY u.id
    ORDER BY u.name ASC
  `);

  // Total class dates held across system
  const totalClassesRow = get('SELECT COUNT(DISTINCT date) AS count FROM attendance');
  const totalSessions = totalClassesRow ? totalClassesRow.count : 0;

  const enriched = students.map(s => {
    const totalMarked = (s.present_count || 0) + (s.late_count || 0) + (s.absent_count || 0);
    const attended = (s.present_count || 0) + (s.late_count || 0);
    const percentage = totalMarked > 0 ? Math.round((attended / totalMarked) * 100) : 100;
    return {
      ...s,
      total_marked: totalMarked,
      attended_classes: attended,
      percentage,
      is_low_attendance: percentage < 75 && totalMarked >= 2
    };
  });

  res.json(enriched);
});

// Get single student profile with courses
router.get('/:id', authenticate, (req, res) => {
  const student = get(`
    SELECT id, name, email, student_id AS roll_number, department, created_at
    FROM users
    WHERE id = ? AND role = 'student'
  `, [req.params.id]);

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  // Get enrolled courses with individual course percentages
  const courses = query(`
    SELECT c.id, c.code, c.name, c.schedule, c.room, u.name AS faculty_name,
           COUNT(a.id) AS total_records,
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_count,
           COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_count,
           COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_count
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    LEFT JOIN users u ON u.id = c.faculty_id
    LEFT JOIN attendance a ON a.course_id = c.id AND a.student_id = ?
    WHERE e.student_id = ?
    GROUP BY c.id
    ORDER BY c.code ASC
  `, [student.id, student.id]);

  const courseBreakdown = courses.map(c => {
    const present = c.present_count || 0;
    const late = c.late_count || 0;
    const total = present + late + (c.absent_count || 0);
    const attended = present + late;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;
    return {
      ...c,
      total_classes: total,
      attended_classes: attended,
      percentage,
      is_low_attendance: percentage < 75 && total >= 2
    };
  });

  res.json({
    student,
    courses: courseBreakdown
  });
});

module.exports = router;
