import { NextFunction, Request, Response } from 'express';

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

    // Verify token and get user (mock implementation)
    const mockUser = {
      id: 'admin-user-id',
      role: 'admin'
    };

    // Check if user is admin
    if (mockUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Attach user to request
    req.user = {
      id: mockUser.id,
      role: mockUser.role
    };

    next();
  } catch (error) {
    console.error('Error verifying admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get auth token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token (mock implementation)
    // In a real implementation, you would verify JWT token here
    
    // Mock user - replace with actual JWT verification
    req.user = {
      id: 'mock-user-id',
      role: 'user'
    };

    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}