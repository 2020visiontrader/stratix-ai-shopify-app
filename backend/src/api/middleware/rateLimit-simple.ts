import { NextFunction, Request, Response } from 'express';

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

function createRateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up old entries
    if (requestCounts.has(key)) {
      const record = requestCounts.get(key)!;
      if (now > record.resetTime) {
        requestCounts.delete(key);
      }
    }
    
    // Get or create record
    let record = requestCounts.get(key);
    if (!record) {
      record = { count: 0, resetTime: now + config.windowMs };
      requestCounts.set(key, record);
    }
    
    // Check limit
    if (record.count >= config.max) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    // Increment counter
    record.count++;
    
    // Set headers
    res.set({
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': (config.max - record.count).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
    });
    
    next();
  };
}

// Export common rate limiters
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});

export const analysisRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 100 // limit each IP to 100 analysis requests per windowMs
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 auth attempts per windowMs
});

export const createCustomRateLimit = (points: number, duration: number) => {
  return createRateLimit({
    windowMs: duration * 1000,
    max: points
  });
};
