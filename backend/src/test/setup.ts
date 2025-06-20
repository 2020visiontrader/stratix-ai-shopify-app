import { logger } from '../utils/logger';

// Configure test environment
process.env.NODE_ENV = 'test';

// Configure logger for tests
logger.silent = true;

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Add any cleanup code here
}); 