import { NextFunction, Request, Response } from 'express';
import Redis from 'ioredis';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

// Types
interface RateLimiterConfig {
  points: number;
  duration: number;
  blockDuration: number;
}

interface RateLimiters {
  [key: string]: RateLimiterMemory | RateLimiterRedis;
}

interface RateLimitReject {
  msBeforeNext: number;
  remainingPoints?: number;
  totalHits?: number;
}

interface RateLimitResponse {
  remainingPoints: number;
  msBeforeNext: number;
  totalHits: number;
}

// Redis client for distributed rate limiting
let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL);
  } catch (error) {
    console.warn('Redis connection failed, using memory rate limiter:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Rate limiter configurations
const rateLimiterConfigs: { [key: string]: RateLimiterConfig } = {
  // API endpoints
  api: {
    points: 1000, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour if exceeded
  },
  
  // Analysis endpoints
  analysis: {
    points: 50, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 1800, // Block for 30 minutes if exceeded
  },
  
  // Batch analysis (more restrictive)
  batch_analysis: {
    points: 5, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour if exceeded
  },
  
  // Authentication endpoints
  auth: {
    points: 10, // Number of requests
    duration: 900, // Per 15 minutes
    blockDuration: 900, // Block for 15 minutes if exceeded
  },
  
  // Trial management
  trial: {
    points: 20, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 1800, // Block for 30 minutes if exceeded
  },
  
  // Security scans
  security_scan: {
    points: 5, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 7200, // Block for 2 hours if exceeded
  },
  
  // Email sending
  email: {
    points: 50, // Number of emails
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour if exceeded
  },
  
  // Password reset
  password_reset: {
    points: 3, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour if exceeded
  },
  
  // Registration
  registration: {
    points: 5, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour if exceeded
  }
};

// Create rate limiters
const rateLimiters: RateLimiters = {};

for (const [key, config] of Object.entries(rateLimiterConfigs)) {
  if (redisClient) {
    rateLimiters[key] = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: `rl_${key}_`,
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
      execEvenly: true,
    });
  } else {
    rateLimiters[key] = new RateLimiterMemory({
      keyPrefix: `rl_${key}_`,
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
      execEvenly: true,
    });
  }
}

