import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { OpenAIConfig, SupabaseConfig } from '../types';

// Load environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../.env.development')
});

// Configuration schema
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SHOPIFY_API_KEY: z.string(),
  SHOPIFY_API_SECRET: z.string(),
  SHOPIFY_APP_URL: z.string().url(),
  CORS_ORIGIN: z.string().url(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  AI_API_KEY: z.string(),
  AI_MODEL: z.string().default('gpt-4'),
  CACHE_TTL: z.string().transform(Number).default('3600'), // 1 hour
});

// Parse and validate configuration
const parseConfig = () => {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
};

// Create configuration object
const config = parseConfig();

// Export configuration getter
export const getConfig = () => config;

// Export configuration getter with type safety
export const get = <K extends keyof typeof config>(key: K): typeof config[K] => {
  const value = config[key];
  if (value === undefined) {
    throw new Error(`Configuration key "${key}" is not defined`);
  }
  return value;
};

export const openAIConfig: OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4',
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
  topP: parseFloat(process.env.OPENAI_TOP_P || '1'),
  frequencyPenalty: parseFloat(process.env.OPENAI_FREQUENCY_PENALTY || '0'),
  presencePenalty: parseFloat(process.env.OPENAI_PRESENCE_PENALTY || '0'),
};

export const databaseConfig: SupabaseConfig = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_ANON_KEY || '',
  schema: process.env.SUPABASE_SCHEMA || 'public',
};

// Validate required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

export const serverConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
}; 