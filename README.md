# 🎓 Student Attendance System
> **Designed & Built by Mahi and Team**  
> Modern, full-stack, enterprise-grade attendance management system powered by React (Vite) + Tailwind CSS and Node.js + Express + SQLite (Zero-configuration).

---

## ✨ Key Features & Capabilities

### 1. 🔐 Authentication & Roles
- **Multi-Role Access Control**: Tailored experiences for **Admin**, **Faculty**, and **Student**.
- **Secure Authentication**: Passwords hashed with `bcryptjs`, session managed via stateless JSON Web Tokens (JWT).
- **Student Self-Registration**: Direct registration form for new students with automated course enrollment and roll number generation.
- **1-Click Demo Logins**: Instant quick-fill demo buttons for all roles on the login screen.

### 2. 📝 Daily Attendance Marking Desk (Faculty & Admin)
- **Subject & Date Selection**: Choose any curriculum course and date (with quick "Today" and "Yesterday" shortcuts).
- **Real-Time Status Indicator**: Shows whether attendance for the selected date has already been recorded or is a new session.
- **Student Roster Toggle**: Interactive segmented toggle for **Present**, **Late**, and **Absent** per student with individual remarks.
- **1-Click "Mark All Present"**: Quick helper button to mark all enrolled students present in one click.
- **Duplicate-Entry Protection**: Database-level `UPSERT` on `(course_id, student_id, date)` prevents accidental duplicate records while seamlessly updating previously marked sessions.

### 3. 📊 Analytics & Attendance Reports
- **Student-Wise Summary**: Total sessions held, attended classes (Present + Late), absences, and calculated attendance percentage.
- **Subject-Wise Summary**: Average class attendance rate and progress bars across all courses.
- **75% Mandatory Attendance Threshold**: Visual status badges flagging attendance below 75% (`⚠️ SHORTAGE (<75%)` alert badges).
- **Multi-Dimensional Filters**: Filter reports by Subject, Student, Date Range (From - To), and an instant toggle: *"Only show students below 75%"*.
- **Download CSV Export**: 1-click download of clean, RFC-compliant CSV reports formatted for Excel and Google Sheets.

### 4. 🔔 Notifications & Automated Alerts
- **Automated Low-Attendance Warnings**: System automatically generates warning notifications when a student's attendance drops below 75%.
- **Unread Counter Badge**: Live counter in navbar bell icon with dropdown popover.
- **Notification Actions**: Individual *"Mark as Read"* and *"Mark All as Read"*.
- **Recalculate Alerts Button**: Faculty and Admin can trigger a system-wide recalculation of attendance percentages to dispatch fresh warning alerts.
- **Campus Broadcast Notices**: Faculty and Admin can compose and broadcast announcements to a specific course roster or campus-wide.

### 5. 🗄️ Zero-Configuration SQLite Architecture
- Uses Node.js native **SQLite (`DatabaseSync`)** with **Write-Ahead Logging (WAL)** mode.
- **Zero external database setup required** — works instantly out of the box on any machine.
- Pre-seeded with 9 users, 5 curriculum courses, 420+ attendance records, and active low-attendance alerts.
- Express serves the optimized static React production build from `../client/dist` with SPA catch-all routing.

---

## 👥 Pre-Seeded Demo Accounts

You can log in instantly using the 1-click demo buttons on the login screen, or enter the credentials below:

| Role | Name | Email | Password | Details / Test Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Admin Sharma | `admin@college.edu` | `admin123` | Full administrative control, system reports, courses, alert recalculation |
| **Faculty** | Prof. Rajesh Verma | `faculty@college.edu` | `faculty123` | Mark daily attendance, toggle statuses, broadcast announcements |
| **Faculty** | Prof. Priya Iyer | `priya@college.edu` | `faculty123` | Additional faculty account managing DBMS and Network Security |
| **Student** | Aarav Patel | `student@college.edu` | `student123` | Good attendance profile (**86%**), view personal reports |
| **Student** | Rohit Mehra | `rohit@college.edu` | `student123` | Low attendance alert profile (**50%** — tests `<75%` warning badge) |
| **Student** | Vikram Singh | `vikram@college.edu` | `student123` | Borderline shortage profile (**64%** — tests low attendance warning) |
| **Student** | Kavya Reddy | `kavya@college.edu` | `student123` | Critical shortage profile (**50%** — tests warning alert banner) |

---

## 🚀 Quick Start Guide

### Step 1: Run Seed Script (Already seeded)
```bash
npm run seed
```

### Step 2: Start the Production Server
The Express server serves the compiled React frontend and the REST API simultaneously on port 5000:
```bash
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!

### Development Mode (Optional)
If you wish to run the Vite hot-reloading dev server:
- Backend: `npm run dev:server` (Port 5000)
- Frontend: `npm run dev:client` (Port 5173 with automatic `/api` proxy)

---

## 🛠️ Project Structure

```
Student Attendance System/
├── package.json               # Root scripts (start, seed, build)
├── test_system.js             # End-to-end automated verification suite
├── server/
│   ├── index.js               # Express server & static React distribution serving
│   ├── db.js                  # SQLite (DatabaseSync) schema & query wrappers
│   ├── seed.js                # Database seed script
│   ├── middleware/
│   │   └── auth.js            # JWT verification & role authorization
│   ├── routes/
│   │   ├── auth.js            # Login, register, me, demo-users
│   │   ├── attendance.js      # Sheet, mark (UPSERT), reports, CSV export, recalculate
│   │   ├── subjects.js        # Courses list & enrolled student roster
│   │   ├── students.js        # Student directory & profile breakdown
│   │   └── notifications.js   # Alerts, announcements, read-all, broadcast
│   └── data/
│       └── attendance.db      # SQLite WAL database file
└── client/
    ├── index.html
    ├── vite.config.js         # Vite configuration with /api proxy
    ├── tailwind.config.js     # Tailwind styling configuration
    └── src/
        ├── App.jsx            # Main app shell & router
        ├── context/
        │   ├── AuthContext.jsx         # User auth, JWT token, quick login
        │   └── NotificationContext.jsx # Unread count, polling, recalculate
        ├── services/
        │   └── api.js                  # Relative /api client & CSV downloader
        ├── components/
        │   ├── Navbar.jsx              # Header with Mahi & Team branding & notifications
        │   ├── Footer.jsx              # Footer with Mahi & Team credits & tech stack
        │   ├── QuickFillButtons.jsx    # 1-Click demo accounts on login
        │   ├── LowAttendanceAlertBanner.jsx # Warning banner for <75% shortage
        │   └── AboutModal.jsx          # Architecture & team modal
        └── pages/
            ├── Login.jsx               # Login & Student Registration tabs
            ├── Dashboard.jsx           # Role-adaptive analytics dashboard
            ├── AttendanceMarking.jsx   # Interactive marking desk with "Mark All Present"
            ├── AttendanceReports.jsx   # Student & subject reports with CSV export
            ├── NotificationsPage.jsx   # Notification center & broadcast modal
            ├── CoursesPage.jsx         # Curriculum subjects & enrolled rosters
            └── StudentsDirectoryPage.jsx # Student registry & individual breakdowns
```

---

## 🏆 Credits

**Designed, Engineered, and Built by Mahi and Team**  
*Built for excellence in educational technology and campus administration.*
