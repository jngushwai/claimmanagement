import { Request, Response } from 'express';
import db from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dit_claim_system_secret_key_2026';
const googleClient = new OAuth2Client();

export async function register(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName, phone, departmentId, programmeId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = crypto.randomUUID();
    const lecturerId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);

    const insertUser = db.prepare('INSERT INTO users (id, email, passwordHash, role, isActive) VALUES (?, ?, ?, ?, ?)');
    const insertLecturer = db.prepare(`
      INSERT INTO lecturers (id, userId, firstName, lastName, phone, departmentId, programmeId, hourlyRate, degreeRate, odRate, transportRate)
      VALUES (?, ?, ?, ?, ?, ?, ?, 25000, 25000, 20000, 15000)
    `);

    db.transaction(() => {
      insertUser.run(userId, email, passwordHash, 'lecturer', 1);
      insertLecturer.run(lecturerId, userId, firstName, lastName, phone || null, departmentId || null, programmeId || null);
    })();

    const user = getUserWithLecturer(userId);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, isActive: user.isActive }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({ token, user });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled. Contact system administrator.' });
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const fullUser = getUserWithLecturer(user.id);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, isActive: user.isActive }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({ token, user: fullUser });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Google credential required' });

    const ticket = await googleClient.verifyIdToken({ idToken: credential });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid Google token' });

    const email = payload.email;
    const googleId = payload.sub;
    const firstName = payload.given_name || 'Google';
    const lastName = payload.family_name || 'User';

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user) {
      const userId = crypto.randomUUID();
      const lecturerId = crypto.randomUUID();
      db.transaction(() => {
        db.prepare('INSERT INTO users (id, email, googleId, role, isActive) VALUES (?, ?, ?, ?, ?)').run(userId, email, googleId, 'lecturer', 1);
        db.prepare(`
          INSERT INTO lecturers (id, userId, firstName, lastName, hourlyRate, degreeRate, odRate, transportRate)
          VALUES (?, ?, ?, ?, 25000, 25000, 20000, 15000)
        `).run(lecturerId, userId, firstName, lastName);
      })();
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    } else if (!user.googleId) {
      db.prepare('UPDATE users SET googleId = ? WHERE id = ?').run(googleId, user.id);
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled.' });
    }

    const fullUser = getUserWithLecturer(user.id);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, isActive: user.isActive }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({ token, user: fullUser });
  } catch (err: any) {
    console.error('Google login error:', err);
    return res.status(500).json({ error: err.message || 'Google authentication failed' });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const user = getUserWithLecturer(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updatePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.passwordHash && currentPassword) {
      const valid = bcrypt.compareSync(currentPassword, user.passwordHash);
      if (!valid) return res.status(400).json({ error: 'Current password incorrect' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(passwordHash, user.id);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export function getUserWithLecturer(userId: string) {
  const user = db.prepare('SELECT id, email, role, isActive, googleId FROM users WHERE id = ?').get(userId) as any;
  if (!user) return null;

  const lecturer = db.prepare('SELECT * FROM lecturers WHERE userId = ?').get(userId) as any;
  if (lecturer) {
    if (lecturer.departmentId) {
      lecturer.department = db.prepare('SELECT * FROM departments WHERE id = ?').get(lecturer.departmentId);
    }
    if (lecturer.programmeId) {
      lecturer.programme = db.prepare('SELECT * FROM programmes WHERE id = ?').get(lecturer.programmeId);
    }
  }

  return { ...user, lecturer: lecturer || null };
}
