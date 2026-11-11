import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'dit_claim_system_secret_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    lecturerId?: string;
  };
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    const user = db.prepare('SELECT id, email, role, isActive FROM users WHERE id = ?').get(payload.id) as any;
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User account is inactive or disabled' });
    }

    const lecturer = db.prepare('SELECT id FROM lecturers WHERE userId = ?').get(user.id) as any;

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: Boolean(user.isActive),
      lecturerId: lecturer?.id,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'super_admin' || !req.user.isActive) {
    return res.status(403).json({ error: 'Super Admin privileges required' });
  }
  next();
}
