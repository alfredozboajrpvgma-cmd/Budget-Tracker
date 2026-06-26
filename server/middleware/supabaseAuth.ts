import type { Request, Response, NextFunction } from 'express';
import { supabaseAuthClient } from '../supabaseAdmin.js';

export interface AuthedRequest extends Request {
  userId?: string;
}

export async function supabaseAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  try {
    const client = supabaseAuthClient(token);
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication failed' });
  }
}
