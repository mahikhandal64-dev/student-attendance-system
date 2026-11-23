const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, get, run } = require('../db');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();

// Quick-fill demo accounts list
router.get('/demo-users', (req, res) => {
  res.json([
    {
      role: 'admin',
      roleLabel: 'Administrator',
      email: 'admin@college.edu',
      password: 'admin123',
      name: 'Dr. Admin Sharma',
      badge: 'Full Access',
      avatar: '👨‍💼',
      description: 'Manage users, courses, system-wide analytics, alerts & CSV export'
    },
    {
      role: 'faculty',
      roleLabel: 'Faculty Member',
      email: 'faculty@college.edu',
      password: 'faculty123',
      name: 'Prof. Rajesh Verma',
      badge: 'Mark & Track',
      avatar: '👨‍🏫',
      description: 'Mark daily attendance, toggle statuses, mark all present & review course stats'
    },
    {
      role: 'student',
      roleLabel: 'Student (High Attendance)',
      email: 'student@college.edu',
      password: 'student123',
      name: 'Aarav Patel (86%)',
      badge: 'STU-2024-001',
      avatar: '🎓',
      description: 'View personal attendance percentage, course breakdown & notifications'
    },
    {
      role: 'student',
      roleLabel: 'Student (Low Attendance Alert)',
      email: 'rohit@college.edu',
      password: 'student123',
      name: 'Rohit Mehra (50%)',
      badge: '⚠️ < 75% Alert',
      avatar: '⚠️',
      description: 'Demonstrates low attendance warning badge (< 75%) and alert banners'
    }
  ]);
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.name,
      student_id: user.student_id 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      student_id: user.student_id,
      department: user.department
    }
  });
});

// Register (Student registration)
router.post('/register', (req, res) => {
  const { name, email, password, student_id, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  const existing = get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (existing) {
    return res.status(400).json({ message: 'An account with this email already exists.' });
  }

  const autoStudentId = student_id && student_id.trim() 
    ? student_id.trim() 
    : `STU-2024-${Math.floor(100 + Math.random() * 900)}`;

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const result = run(`
      INSERT INTO users (name, email, password, role, student_id, department)
      VALUES (?, ?, ?, 'student', ?, ?)
    `, [name.trim(), email.trim(), hashedPassword, autoStudentId, department || 'Computer Science']);

    const newUserId = Number(result.lastInsertRowid);

    // Auto-enroll in all available courses for demonstration
    const courses = query('SELECT id FROM courses');
    for (const c of courses) {
      run('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', [newUserId, c.id]);
    }

    // Add welcome notification
    run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Welcome to Student Attendance System', 'Your account has been registered successfully. Track your attendance and check notifications here. Built by Mahi and Team.', 'success', '/dashboard')
    `, [newUserId]);

    const token = jwt.sign(
      { 
        id: newUserId, 
        email: email.trim(), 
        role: 'student', 
        name: name.trim(),
        student_id: autoStudentId 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Student account created successfully',
      token,
      user: {
        id: newUserId,
        name: name.trim(),
        email: email.trim(),
        role: 'student',
        student_id: autoStudentId,
        department: department || 'Computer Science'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  const user = get('SELECT id, name, email, role, student_id, department, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.json(user);
});

module.exports = router;
