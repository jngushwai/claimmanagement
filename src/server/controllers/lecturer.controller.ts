import { Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    if (!lecturer) return res.status(400).json({ error: 'Lecturer profile not found' });
    const lecturerId = lecturer.id;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const prefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const sessions = db.prepare(`
      SELECT s.*, m.code as moduleCode, m.name as moduleName, c.name as className, c.type as classType
      FROM sessions s
      LEFT JOIN modules m ON s.moduleId = m.id
      LEFT JOIN classes c ON s.classId = c.id
      WHERE s.lecturerId = ? AND s.date LIKE ?
      ORDER BY s.date DESC
    `).all(lecturerId, `${prefix}%`) as any[];

    const formattedSessions = sessions.map(s => ({
      ...s,
      module: { id: s.moduleId, code: s.moduleCode, name: s.moduleName },
      class: { id: s.classId, name: s.className, type: s.classType },
    }));

    const totalHours = formattedSessions.reduce((acc, s) => acc + s.hours, 0);
    const totalTuition = formattedSessions.reduce((acc, s) => acc + s.tuition, 0);
    const totalTransport = formattedSessions.reduce((acc, s) => acc + s.transport, 0);
    const grossPay = totalTuition + totalTransport;

    // Assigned classes and modules
    const assignedClasses = db.prepare('SELECT * FROM classes WHERE lecturerId = ? ORDER BY name ASC').all(lecturerId);
    const assignedModules = db.prepare('SELECT * FROM modules WHERE lecturerId = ? ORDER BY code ASC').all(lecturerId);

    // 12-month earnings bar chart
    const monthlyEarnings = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthPrefix = `${y}-${String(m).padStart(2, '0')}`;

      const monthSessions = db.prepare('SELECT gross, hours FROM sessions WHERE lecturerId = ? AND date LIKE ?').all(lecturerId, `${monthPrefix}%`) as any[];
      const earnings = monthSessions.reduce((acc, s) => acc + s.gross, 0);
      const hours = monthSessions.reduce((acc, s) => acc + s.hours, 0);

      monthlyEarnings.push({
        monthName: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        earnings,
        hours,
      });
    }

    return res.json({
      currentMonthStats: {
        totalHours,
        totalTuition,
        totalTransport,
        grossPay,
        sessionCount: formattedSessions.length,
      },
      recentSessions: formattedSessions.slice(0, 5),
      monthlyEarnings,
      assignedClasses,
      assignedModules,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    if (lecturer) {
      if (lecturer.departmentId) lecturer.department = db.prepare('SELECT * FROM departments WHERE id = ?').get(lecturer.departmentId);
      if (lecturer.programmeId) lecturer.programme = db.prepare('SELECT * FROM programmes WHERE id = ?').get(lecturer.programmeId);
      lecturer.user = db.prepare('SELECT id, email, role, isActive FROM users WHERE id = ?').get(req.user!.id);
    }

    const departments = db.prepare('SELECT * FROM departments').all() as any[];
    for (const d of departments) {
      d.programmes = db.prepare('SELECT * FROM programmes WHERE departmentId = ?').all(d.id);
    }

    return res.json({ lecturer, departments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    if (!lecturer) return res.status(400).json({ error: 'Lecturer not found' });

    const { firstName, lastName, phone, departmentId, programmeId, bankName, bankAccountName, accountNumber, degreeRate, odRate, transportRate } = req.body;

    db.prepare(`
      UPDATE lecturers SET firstName = ?, lastName = ?, phone = ?, departmentId = ?, programmeId = ?, bankName = ?, bankAccountName = ?, accountNumber = ?, degreeRate = ?, odRate = ?, transportRate = ?
      WHERE id = ?
    `).run(
      firstName,
      lastName,
      phone || null,
      departmentId || null,
      programmeId || null,
      bankName || null,
      bankAccountName || null,
      accountNumber || null,
      degreeRate !== undefined ? parseFloat(degreeRate) : lecturer.degreeRate,
      odRate !== undefined ? parseFloat(odRate) : lecturer.odRate,
      transportRate !== undefined ? parseFloat(transportRate) : lecturer.transportRate,
      lecturer.id
    );

    const updated = db.prepare('SELECT * FROM lecturers WHERE id = ?').get(lecturer.id) as any;
    if (updated.departmentId) updated.department = db.prepare('SELECT * FROM departments WHERE id = ?').get(updated.departmentId);
    if (updated.programmeId) updated.programme = db.prepare('SELECT * FROM programmes WHERE id = ?').get(updated.programmeId);
    updated.user = db.prepare('SELECT id, email, role, isActive FROM users WHERE id = ?').get(req.user!.id);

    return res.json({ lecturer: updated, message: 'Profile updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// Modules
export async function getModules(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    if (!lecturer) return res.json({ modules: [] });
    const modules = db.prepare('SELECT * FROM modules WHERE lecturerId = ? ORDER BY code ASC').all(lecturer.id);
    return res.json({ modules });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createModule(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { code, name, isActive } = req.body;
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO modules (id, lecturerId, code, name, isActive) VALUES (?, ?, ?, ?, ?)').run(id, lecturer.id, code, name, isActive !== false ? 1 : 0);
    const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(id);
    return res.json({ module: mod });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateModule(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { id } = req.params;
    const { code, name, isActive } = req.body;
    db.prepare('UPDATE modules SET code = ?, name = ?, isActive = ? WHERE id = ? AND lecturerId = ?').run(code, name, isActive !== false ? 1 : 0, id, lecturer.id);
    const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(id);
    return res.json({ module: mod });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteModule(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { id } = req.params;
    db.prepare('DELETE FROM modules WHERE id = ? AND lecturerId = ?').run(id, lecturer.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// Classes
export async function getClasses(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    if (!lecturer) return res.json({ classes: [] });
    const classes = db.prepare('SELECT * FROM classes WHERE lecturerId = ? ORDER BY name ASC').all(lecturer.id);
    return res.json({ classes });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createClass(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { name, type } = req.body;
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO classes (id, lecturerId, name, type) VALUES (?, ?, ?, ?)').run(id, lecturer.id, name, type);
    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
    return res.json({ class: cls });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateClass(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { id } = req.params;
    const { name, type } = req.body;
    db.prepare('UPDATE classes SET name = ?, type = ? WHERE id = ? AND lecturerId = ?').run(name, type, id, lecturer.id);
    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
    return res.json({ class: cls });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteClass(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { id } = req.params;
    db.prepare('DELETE FROM classes WHERE id = ? AND lecturerId = ?').run(id, lecturer.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
