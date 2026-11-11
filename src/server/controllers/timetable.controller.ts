import { Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateTimetableTemplate } from '../utils/excel.util';
import ExcelJS from 'exceljs';
import crypto from 'crypto';

export async function getTimetable(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    if (!lecturer) return res.json({ timetable: [] });

    const entries = db.prepare(`
      SELECT t.*, m.code as moduleCode, m.name as moduleName, c.name as className, c.type as classType
      FROM timetable_entries t
      LEFT JOIN modules m ON t.moduleId = m.id
      LEFT JOIN classes c ON t.classId = c.id
      WHERE t.lecturerId = ?
      ORDER BY t.dayOfWeek ASC, t.startTime ASC
    `).all(lecturer.id) as any[];

    const timetable = entries.map(e => ({
      ...e,
      module: { id: e.moduleId, code: e.moduleCode, name: e.moduleName },
      class: { id: e.classId, name: e.className, type: e.classType },
    }));

    return res.json({ timetable });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createTimetableEntry(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { moduleId, classId, dayOfWeek, startTime, endTime, room } = req.body;
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO timetable_entries (id, lecturerId, moduleId, classId, dayOfWeek, startTime, endTime, room)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, lecturer.id, moduleId, classId, parseInt(dayOfWeek), startTime, endTime, room || null);

    const entry = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(id) as any;
    entry.module = db.prepare('SELECT * FROM modules WHERE id = ?').get(entry.moduleId);
    entry.class = db.prepare('SELECT * FROM classes WHERE id = ?').get(entry.classId);

    return res.json({ entry });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteTimetableEntry(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { id } = req.params;
    db.prepare('DELETE FROM timetable_entries WHERE id = ? AND lecturerId = ?').run(id, lecturer.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function downloadTimetableTemplate(req: AuthRequest, res: Response) {
  try {
    const buffer = await generateTimetableTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=timetable_template.xlsx');
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function importTimetable(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    if (!req.file) return res.status(400).json({ error: 'Excel file required' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer as any);
    const sheet = workbook.worksheets[0];
    let importedCount = 0;

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const moduleCode = row.getCell(1).value?.toString().trim();
      const moduleName = row.getCell(2).value?.toString().trim();
      const className = row.getCell(3).value?.toString().trim();
      const classType = row.getCell(4).value?.toString().trim().toUpperCase() || 'DEGREE';
      const dayOfWeek = parseInt(row.getCell(5).value?.toString() || '1');
      const startTime = row.getCell(6).value?.toString().trim() || '08:00';
      const endTime = row.getCell(7).value?.toString().trim() || '11:00';
      const room = row.getCell(8).value?.toString().trim() || '';

      if (!moduleCode || !className) continue;

      let mod = db.prepare('SELECT id FROM modules WHERE lecturerId = ? AND code = ?').get(lecturer.id, moduleCode) as any;
      if (!mod) {
        const modId = crypto.randomUUID();
        db.prepare('INSERT INTO modules (id, lecturerId, code, name) VALUES (?, ?, ?, ?)').run(modId, lecturer.id, moduleCode, moduleName || moduleCode);
        mod = { id: modId };
      }

      let cls = db.prepare('SELECT id FROM classes WHERE lecturerId = ? AND name = ?').get(lecturer.id, className) as any;
      if (!cls) {
        const classId = crypto.randomUUID();
        db.prepare('INSERT INTO classes (id, lecturerId, name, type) VALUES (?, ?, ?, ?)').run(classId, lecturer.id, className, classType === 'OD' ? 'OD' : 'DEGREE');
        cls = { id: classId };
      }

      const ttId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO timetable_entries (id, lecturerId, moduleId, classId, dayOfWeek, startTime, endTime, room)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(ttId, lecturer.id, mod.id, cls.id, dayOfWeek, startTime, endTime, room);

      importedCount++;
    }

    return res.json({ success: true, importedCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function populateMonthlySessions(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Month and year required' });

    const timetable = db.prepare(`
      SELECT t.*, c.type as classType
      FROM timetable_entries t
      LEFT JOIN classes c ON t.classId = c.id
      WHERE t.lecturerId = ?
    `).all(lecturer.id) as any[];

    const m = parseInt(month);
    const y = parseInt(year);
    const daysInMonth = new Date(y, m, 0).getDate();
    let generatedCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(y, m - 1, day);
      const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const matchingEntries = timetable.filter(t => t.dayOfWeek === dayOfWeek);

      for (const entry of matchingEntries) {
        const existing = db.prepare('SELECT id FROM sessions WHERE lecturerId = ? AND date = ? AND moduleId = ? AND classId = ?').get(
          lecturer.id, dateStr, entry.moduleId, entry.classId
        );

        if (existing) continue;

        const [startH, startM] = entry.startTime.split(':').map(Number);
        const [endH, endM] = entry.endTime.split(':').map(Number);
        const hours = (endH + endM / 60) - (startH + startM / 60);

        const hourlyRate = entry.classType === 'OD' ? lecturer.odRate : lecturer.degreeRate;
        const tuition = Math.round(hours * hourlyRate);
        const transport = lecturer.transportRate;
        const gross = tuition + transport;

        const sessionId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO sessions (id, lecturerId, moduleId, classId, date, hours, hourlyRate, tuition, transport, gross, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `).run(sessionId, lecturer.id, entry.moduleId, entry.classId, dateStr, hours > 0 ? hours : 3, hourlyRate, tuition, transport, gross);

        generatedCount++;
      }
    }

    return res.json({ success: true, generatedCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
