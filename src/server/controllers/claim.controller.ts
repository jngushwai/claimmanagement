import { Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateClaimExcel, generateAdminSummaryExcel } from '../utils/excel.util';
import crypto from 'crypto';

export async function getClaims(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    if (!lecturer) return res.json({ claims: [] });

    const claims = db.prepare('SELECT * FROM claims WHERE lecturerId = ? ORDER BY year DESC, month DESC').all(lecturer.id) as any[];
    for (const c of claims) {
      c.documents = db.prepare('SELECT * FROM documents WHERE claimId = ?').all(c.id);
    }

    return res.json({ claims });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function generateMonthlyClaim(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Month and year required' });

    const m = parseInt(month);
    const y = parseInt(year);
    const prefix = `${y}-${String(m).padStart(2, '0')}`;

    const sessions = db.prepare('SELECT * FROM sessions WHERE lecturerId = ? AND date LIKE ?').all(lecturer.id, `${prefix}%`) as any[];
    const totalHours = sessions.reduce((acc, s) => acc + s.hours, 0);
    const totalTuition = sessions.reduce((acc, s) => acc + s.tuition, 0);
    const totalTransport = sessions.reduce((acc, s) => acc + s.transport, 0);
    const totalGross = totalTuition + totalTransport;

    let claim = db.prepare('SELECT * FROM claims WHERE lecturerId = ? AND month = ? AND year = ?').get(lecturer.id, m, y) as any;

    if (claim) {
      db.prepare(`
        UPDATE claims SET totalHours = ?, totalTuition = ?, totalTransport = ?, totalGross = ?
        WHERE id = ?
      `).run(totalHours, totalTuition, totalTransport, totalGross, claim.id);
      claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(claim.id);
    } else {
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO claims (id, lecturerId, month, year, totalHours, totalTuition, totalTransport, totalGross, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
      `).run(id, lecturer.id, m, y, totalHours, totalTuition, totalTransport, totalGross);
      claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(id);
    }

    claim.documents = db.prepare('SELECT * FROM documents WHERE claimId = ?').all(claim.id);

    // Generate corresponding official payment request letter text
    const monthName = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const letterText = `
DAR ES SALAAM INSTITUTE OF TECHNOLOGY (DIT)
DEPARTMENT OF ${lecturer.department?.name || 'COMPUTER STUDIES'}

To: The Head of Department / Principal,
Dar es Salaam Institute of Technology,
P.O. Box 2958, Dar es Salaam.

Date: ${new Date().toLocaleDateString()}

REF: REQUEST FOR PAYMENT OF PART-TIME CONSULTATION & TEACHING ALLOWANCE FOR THE MONTH OF ${monthName.toUpperCase()}

Dear Sir/Madam,

I am writing to formally submit my consultancy and part-time teaching claim for the month of ${monthName} in respect of Academic Year 2025/2026.

During this period, I successfully conducted teaching and consultation sessions totaling ${totalHours} hours, amounting to a total gross claim of TZS ${totalGross.toLocaleString()} (Tuition: TZS ${totalTuition.toLocaleString()}, Transport: TZS ${totalTransport.toLocaleString()}).

My bank account details for direct transfer are as follows:
- Bank Name: ${lecturer.bankName || 'CRDB'}
- Account Name: ${lecturer.bankAccountName || lecturer.firstName + ' ' + lecturer.lastName}
- Account Number: ${lecturer.accountNumber || '0150000000000'}

Attached herewith is the verified student attendance sheet (PDF) and session breakdown for your review and approval.

Thank you for your continued cooperation and support.

Yours faithfully,

________________________________________
${lecturer.firstName} ${lecturer.lastName}
Part-Time Lecturer / Tutor
    `.trim();

    return res.json({ claim, sessionCount: sessions.length, letterText });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function downloadClaimExcel(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    if (lecturer.departmentId) lecturer.department = db.prepare('SELECT * FROM departments WHERE id = ?').get(lecturer.departmentId);
    if (lecturer.programmeId) lecturer.programme = db.prepare('SELECT * FROM programmes WHERE id = ?').get(lecturer.programmeId);

    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'Month and year required' });

    const m = parseInt(month as string);
    const y = parseInt(year as string);
    const prefix = `${y}-${String(m).padStart(2, '0')}`;

    const rawSessions = db.prepare(`
      SELECT s.*, m.code as moduleCode, m.name as moduleName, c.name as className, c.type as classType
      FROM sessions s
      LEFT JOIN modules m ON s.moduleId = m.id
      LEFT JOIN classes c ON s.classId = c.id
      WHERE s.lecturerId = ? AND s.date LIKE ?
      ORDER BY s.date ASC
    `).all(lecturer.id, `${prefix}%`) as any[];

    const sessions = rawSessions.map(s => ({
      ...s,
      module: { id: s.moduleId, code: s.moduleCode, name: s.moduleName },
      class: { id: s.classId, name: s.className, type: s.classType },
    }));

    let claim = db.prepare('SELECT * FROM claims WHERE lecturerId = ? AND month = ? AND year = ?').get(lecturer.id, m, y) as any;
    if (!claim) {
      const totalHours = sessions.reduce((acc, s) => acc + s.hours, 0);
      const totalTuition = sessions.reduce((acc, s) => acc + s.tuition, 0);
      const totalTransport = sessions.reduce((acc, s) => acc + s.transport, 0);
      const totalGross = totalTuition + totalTransport;
      claim = { month: m, year: y, totalHours, totalTuition, totalTransport, totalGross, status: 'PENDING' };
    }

    const allClaimsForYear = db.prepare('SELECT * FROM claims WHERE lecturerId = ? AND year = ? ORDER BY month ASC').all(lecturer.id, y);

    const buffer = await generateClaimExcel(lecturer, sessions, claim, allClaimsForYear);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=DIT_Claim_${m}_${y}.xlsx`);
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function uploadDocument(req: AuthRequest, res: Response) {
  try {
    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(req.user!.id) as any;
    const { claimId, sessionId, category } = req.body;
    if (!req.file) return res.status(400).json({ error: 'File required' });

    // Validate that student attendance sheet is PDF only
    const isAttendance = (category || 'ATTENDANCE_SHEET') === 'ATTENDANCE_SHEET';
    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');

    if (isAttendance && !isPdf) {
      return res.status(400).json({ error: 'Student attendance sheet must be uploaded in PDF format only (.pdf)' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO documents (id, lecturerId, claimId, sessionId, name, fileUrl, fileType, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      lecturer.id,
      claimId || null,
      sessionId || null,
      req.file.originalname,
      fileUrl,
      req.file.mimetype,
      category || 'ATTENDANCE_SHEET'
    );

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    return res.json({ document: doc });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
