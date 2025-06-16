import { NextFunction, Request, Response } from 'express';
import { db } from '../lib/supabase';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export async function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // Get auth token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token and get user
    const { data: user, error } = await db.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const { data: userRole } = await db.users.getRole(user.id);
    if (!userRole || userRole.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: userRole.role
    };

    next();
  } catch (error) {
    console.error('Error verifying admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 