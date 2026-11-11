import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'dit_claims.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS programmes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    departmentId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT,
    role TEXT DEFAULT 'lecturer',
    isActive BOOLEAN DEFAULT 1,
    googleId TEXT UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lecturers (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    phone TEXT,
    departmentId TEXT,
    programmeId TEXT,
    bankName TEXT,
    bankAccountName TEXT,
    accountNumber TEXT,
    hourlyRate REAL DEFAULT 25000,
    degreeRate REAL DEFAULT 25000,
    odRate REAL DEFAULT 20000,
    transportRate REAL DEFAULT 15000,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (programmeId) REFERENCES programmes(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    lecturerId TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturerId) REFERENCES lecturers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    lecturerId TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- DEGREE or OD
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturerId) REFERENCES lecturers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS timetable_entries (
    id TEXT PRIMARY KEY,
    lecturerId TEXT NOT NULL,
    moduleId TEXT NOT NULL,
    classId TEXT NOT NULL,
    dayOfWeek INTEGER NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    room TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturerId) REFERENCES lecturers(id) ON DELETE CASCADE,
    FOREIGN KEY (moduleId) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    lecturerId TEXT NOT NULL,
    moduleId TEXT NOT NULL,
    classId TEXT NOT NULL,
    date TEXT NOT NULL,
    hours REAL NOT NULL,
    hourlyRate REAL NOT NULL,
    tuition REAL NOT NULL,
    transport REAL NOT NULL,
    gross REAL NOT NULL,
    status TEXT DEFAULT 'PENDING',
    feedback TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturerId) REFERENCES lecturers(id) ON DELETE CASCADE,
    FOREIGN KEY (moduleId) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    lecturerId TEXT NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    totalHours REAL DEFAULT 0,
    totalTuition REAL DEFAULT 0,
    totalTransport REAL DEFAULT 0,
    totalGross REAL DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    feedback TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturerId) REFERENCES lecturers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    lecturerId TEXT NOT NULL,
    sessionId TEXT,
    claimId TEXT,
    name TEXT NOT NULL,
    fileUrl TEXT NOT NULL,
    fileType TEXT NOT NULL,
    category TEXT DEFAULT 'ATTENDANCE_SHEET',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturerId) REFERENCES lecturers(id) ON DELETE CASCADE,
    FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (claimId) REFERENCES claims(id) ON DELETE SET NULL
  );
`);

// Seed initial data if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  console.log('Seeding SQLite Database with DIT defaults...');

  const deptId = 'dept-cse-1';
  db.prepare('INSERT OR IGNORE INTO departments (id, name, code) VALUES (?, ?, ?)').run(deptId, 'Computer Science and Engineering', 'CSE');

  const progId = 'prog-bsc-it-1';
  db.prepare('INSERT OR IGNORE INTO programmes (id, name, code, departmentId) VALUES (?, ?, ?, ?)').run(progId, 'Bachelor of Engineering in Information Technology', 'BSc-IT', deptId);

  // Admin User
  const adminUserId = 'user-admin-1';
  const adminLecturerId = 'lect-admin-1';
  const adminHash = bcrypt.hashSync('Admin@2026', 10);
  db.prepare('INSERT OR IGNORE INTO users (id, email, passwordHash, role, isActive) VALUES (?, ?, ?, ?, ?)').run(adminUserId, 'admin@dit.ac.tz', adminHash, 'super_admin', 1);
  db.prepare(`
    INSERT OR IGNORE INTO lecturers (id, userId, firstName, lastName, phone, departmentId, programmeId, bankName, bankAccountName, accountNumber, hourlyRate, degreeRate, odRate, transportRate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(adminLecturerId, adminUserId, 'System', 'Administrator', '+255 22 215 0174', deptId, progId, 'NBC Bank', 'DIT Admin', '011102003040', 25000, 25000, 20000, 15000);

  // Lecturer User
  const lectUserId = 'user-lect-1';
  const lectId = 'lect-john-1';
  const lectHash = bcrypt.hashSync('Lecturer@2026', 10);
  db.prepare('INSERT OR IGNORE INTO users (id, email, passwordHash, role, isActive) VALUES (?, ?, ?, ?, ?)').run(lectUserId, 'dr.mwanga@dit.ac.tz', lectHash, 'lecturer', 1);
  db.prepare(`
    INSERT OR IGNORE INTO lecturers (id, userId, firstName, lastName, phone, departmentId, programmeId, bankName, bankAccountName, accountNumber, hourlyRate, degreeRate, odRate, transportRate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(lectId, lectUserId, 'Dr. John', 'Mwanga', '+255 715 123 456', deptId, progId, 'CRDB Bank', 'John Mwanga', '0150234567890', 25000, 25000, 20000, 15000);

  // Sample Module
  const modId = 'mod-1';
  db.prepare('INSERT OR IGNORE INTO modules (id, lecturerId, code, name, isActive) VALUES (?, ?, ?, ?, ?)').run(modId, lectId, 'TSE 07201', 'Advanced Web Application Development', 1);

  // Sample Class
  const classId = 'class-1';
  db.prepare('INSERT OR IGNORE INTO classes (id, lecturerId, name, type) VALUES (?, ?, ?, ?)').run(classId, lectId, 'BTIT III', 'DEGREE');

  // Timetable entry
  db.prepare('INSERT OR IGNORE INTO timetable_entries (id, lecturerId, moduleId, classId, dayOfWeek, startTime, endTime, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('tt-1', lectId, modId, classId, 1, '08:00', '11:00', 'Lab 2');

  // Sample Session
  db.prepare(`
    INSERT OR IGNORE INTO sessions (id, lecturerId, moduleId, classId, date, hours, hourlyRate, tuition, transport, gross, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('sess-1', lectId, modId, classId, '2026-11-02', 3, 25000, 75000, 15000, 90000, 'APPROVED');

  // Sample Claim
  db.prepare(`
    INSERT OR IGNORE INTO claims (id, lecturerId, month, year, totalHours, totalTuition, totalTransport, totalGross, status, feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('claim-1', lectId, 10, 2026, 24, 600000, 120000, 720000, 'APPROVED', 'Verified and approved by DITSO.');

  console.log('Database seeded successfully!');
}

export default db;
