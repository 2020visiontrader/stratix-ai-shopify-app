import jwt from 'jsonwebtoken';
import { DatabaseService } from '../../services/DatabaseService.js';

const dbService = DatabaseService.getInstance();

export const authMiddleware = async (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await dbService.getUserById(decoded.userId);
    
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
      shopId: user.shopId,
      shopDomain: user.shopDomain
    };

    next();
  } catch (error) {
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

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await dbService.getUserById(decoded.userId);
    
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        shopId: user.shopId,
        shopDomain: user.shopDomain
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token verification fails, continue without authentication
    req.user = null;
    next();
  }
};

export const requireShopAccess = (req, res, next) => {
  if (!req.user || !req.user.shopId) {
    return res.status(403).json({
      success: false,
      error: 'Shop access required.'
    });
  }
  next();
};

export const requireTrialOrSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const trial = await dbService.getActiveTrial(req.user.id);
    const subscription = await dbService.getActiveSubscription(req.user.id);

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
  } catch (error) {
    console.error('Trial/subscription check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify trial or subscription status.'
    });
  }
};

export const requireActiveSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const subscription = await dbService.getActiveSubscription(req.user.id);

    if (!subscription || subscription.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required.',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify subscription status.'
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
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
