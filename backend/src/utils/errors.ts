export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: any): AppError {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string, details?: any): AppError {
    return new AppError(401, 'UNAUTHORIZED', message, details);
  }

  static forbidden(message: string, details?: any): AppError {
    return new AppError(403, 'FORBIDDEN', message, details);
  }

  static notFound(message: string, details?: any): AppError {
    return new AppError(404, 'NOT_FOUND', message, details);
  }

  static conflict(message: string, details?: any): AppError {
    return new AppError(409, 'CONFLICT', message, details);
  }

  static tooManyRequests(message: string, details?: any): AppError {
    return new AppError(429, 'TOO_MANY_REQUESTS', message, details);
  }

  static internal(message: string, details?: any): AppError {
    return new AppError(500, 'INTERNAL_SERVER_ERROR', message, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(500, 'DATABASE_ERROR', message, originalError);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(400, 'VALIDATION_ERROR', message, originalError);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, 'AUTHENTICATION_FAILED', message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(403, 'AUTHORIZATION_ERROR', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, 'RESOURCE_NOT_FOUND', message);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
  }
}

export class ShopifyAPIError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(500, 'SHOPIFY_API_ERROR', message, originalError);
  }
}

export class AIError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(500, 'AI_ERROR', message, originalError);
  }
}

// Error handler middleware
export const errorHandler = (error: Error) => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      isOperational: true,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        originalError: error.details
      })
    };
  }

  // Handle unknown errors
  return {
    statusCode: 500,
    message: 'Internal server error',
    isOperational: false,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  };
}; 