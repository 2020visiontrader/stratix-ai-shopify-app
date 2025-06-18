import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../utils/errors';

// Validation schemas
const schemas = {
  // Shop schemas
  getShop: z.object({
    params: z.object({}),
    query: z.object({}),
    body: z.object({})
  }),

  // Product schemas
  getProducts: z.object({
    params: z.object({}),
    query: z.object({
      page: z.string().optional().transform(Number),
      limit: z.string().optional().transform(Number),
      sort: z.enum(['created_at', 'updated_at', 'title']).optional(),
      order: z.enum(['asc', 'desc']).optional()
    }),
    body: z.object({})
  }),

  getProduct: z.object({
    params: z.object({
      id: z.string().uuid()
    }),
    query: z.object({}),
    body: z.object({})
  }),

  // Revision schemas
  getRevisions: z.object({
    params: z.object({
      productId: z.string().uuid()
    }),
    query: z.object({
      page: z.string().optional().transform(Number),
      limit: z.string().optional().transform(Number)
    }),
    body: z.object({})
  }),

  createRevision: z.object({
    params: z.object({
      productId: z.string().uuid()
    }),
    query: z.object({}),
    body: z.object({
      content: z.string().min(1),
      type: z.enum(['title', 'description', 'meta_description']),
      model: z.string().optional()
    })
  }),

  // Metrics schemas
  getMetrics: z.object({
    params: z.object({
      productId: z.string().uuid()
    }),
    query: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional()
    }),
    body: z.object({})
  })
};

type SchemaKey = keyof typeof schemas;

export const validateRequest = (schemaKey: SchemaKey) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = schemas[schemaKey];
      const validated = await schema.parseAsync({
        params: req.params,
        query: req.query,
        body: req.body
      });

      // Replace request data with validated data
      req.params = validated.params;
      req.query = validated.query;
      req.body = validated.body;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(AppError.badRequest('Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
}; 