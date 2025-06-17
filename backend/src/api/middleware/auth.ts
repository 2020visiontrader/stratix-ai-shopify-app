import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../../services/DatabaseService';

const dbService = DatabaseService.getInstance();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    shopDomain?: string;
  };
  trial?: any;
  subscription?: any;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Mock user for now - in real implementation would query database
    const user = {
      id: decoded.userId || 'mock-user-id',
      email: decoded.email || 'user@example.com',
      role: decoded.role || 'user',
      isActive: true
    };

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found or inactive.'
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed.'
    });
  }
};

export const optionalAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = undefined;
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      req.user = undefined;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Mock user for now
    const user = {
      id: decoded.userId || 'mock-user-id',
      email: decoded.email || 'user@example.com',
      role: decoded.role || 'user',
      shopDomain: decoded.shopDomain,
      isActive: true
    };
    
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        shopDomain: user.shopDomain
      };
    } else {
      req.user = undefined;
    }

    next();
  } catch (error: any) {
    // If token verification fails, continue without authentication
    req.user = undefined;
    next();
  }
};

export const requireShopAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.shopDomain) {
    return res.status(403).json({
      success: false,
      error: 'Shop access required.'
    });
  }
  next();
};

export const requireTrialOrSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // Mock trial/subscription check - in real implementation would query database
    const trial = { id: 'mock-trial', status: 'ACTIVE' };
    const subscription = { id: 'mock-subscription', status: 'ACTIVE' };

    if (!trial && !subscription) {
      return res.status(403).json({
        success: false,
        error: 'Active trial or subscription required.',
        code: 'TRIAL_OR_SUBSCRIPTION_REQUIRED'
      });
    }

    // Add trial/subscription info to request
    req.trial = trial;
    req.subscription = subscription;

    next();
  } catch (error: any) {
    console.error('Trial/subscription check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify trial or subscription status.'
    });
  }
};

export const requireActiveSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // Mock subscription check - in real implementation would query database
    const subscription = { id: 'mock-subscription', status: 'ACTIVE' };

    if (!subscription || subscription.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required.',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    req.subscription = subscription;
    next();
  } catch (error: any) {
    console.error('Subscription check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify subscription status.'
    });
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Role required.'
      });
    }

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');

export const verifyAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Error verifying admin status'
    });
  }
};
