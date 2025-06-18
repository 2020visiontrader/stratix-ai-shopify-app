import { supabase } from '../../../db';
import { AIService } from '../index';

jest.mock('../../../db', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    jest.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      const mockResponse = {
        content: 'Generated content',
        tokens: 100
      };

      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: mockResponse, error: null });

      const result = await aiService.generateContent('Test prompt', {
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.7
      });

      expect(result).toEqual(mockResponse);
      expect(supabase.rpc).toHaveBeenCalledWith('generate_content', {
        prompt: 'Test prompt',
        model: 'gpt-4',
        max_tokens: 1000,
        temperature: 0.7
      });
    });

    it('should handle errors', async () => {
      const mockError = new Error('API error');
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: mockError });

      await expect(
        aiService.generateContent('Test prompt')
      ).rejects.toThrow('API error');
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      const mockStats = {
        total_tokens: 1000,
        total_requests: 10,
        average_tokens_per_request: 100
      };

      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: mockStats, error: null });

      const result = await aiService.getUsageStats();

      expect(result).toEqual(mockStats);
      expect(supabase.rpc).toHaveBeenCalledWith('get_ai_usage_stats');
    });

    it('should handle errors', async () => {
      const mockError = new Error('Database error');
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: mockError });

      await expect(aiService.getUsageStats()).rejects.toThrow('Database error');
    });
  });
}); 