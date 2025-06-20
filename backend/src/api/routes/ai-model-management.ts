import { Router } from 'express';

const router = Router();

// Mock models
const models = [
  { id: 'gpt-4', name: 'GPT-4', version: '4.0', status: 'active', createdAt: '2024-01-01', updatedAt: '2024-06-01' },
  { id: 'gpt-3.5', name: 'GPT-3.5', version: '3.5', status: 'inactive', createdAt: '2023-06-01', updatedAt: '2024-01-01' },
  { id: 'llama-2', name: 'Llama-2', version: '2.0', status: 'active', createdAt: '2024-03-01', updatedAt: '2024-06-01' },
];

// Mock usage logs
const usage = [
  { id: 'u1', modelId: 'gpt-4', tokensUsed: 120000, cost: 24.5, createdAt: '2024-06-01' },
  { id: 'u2', modelId: 'gpt-3.5', tokensUsed: 80000, cost: 8.0, createdAt: '2024-05-15' },
  { id: 'u3', modelId: 'llama-2', tokensUsed: 50000, cost: 5.5, createdAt: '2024-06-01' },
];

// Mock comparison
const comparison = {
  models: [
    { modelId: 'gpt-4', modelName: 'GPT-4', metrics: { accuracy: 0.92, cost: 24.5, responseTime: 1800 }, rank: 1 },
    { modelId: 'llama-2', modelName: 'Llama-2', metrics: { accuracy: 0.89, cost: 5.5, responseTime: 1500 }, rank: 2 },
    { modelId: 'gpt-3.5', modelName: 'GPT-3.5', metrics: { accuracy: 0.85, cost: 8.0, responseTime: 1200 }, rank: 3 },
  ],
  bestPerforming: 'gpt-4',
  recommendations: [
    'GPT-4 is the most accurate but also the most expensive.',
    'Llama-2 offers a good balance of cost and performance.',
    'Consider using GPT-3.5 for lower-cost, less critical tasks.'
  ]
};

// GET /api/ai/models
router.get('/models', async (req, res) => {
  res.json({ success: true, data: models });
});

// GET /api/ai/usage
router.get('/usage', async (req, res) => {
  res.json({ success: true, data: usage });
});

// GET /api/ai/compare
router.get('/compare', async (req, res) => {
  res.json({ success: true, data: comparison });
});

export default router; 