import rateLimit from 'express-rate-limit';
import { config } from '../../config';
import { AppError } from '../../utils/errors';

export const rateLimiter = rateLimit({
  windowMs: config.get('RATE_LIMIT_WINDOW_MS'),
  max: config.get('RATE_LIMIT_MAX'),
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later.'
  },
  handler: (req, res) => {
    throw AppError.tooManyRequests('Rate limit exceeded');
  },
  standardHeaders: true,
  legacyHeaders: false
}); 