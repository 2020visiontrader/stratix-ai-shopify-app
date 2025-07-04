import { NextFunction, Request, Response } from 'express';
import isVerified from 'shopify-jwt-auth-verify';
import { config } from '../../config';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

declare global {
  namespace Express {
    interface Request {
      shop?: string;
      accessToken?: string;
    }
  }
}

export const shopifyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    const shop = req.headers['x-shopify-shop-domain'] as string;

    if (!shop) {
      throw AppError.unauthorized('Missing shop domain');
    }

    // Verify the token with Shopify
    const isValid = isVerified(authHeader, config.SHOPIFY_API_SECRET, config.SHOPIFY_API_KEY);

    if (!isValid) {
      throw AppError.unauthorized('Invalid access token');
    }

    // Attach shop and token to request
    req.shop = shop;
    req.accessToken = token;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Authentication error:', error);
      next(AppError.unauthorized('Authentication failed'));
    }
  }
}; 