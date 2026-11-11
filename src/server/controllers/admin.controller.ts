import { Response } from 'express';
import db from '../db';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateAdminSummaryExcel } from '../utils/excel.util';
import crypto from 'crypto';

export async function getAdminDashboard(req: AuthRequest, res: Response) {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
    const lecturerCount = (db.prepare('SELECT COUNT(*) as c FROM lecturers').get() as any).c;
    const sessionCount = (db.prepare('SELECT COUNT(*) as c FROM sessions').get() as any).c;
    const claimCount = (db.prepare('SELECT COUNT(*) as c FROM claims').get() as any).c;

    const sessions = db.prepare('SELECT hours, tuition, transport, gross FROM sessions').all() as any[];
    const totalHours = sessions.reduce((acc, s) => acc + s.hours, 0);
    const totalTuition = sessions.reduce((acc, s) => acc + s.tuition, 0);
    const totalTransport = sessions.reduce((acc, s) => acc + s.transport, 0);
    const totalGross = totalTuition + totalTransport;

    const claims = db.prepare('SELECT * FROM claims ORDER BY createdAt DESC LIMIT 10').all() as any[];
    const recentClaims = claims.map(c => {
      const lecturer = db.prepare('SELECT * FROM lecturers WHERE id = ?').get(c.lecturerId) as any;
      if (lecturer && lecturer.departmentId) lecturer.department = db.prepare('SELECT * FROM departments WHERE id = ?').get(lecturer.departmentId);
      c.lecturer = lecturer;
      c.documents = db.prepare('SELECT * FROM documents WHERE claimId = ?').all(c.id);
      return c;
    });

    const users = db.prepare('SELECT id, email, role, isActive, createdAt FROM users ORDER BY createdAt DESC LIMIT 5').all() as any[];
    const recentUsers = users.map(u => {
      const lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(u.id) as any;
      if (lecturer && lecturer.departmentId) lecturer.department = db.prepare('SELECT * FROM departments WHERE id = ?').get(lecturer.departmentId);
      return { ...u, lecturer };
    });

    return res.json({
      stats: { userCount, lecturerCount, sessionCount, claimCount, totalHours, totalTuition, totalTransport, totalGross },
      recentClaims,
      recentUsers,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const userRows = db.prepare('SELECT id, email, role, isActive, createdAt FROM users ORDER BY createdAt DESC').all() as any[];
    const users = userRows.map(u => {
      const lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(u.id) as any;
      if (lecturer) {
        if (lecturer.departmentId) lecturer.department = db.prepare('SELECT * FROM departments WHERE id = ?').get(lecturer.departmentId);
        if (lecturer.programmeId) lecturer.programme = db.prepare('SELECT * FROM programmes WHERE id = ?').get(lecturer.programmeId);
      }
      return { ...u, lecturer };
    });

    const departments = db.prepare('SELECT * FROM departments').all() as any[];
    for (const d of departments) {
      d.programmes = db.prepare('SELECT * FROM programmes WHERE departmentId = ?').all(d.id);
    }

    return res.json({ users, departments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { email, password, role, firstName, lastName, phone, departmentId, programmeId, hourlyRate, degreeRate, odRate, transportRate } = req.body;
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const userId = crypto.randomUUID();
    const lecturerId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password || 'DIT@2026', 10);

    db.transaction(() => {
      db.prepare('INSERT INTO users (id, email, passwordHash, role, isActive) VALUES (?, ?, ?, ?, 1)').run(userId, email, passwordHash, role || 'lecturer');
      db.prepare(`
        INSERT INTO lecturers (id, userId, firstName, lastName, phone, departmentId, programmeId, hourlyRate, degreeRate, odRate, transportRate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        lecturerId,
        userId,
        firstName,
        lastName,
        phone || null,
        departmentId || null,
        programmeId || null,
        hourlyRate ? parseFloat(hourlyRate) : 25000,
        degreeRate ? parseFloat(degreeRate) : 25000,
        odRate ? parseFloat(odRate) : 20000,
        transportRate ? parseFloat(transportRate) : 15000
      );
    })();

    const user = db.prepare('SELECT id, email, role, isActive FROM users WHERE id = ?').get(userId) as any;
    user.lecturer = db.prepare('SELECT * FROM lecturers WHERE id = ?').get(lecturerId);

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role, isActive, firstName, lastName, phone, departmentId, programmeId, hourlyRate, degreeRate, odRate, transportRate, password } = req.body;

    if (role) db.prepare('UPDATE users SET role = ?, isActive = ? WHERE id = ?').run(role, isActive !== false ? 1 : 0, id);
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(hash, id);
    }

    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(id) as any;
    if (lecturer) {
      db.prepare(`
        UPDATE lecturers SET firstName = ?, lastName = ?, phone = ?, departmentId = ?, programmeId = ?, hourlyRate = ?, degreeRate = ?, odRate = ?, transportRate = ?
        WHERE id = ?
      `).run(
        firstName,
        lastName,
        phone || null,
        departmentId || null,
        programmeId || null,
        hourlyRate !== undefined ? parseFloat(hourlyRate) : 25000,
        degreeRate !== undefined ? parseFloat(degreeRate) : 25000,
        odRate !== undefined ? parseFloat(odRate) : 20000,
        transportRate !== undefined ? parseFloat(transportRate) : 15000,
        lecturer.id
      );
    }

    const user = db.prepare('SELECT id, email, role, isActive FROM users WHERE id = ?').get(id) as any;
    user.lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(id);

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getAdminClaims(req: AuthRequest, res: Response) {
  try {
    const claims = db.prepare('SELECT * FROM claims ORDER BY year DESC, month DESC').all() as any[];
    for (const c of claims) {
      const lecturer = db.prepare('SELECT * FROM lecturers WHERE id = ?').get(c.lecturerId) as any;
      if (lecturer) {
        if (lecturer.departmentId) lecturer.department = db.prepare('SELECT * FROM departments WHERE id = ?').get(lecturer.departmentId);
        if (lecturer.programmeId) lecturer.programme = db.prepare('SELECT * FROM programmes WHERE id = ?').get(lecturer.programmeId);
      }
      c.lecturer = lecturer;
      c.documents = db.prepare('SELECT * FROM documents WHERE claimId = ?').all(c.id);
    }
    return res.json({ claims });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateClaimStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    db.prepare('UPDATE claims SET status = ?, feedback = ? WHERE id = ?').run(status, feedback || null, id);

    const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(id) as any;
    const lecturer = db.prepare('SELECT * FROM lecturers WHERE id = ?').get(claim.lecturerId) as any;
    if (lecturer && lecturer.departmentId) lecturer.department = db.prepare('SELECT * FROM departments WHERE id = ?').get(lecturer.departmentId);
    claim.lecturer = lecturer;
    claim.documents = db.prepare('SELECT * FROM documents WHERE claimId = ?').all(claim.id);

    return res.json({ claim });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function downloadAdminSummaryExcel(req: AuthRequest, res: Response) {
  try {
    const rawClaims = db.prepare('SELECT * FROM claims ORDER BY year DESC, month DESC').all() as any[];
    const claims = rawClaims.map(c => {
      const lecturer = db.prepare('SELECT * FROM lecturers WHERE id = ?').get(c.lecturerId) as any;
      if (lecturer && lecturer.departmentId) lecturer.department = db.prepare('SELECT * FROM departments WHERE id = ?').get(lecturer.departmentId);
      return { ...c, lecturer };
    });

    const rawSessions = db.prepare('SELECT * FROM sessions').all() as any[];
    const sessions = rawSessions.map(s => {
      const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(s.moduleId);
      const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(s.classId);
      return { ...s, module, class: cls };
    });

    const buffer = await generateAdminSummaryExcel(claims, sessions);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DIT_Institutional_Claims_Summary.xlsx');
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
