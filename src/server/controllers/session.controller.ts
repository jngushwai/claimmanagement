import { Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

export async function getSessions(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    if (!lecturer) return res.json({ sessions: [] });

    const { month, year } = req.query;
    let query = `
      SELECT s.*, m.code as moduleCode, m.name as moduleName, c.name as className, c.type as classType
      FROM sessions s
      LEFT JOIN modules m ON s.moduleId = m.id
      LEFT JOIN classes c ON s.classId = c.id
      WHERE s.lecturerId = ?
    `;
    const params: any[] = [lecturer.id];

    if (month && year) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      query += ` AND s.date LIKE ?`;
      params.push(`${prefix}%`);
    }

    query += ` ORDER BY s.date DESC`;

    const rawSessions = db.prepare(query).all(...params) as any[];
    const sessions = rawSessions.map(s => ({
      ...s,
      module: { id: s.moduleId, code: s.moduleCode, name: s.moduleName },
      class: { id: s.classId, name: s.className, type: s.classType },
    }));

    return res.json({ sessions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createSession(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.body.classId) as any;

    if (!lecturer || !cls) return res.status(400).json({ error: 'Invalid lecturer or class' });

    const { moduleId, classId, date, hours } = req.body;
    const h = parseFloat(hours) || 3;
    const hourlyRate = cls.type === 'OD' ? lecturer.odRate : lecturer.degreeRate;
    const tuition = Math.round(h * hourlyRate);
    const transport = lecturer.transportRate;
    const gross = tuition + transport;

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO sessions (id, lecturerId, moduleId, classId, date, hours, hourlyRate, tuition, transport, gross, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(id, lecturer.id, moduleId, classId, date, h, hourlyRate, tuition, transport, gross);

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any;
    session.module = db.prepare('SELECT * FROM modules WHERE id = ?').get(session.moduleId);
    session.class = db.prepare('SELECT * FROM classes WHERE id = ?').get(session.classId);

    return res.json({ session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateSession(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.body.classId) as any;
    if (!lecturer || !cls) return res.status(400).json({ error: 'Invalid data' });

    const { id } = req.params;
    const { moduleId, classId, date, hours } = req.body;
    const h = parseFloat(hours) || 3;
    const hourlyRate = cls.type === 'OD' ? lecturer.odRate : lecturer.degreeRate;
    const tuition = Math.round(h * hourlyRate);
    const transport = lecturer.transportRate;
    const gross = tuition + transport;

    db.prepare(`
      UPDATE sessions SET moduleId = ?, classId = ?, date = ?, hours = ?, hourlyRate = ?, tuition = ?, transport = ?, gross = ?
      WHERE id = ? AND lecturerId = ?
    `).run(moduleId, classId, date, h, hourlyRate, tuition, transport, gross, id, lecturer.id);

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any;
    session.module = db.prepare('SELECT * FROM modules WHERE id = ?').get(session.moduleId);
    session.class = db.prepare('SELECT * FROM classes WHERE id = ?').get(session.classId);

    return res.json({ session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteSession(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { id } = req.params;
    db.prepare('DELETE FROM sessions WHERE id = ? AND lecturerId = ?').run(id, lecturer.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
