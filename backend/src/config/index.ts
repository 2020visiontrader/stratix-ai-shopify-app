import { config } from 'dotenv';
import { OpenAIConfig, SupabaseConfig } from '../types';

// Load environment variables
config();

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