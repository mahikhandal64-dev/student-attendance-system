const bcrypt = require('bcryptjs');
const { query, get, run, exec, recalculateLowAttendanceAlerts } = require('./db');

function seed() {
  console.log('--- Starting Database Seeding (Built by Mahi and Team) ---');

  // Clear existing data in correct order
  exec(`
    DELETE FROM notifications;
    DELETE FROM announcements;
    DELETE FROM attendance;
    DELETE FROM enrollments;
    DELETE FROM courses;
    DELETE FROM users;
  `);

  console.log('Cleared existing tables.');

  // Password hashes
  const adminHash = bcrypt.hashSync('admin123', 10);
  const facultyHash = bcrypt.hashSync('faculty123', 10);
  const studentHash = bcrypt.hashSync('student123', 10);

  // 1. Insert Users
  const users = [
    { name: 'Dr. Admin Sharma', email: 'admin@college.edu', password: adminHash, role: 'admin', student_id: null, department: 'Administration' },
    { name: 'Prof. Rajesh Verma', email: 'faculty@college.edu', password: facultyHash, role: 'faculty', student_id: null, department: 'Computer Science' },
    { name: 'Prof. Priya Iyer', email: 'priya@college.edu', password: facultyHash, role: 'faculty', student_id: null, department: 'Information Technology' },
    { name: 'Aarav Patel', email: 'student@college.edu', password: studentHash, role: 'student', student_id: 'STU-2024-001', department: 'Computer Science' },
    { name: 'Rohit Mehra', email: 'rohit@college.edu', password: studentHash, role: 'student', student_id: 'STU-2024-002', department: 'Computer Science' },
    { name: 'Ananya Sen', email: 'ananya@college.edu', password: studentHash, role: 'student', student_id: 'STU-2024-003', department: 'Computer Science' },
    { name: 'Vikram Singh', email: 'vikram@college.edu', password: studentHash, role: 'student', student_id: 'STU-2024-004', department: 'Computer Science' },
    { name: 'Sneha Nair', email: 'sneha@college.edu', password: studentHash, role: 'student', student_id: 'STU-2024-005', department: 'Computer Science' },
    { name: 'Kavya Reddy', email: 'kavya@college.edu', password: studentHash, role: 'student', student_id: 'STU-2024-006', department: 'Computer Science' }
  ];

  const userIds = {};
  for (const u of users) {
    const res = run(`
      INSERT INTO users (name, email, password, role, student_id, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [u.name, u.email, u.password, u.role, u.student_id, u.department]);
    userIds[u.email] = Number(res.lastInsertRowid);
  }
  console.log(`Seeded ${users.length} users (Admin, Faculty, Students).`);

  // 2. Insert Courses
  const courses = [
    { code: 'CS101', name: 'Data Structures & Algorithms', faculty_id: userIds['faculty@college.edu'], schedule: 'Mon, Wed, Fri 09:30 AM', room: 'Hall 302', credits: 4, department: 'Computer Science' },
    { code: 'CS102', name: 'Database Management Systems', faculty_id: userIds['priya@college.edu'], schedule: 'Tue, Thu 11:00 AM', room: 'Lab 2', credits: 4, department: 'Computer Science' },
    { code: 'CS103', name: 'Operating Systems & Linux', faculty_id: userIds['faculty@college.edu'], schedule: 'Mon, Wed 02:00 PM', room: 'Hall 104', credits: 3, department: 'Computer Science' },
    { code: 'CS104', name: 'Computer Networks & Security', faculty_id: userIds['priya@college.edu'], schedule: 'Tue, Thu 02:30 PM', room: 'Hall 201', credits: 4, department: 'Computer Science' },
    { code: 'CS105', name: 'Web Application Engineering', faculty_id: userIds['faculty@college.edu'], schedule: 'Fri 01:30 PM', room: 'Lab 5', credits: 3, department: 'Computer Science' }
  ];

  const courseIds = {};
  for (const c of courses) {
    const res = run(`
      INSERT INTO courses (code, name, faculty_id, department, credits, schedule, room)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [c.code, c.name, c.faculty_id, c.department, c.credits, c.schedule, c.room]);
    courseIds[c.code] = Number(res.lastInsertRowid);
  }
  console.log(`Seeded ${courses.length} courses.`);

  // 3. Enroll Students
  const studentEmails = [
    'student@college.edu',
    'rohit@college.edu',
    'ananya@college.edu',
    'vikram@college.edu',
    'sneha@college.edu',
    'kavya@college.edu'
  ];

  for (const sEmail of studentEmails) {
    for (const cCode of Object.keys(courseIds)) {
      run(`
        INSERT INTO enrollments (student_id, course_id)
        VALUES (?, ?)
      `, [userIds[sEmail], courseIds[cCode]]);
    }
  }
  console.log(`Enrolled students in courses.`);

  // 4. Generate Historical Attendance Records
  // 14 class dates over the last month
  const pastDates = [
    '2026-10-27', '2026-10-29', '2026-10-31',
    '2026-11-03', '2026-11-05', '2026-11-07',
    '2026-11-10', '2026-11-12', '2026-11-14',
    '2026-11-17', '2026-11-19', '2026-11-20',
    '2026-11-21', '2026-11-22'
  ];

  let recordCount = 0;

  // We set specific attendance profiles:
  // Aarav (student@college.edu): High attendance (~93%)
  // Ananya (ananya@college.edu): Very High attendance (~100%)
  // Sneha (sneha@college.edu): Very High attendance (~93%)
  // Rohit (rohit@college.edu): Low attendance (<75% - e.g. 57%)
  // Vikram (vikram@college.edu): Low attendance (<75% - e.g. 64%)
  // Kavya (kavya@college.edu): Low attendance (<75% - e.g. 50%)

  const getStatusForStudent = (email, dateIdx, courseCode) => {
    if (email === 'ananya@college.edu') {
      return dateIdx === 5 ? 'late' : 'present';
    }
    if (email === 'sneha@college.edu') {
      return dateIdx === 8 ? 'absent' : 'present';
    }
    if (email === 'student@college.edu') { // Aarav
      if (dateIdx === 3) return 'late';
      if (dateIdx === 9) return 'absent';
      return 'present'; // 12/14 = 86%
    }
    if (email === 'rohit@college.edu') {
      // Rohit: absent frequently in CS101, CS102, CS103
      if ([1, 3, 5, 7, 9, 11].includes(dateIdx)) return 'absent';
      if (dateIdx === 2) return 'late';
      return 'present'; // 7/14 = 50% -> below 75%
    }
    if (email === 'vikram@college.edu') {
      // Vikram: absent on 5 dates
      if ([2, 4, 6, 8, 12].includes(dateIdx)) return 'absent';
      if (dateIdx === 1) return 'late';
      return 'present'; // 9/14 = 64% -> below 75%
    }
    if (email === 'kavya@college.edu') {
      // Kavya: absent on 7 dates
      if ([0, 2, 4, 6, 8, 10, 13].includes(dateIdx)) return 'absent';
      return 'present'; // 7/14 = 50% -> below 75%
    }
    return 'present';
  };

  for (const cCode of Object.keys(courseIds)) {
    const facultyId = cCode === 'CS102' || cCode === 'CS104' 
      ? userIds['priya@college.edu'] 
      : userIds['faculty@college.edu'];

    for (let i = 0; i < pastDates.length; i++) {
      const date = pastDates[i];
      for (const sEmail of studentEmails) {
        const studentId = userIds[sEmail];
        const status = getStatusForStudent(sEmail, i, cCode);
        const remarks = status === 'absent' ? 'Unexcused absence' : (status === 'late' ? 'Arrived 15m late' : 'Attended on time');

        run(`
          INSERT INTO attendance (course_id, student_id, date, status, marked_by, remarks)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [courseIds[cCode], studentId, date, status, facultyId, remarks]);
        recordCount++;
      }
    }
  }
  console.log(`Seeded ${recordCount} attendance records across ${pastDates.length} class dates.`);

  // 5. Insert Announcements
  run(`
    INSERT INTO announcements (author_id, course_id, title, content, priority, created_at)
    VALUES (?, ?, ?, ?, 'high', CURRENT_TIMESTAMP)
  `, [
    userIds['faculty@college.edu'],
    courseIds['CS101'],
    'Midterm Exam Schedule & Attendance Policy',
    'Please note that as per Department regulations, a minimum of 75% overall attendance is strictly required to be eligible for midterm examinations. Students with shortage must contact faculty immediately.'
  ]);

  run(`
    INSERT INTO announcements (author_id, course_id, title, content, priority, created_at)
    VALUES (?, NULL, 'Campus Workshop: Cloud Native Architecture & AI', 'Join the technical seminar on Saturday in the Main Auditorium at 11 AM. Attendance counts towards co-curricular points.', 'normal', CURRENT_TIMESTAMP)
  `, [
    userIds['admin@college.edu']
  ]);

  // 6. Insert Initial Notifications
  const initialNotifications = [
    {
      userId: userIds['student@college.edu'],
      title: 'Welcome to Student Attendance Portal',
      message: 'Welcome Aarav! You can track your course-wise attendance percentages, view upcoming lectures, and download detailed attendance reports here. System Built by Mahi and Team.',
      type: 'info',
      link: '/dashboard'
    },
    {
      userId: userIds['rohit@college.edu'],
      title: 'CRITICAL: Attendance Shortage in CS101',
      message: 'Your current attendance in CS101 (Data Structures) has dropped to 57%, which is below the mandatory 75% threshold. Please meet Prof. Rajesh Verma during office hours.',
      type: 'warning',
      link: '/reports'
    },
    {
      userId: userIds['rohit@college.edu'],
      title: 'Low Attendance Warning in CS102',
      message: 'Your attendance in Database Management Systems is currently below 75%. Maintain regular attendance to avoid disciplinary action.',
      type: 'warning',
      link: '/reports'
    },
    {
      userId: userIds['vikram@college.edu'],
      title: 'Attendance Advisory Notice',
      message: 'Your cumulative attendance across CS101 and CS103 is below 70%. Please submit medical or official excuse slips if any.',
      type: 'warning',
      link: '/reports'
    },
    {
      userId: userIds['kavya@college.edu'],
      title: 'Attendance Alert: Below 75% Limit',
      message: 'You have missed 7 lectures in recent weeks. Your current percentage is 50%. Please schedule a meeting with your academic advisor.',
      type: 'warning',
      link: '/reports'
    },
    {
      userId: userIds['faculty@college.edu'],
      title: 'System Ready for Attendance Marking',
      message: 'Welcome Prof. Rajesh Verma. All 5 computer science courses and 6 student rosters have been loaded. You can mark daily attendance and recalculate alerts anytime.',
      type: 'success',
      link: '/mark-attendance'
    },
    {
      userId: userIds['admin@college.edu'],
      title: 'Weekly Attendance Audit Ready',
      message: 'System audit report ready. 3 students currently have attendance below 75% and have received automated notification alerts.',
      type: 'info',
      link: '/reports'
    }
  ];

  for (const n of initialNotifications) {
    run(`
      INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `, [n.userId, n.title, n.message, n.type, n.link]);
  }
  console.log(`Seeded ${initialNotifications.length} notifications.`);

  // Recalculate alerts to ensure completeness
  const alertStats = recalculateLowAttendanceAlerts();
  console.log('Ran recalculateLowAttendanceAlerts:', alertStats);

  console.log('--- Seeding Completed Successfully! (Built by Mahi and Team) ---');
}

if (require.main === module) {
  try {
    seed();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

module.exports = { seed };
