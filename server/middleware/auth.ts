import type { Request, Response, NextFunction } from 'express';
import { getUserByToken } from '../db.js';

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = header.slice(7);
  const user = getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  req.userId = user.id;
  next();
}
