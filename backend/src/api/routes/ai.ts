import { Router } from 'express';
import { z } from 'zod';
import { AIService } from '../../services/ai';
import { validate } from '../../utils/validate';

const router = Router();
const aiService = new AIService();

// Generate content
const generateContentSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional()
});

router.post('/generate', validate(generateContentSchema), async (req, res, next) => {
  try {
    const { prompt, model, maxTokens, temperature } = req.body;
    const result = await aiService.generateContent(prompt, {
      model,
      maxTokens,
      temperature
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Analyze text
const analyzeTextSchema = z.object({
  text: z.string().min(1),
  analysisType: z.enum(['sentiment', 'keywords', 'summary']),
  options: z.record(z.any()).optional()
});

router.post('/analyze', validate(analyzeTextSchema), async (req, res, next) => {
  try {
    const { text, analysisType, options } = req.body;
    const result = await aiService.analyzeText(text, analysisType, options);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get available models
router.get('/models', async (req, res, next) => {
  try {
    const models = await aiService.getAvailableModels();
    res.json(models);
  } catch (error) {
    next(error);
  }
});

// Get usage statistics
router.get('/usage', async (req, res, next) => {
  try {
    const stats = await aiService.getUsageStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router; 