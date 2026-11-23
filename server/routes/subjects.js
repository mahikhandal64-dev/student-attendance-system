const express = require('express');
const { query, get, run } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// List courses/subjects
router.get('/', authenticate, (req, res) => {
  const { faculty_only } = req.query;

  let sql = `
    SELECT c.*, u.name AS faculty_name, u.email AS faculty_email,
           (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_students_count,
           (SELECT COUNT(DISTINCT a.date) FROM attendance a WHERE a.course_id = c.id) AS total_classes_held
    FROM courses c
    LEFT JOIN users u ON u.id = c.faculty_id
  `;
  const params = [];

  // If user is faculty and requested their courses or if faculty_only query is present
  if (req.user.role === 'faculty' && faculty_only === 'true') {
    sql += ' WHERE c.faculty_id = ?';
    params.push(req.user.id);
  }

  sql += ' ORDER BY c.code ASC';

  const courses = query(sql, params);
  res.json(courses);
});

// Get single course details
router.get('/:id', authenticate, (req, res) => {
  const course = get(`
    SELECT c.*, u.name AS faculty_name, u.email AS faculty_email,
           (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_students_count,
           (SELECT COUNT(DISTINCT a.date) FROM attendance a WHERE a.course_id = c.id) AS total_classes_held
    FROM courses c
    LEFT JOIN users u ON u.id = c.faculty_id
    WHERE c.id = ?
  `, [req.params.id]);

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  res.json(course);
});

// Get enrolled students for a course
router.get('/:id/students', authenticate, (req, res) => {
  const courseId = req.params.id;

  const students = query(`
    SELECT u.id, u.name, u.email, u.student_id, u.department,
           COUNT(a.id) AS total_records,
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_count,
           COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_count,
           COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_count
    FROM enrollments e
    JOIN users u ON u.id = e.student_id
    LEFT JOIN attendance a ON a.student_id = u.id AND a.course_id = ?
    WHERE e.course_id = ?
    GROUP BY u.id
    ORDER BY u.name ASC
  `, [courseId, courseId]);

  // Total classes held for this course
  const totalClassesRow = get('SELECT COUNT(DISTINCT date) AS count FROM attendance WHERE course_id = ?', [courseId]);
  const totalClasses = totalClassesRow ? totalClassesRow.count : 0;

  const enriched = students.map(s => {
    const attended = (s.present_count || 0) + (s.late_count || 0);
    const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 100;
    return {
      ...s,
      total_classes: totalClasses,
      attended_classes: attended,
      percentage,
      is_low_attendance: percentage < 75 && totalClasses >= 2
    };
  });

  res.json(enriched);
});

// Create a new course (Admin only)
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const { code, name, faculty_id, department, credits, schedule, room } = req.body;

  if (!code || !name) {
    return res.status(400).json({ message: 'Course code and name are required.' });
  }

  try {
    const result = run(`
      INSERT INTO courses (code, name, faculty_id, department, credits, schedule, room)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      code.trim().toUpperCase(),
      name.trim(),
      faculty_id || null,
      department || 'Computer Science',
      credits || 4,
      schedule || 'Mon, Wed 10:00 AM',
      room || 'Hall 101'
    ]);

    const newCourse = get('SELECT * FROM courses WHERE id = ?', [Number(result.lastInsertRowid)]);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Failed to create course. Code may already exist.' });
  }
});

module.exports = router;
