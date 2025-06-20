import { Router } from 'express';

const router = Router();

// Mock segment definitions
const segments = [
  {
    id: 'rfm_high',
    name: 'High RFM',
    description: 'Customers with high Recency, Frequency, and Monetary value',
    count: 42,
    ltv: 1200,
    churnRisk: 0.05,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'churn_risk',
    name: 'Churn Risk',
    description: 'Customers at risk of churning',
    count: 18,
    ltv: 350,
    churnRisk: 0.45,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'new_customers',
    name: 'New Customers',
    description: 'Recently acquired customers',
    count: 60,
    ltv: 200,
    churnRisk: 0.10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Top 5% by spend',
    count: 7,
    ltv: 3000,
    churnRisk: 0.01,
    createdAt: new Date().toISOString(),
  },
];

// GET /api/segments - List all segments
router.get('/', async (req, res) => {
  res.json({ success: true, data: segments });
});

// GET /api/segments/:id - List customers in a segment (mock)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  // Mock customers for the segment
  const customers = Array.from({ length: 10 }, (_, i) => ({
    id: `${id}-cust${i + 1}`,
    name: `Customer ${i + 1}`,
    email: `customer${i + 1}@example.com`,
    totalOrders: Math.floor(Math.random() * 10) + 1,
    totalSpent: Math.floor(Math.random() * 2000) + 100,
    lastOrderDate: new Date(Date.now() - Math.random() * 1e10).toISOString(),
    tags: [id],
  }));
  res.json({ success: true, data: customers });
});

export default router;
