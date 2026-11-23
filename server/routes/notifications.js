const express = require('express');
const { query, get, run } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get current user's notifications and unread count
router.get('/', authenticate, (req, res) => {
  const userId = req.user.id;

  const notifications = query(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `, [userId]);

  const unreadRow = get(`
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE user_id = ? AND is_read = 0
  `, [userId]);

  // Also fetch recent campus announcements
  const announcements = query(`
    SELECT a.*, u.name AS author_name, c.code AS course_code, c.name AS course_name
    FROM announcements a
    JOIN users u ON u.id = a.author_id
    LEFT JOIN courses c ON c.id = a.course_id
    ORDER BY a.created_at DESC
    LIMIT 10
  `);

  res.json({
    unread_count: unreadRow ? unreadRow.unread_count : 0,
    notifications,
    announcements
  });
});

// Mark single notification as read
router.put('/:id/read', authenticate, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  run(`
    UPDATE notifications
    SET is_read = 1
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId]);

  res.json({ message: 'Notification marked as read', id: notificationId });
});

// Mark all notifications as read for current user
router.put('/read-all', authenticate, (req, res) => {
  const userId = req.user.id;

  const result = run(`
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ? AND is_read = 0
  `, [userId]);

  res.json({
    message: 'All notifications marked as read',
    updatedCount: Number(result.changes)
  });
});

// Post a new announcement / broadcast notification (Faculty/Admin)
router.post('/broadcast', authenticate, requireRole('admin', 'faculty'), (req, res) => {
  const { title, content, priority, course_id } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  // 1. Save into announcements table
  const annResult = run(`
    INSERT INTO announcements (author_id, course_id, title, content, priority, created_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [
    req.user.id,
    course_id || null,
    title.trim(),
    content.trim(),
    priority || 'normal'
  ]);

  // 2. Determine target students to notify
  let targetStudents = [];
  if (course_id) {
    targetStudents = query(`
      SELECT student_id FROM enrollments WHERE course_id = ?
    `, [course_id]);
  } else {
    // Campus-wide to all students
    targetStudents = query(`
      SELECT id AS student_id FROM users WHERE role = 'student'
    `);
  }

  // 3. Insert notification for each target student
  const notifType = priority === 'urgent' || priority === 'high' ? 'warning' : 'announcement';
  for (const s of targetStudents) {
    run(`
      INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, '/notifications', 0, CURRENT_TIMESTAMP)
    `, [
      s.student_id,
      `Announcement: ${title.trim()}`,
      content.trim(),
      notifType
    ]);
  }

  res.status(201).json({
    message: 'Announcement posted and dispatched to students successfully',
    announcementId: Number(annResult.lastInsertRowid),
    recipientsCount: targetStudents.length
  });
});

module.exports = router;