// Generic rate limiting middleware
export const rateLimitMiddleware = (type = 'api', points: number | null = null, duration: number | null = null) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let rateLimiter = rateLimiters[type];
      
      // Create custom rate limiter if points and duration are provided
      if (points && duration) {
        const customConfig = {
          points,
          duration,
          blockDuration: duration,
          execEvenly: true,
        };
        
        if (redisClient) {
          rateLimiter = new RateLimiterRedis({
            storeClient: redisClient,
            keyPrefix: `rl_custom_${type}_`,
            ...customConfig,
          });
        } else {
          rateLimiter = new RateLimiterMemory({
            keyPrefix: `rl_custom_${type}_`,
            ...customConfig,
          });
        }
      }
      
      if (!rateLimiter) {
        console.warn(`Rate limiter not found for type: ${type}`);
        return next();
      }

      // Determine the key for rate limiting
      let key = req.ip;
      
      // Use user ID if authenticated
      if (req.user && req.user.id) {
        key = `user_${req.user.id}`;
      }
      
      // Add additional context for certain endpoints
      if (type === 'analysis' || type === 'batch_analysis') {
        key = `${key}_${type}`;
      }

      const resRateLimiter = await rateLimiter.consume(key || req.ip || 'unknown');
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': rateLimiter.points,
        'X-RateLimit-Remaining': resRateLimiter.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + resRateLimiter.msBeforeNext),
      });

      next();
    } catch (rejRes: any) {
      // Rate limit exceeded
      const rateLimitReject = rejRes as RateLimitReject;
      const secs = Math.round(rateLimitReject.msBeforeNext / 1000) || 1;
      
      res.set({
        'X-RateLimit-Limit': rateLimiters[type]?.points || 0,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': new Date(Date.now() + rateLimitReject.msBeforeNext),
        'Retry-After': secs,
      });

      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${secs} seconds.`,
        retryAfter: secs,
        type: type
      });
    }
  };
};

// Specific rate limiting middlewares
export const apiRateLimit = rateLimitMiddleware('api');
export const authRateLimit = rateLimitMiddleware('auth');
export const analysisRateLimit = rateLimitMiddleware('analysis');
export const batchAnalysisRateLimit = rateLimitMiddleware('batch_analysis');
export const trialRateLimit = rateLimitMiddleware('trial');
export const securityScanRateLimit = rateLimitMiddleware('security_scan');
export const emailRateLimit = rateLimitMiddleware('email');
export const passwordResetRateLimit = rateLimitMiddleware('password_reset');
export const registrationRateLimit = rateLimitMiddleware('registration');

// Custom rate limiter for specific use cases
export const createCustomRateLimit = (points: number, duration: number, blockDuration: number | null = null) => {
  const config = {
    points,
    duration,
    blockDuration: blockDuration || duration,
    execEvenly: true,
  };

  let rateLimiter;
  if (redisClient) {
    rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_custom_',
      ...config,
    });
  } else {
    rateLimiter = new RateLimiterMemory({
      keyPrefix: 'rl_custom_',
      ...config,
    });
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let key = req.ip;
      if (req.user && req.user.id) {
        key = `user_${req.user.id}`;
      }

      const resRateLimiter = await rateLimiter.consume(key || 'unknown');
      
      res.set({
        'X-RateLimit-Limit': points,
        'X-RateLimit-Remaining': resRateLimiter.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + resRateLimiter.msBeforeNext),
      });

      next();
    } catch (rejRes: any) {
      const rateLimitReject = rejRes as RateLimitReject;
      const secs = Math.round(rateLimitReject.msBeforeNext / 1000) || 1;
      
      res.set({
        'X-RateLimit-Limit': points,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': new Date(Date.now() + rateLimitReject.msBeforeNext),
        'Retry-After': secs,
      });

      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${secs} seconds.`,
        retryAfter: secs
      });
    }
  };
};

// Progressive rate limiting based on user tier
export const progressiveRateLimit = (type = 'api') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let multiplier = 1;
      
      // Adjust rate limits based on user subscription/trial status
      if ((req as any).subscription) {
        switch ((req as any).subscription.planName) {
          case 'Basic':
            multiplier = 1;
            break;
          case 'Pro':
            multiplier = 2;
            break;
          case 'Enterprise':
            multiplier = 5;
            break;
          default:
            multiplier = 1;
        }
      } else if ((req as any).trial && (req as any).trial.isActive) {
        multiplier = 0.5; // Reduced limits for trial users
      }

      const config = rateLimiterConfigs[type];
      if (!config) {
        return next();
      }

      const adjustedPoints = Math.floor(config.points * multiplier);
      const customRateLimit = createCustomRateLimit(
        adjustedPoints,
        config.duration,
        config.blockDuration
      );

      return customRateLimit(req, res, next);
    } catch (error) {
      console.error('Progressive rate limit error:', error);
      return next();
    }
  };
};

// Rate limit bypass for specific conditions
export const conditionalRateLimit = (type: string, condition: (req: Request) => Promise<boolean>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shouldBypass = await condition(req);
      
      if (shouldBypass) {
        return next();
      }
      
      return rateLimitMiddleware(type)(req, res, next);
    } catch (error) {
      console.error('Conditional rate limit error:', error);
      return rateLimitMiddleware(type)(req, res, next);
    }
  };
};

// Clean up expired rate limit records (for memory-based limiters)
if (!redisClient) {
  setInterval(() => {
    // Memory-based rate limiters automatically clean up,
    // but we can trigger manual cleanup if needed
    console.log('Rate limiter cleanup check...');
  }, 60000); // Check every minute
}

export default {
  rateLimitMiddleware,
  apiRateLimit,
  authRateLimit,
  analysisRateLimit,
  batchAnalysisRateLimit,
  trialRateLimit,
  securityScanRateLimit,
  emailRateLimit,
  passwordResetRateLimit,
  registrationRateLimit,
  createCustomRateLimit,
  progressiveRateLimit,
  conditionalRateLimit
};
