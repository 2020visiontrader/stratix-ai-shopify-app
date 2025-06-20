import { Router } from 'express';

const router = Router();

// Mock channels
const channels = [
  { id: 'twitter', name: 'Twitter', type: 'social' },
  { id: 'facebook', name: 'Facebook', type: 'social' },
  { id: 'linkedin', name: 'LinkedIn', type: 'social' },
  { id: 'email', name: 'Email', type: 'email' },
];

// Mock distribution history
const history = [
  {
    id: 'd1',
    content: 'Announcing our new AI-powered feature!',
    channel: 'twitter',
    status: 'published',
    scheduledAt: '2024-06-01T10:00:00Z',
    publishedAt: '2024-06-01T10:01:00Z',
    metrics: { impressions: 1200, clicks: 45, engagement: 80 },
  },
  {
    id: 'd2',
    content: 'Join our summer sale!',
    channel: 'email',
    status: 'scheduled',
    scheduledAt: '2024-06-10T09:00:00Z',
    publishedAt: null,
    metrics: { impressions: 0, clicks: 0, engagement: 0 },
  },
  {
    id: 'd3',
    content: 'Check out our latest blog post.',
    channel: 'linkedin',
    status: 'published',
    scheduledAt: '2024-05-28T14:00:00Z',
    publishedAt: '2024-05-28T14:05:00Z',
    metrics: { impressions: 800, clicks: 30, engagement: 50 },
  },
];

// GET /api/distribution/channels
router.get('/channels', async (req, res) => {
  res.json({ success: true, data: channels });
});

// POST /api/distribution/send
router.post('/send', async (req, res) => {
  // Accepts: { content, channel, scheduleAt }
  res.json({ success: true, message: 'Content scheduled/sent successfully.' });
});

// GET /api/distribution/history
router.get('/history', async (req, res) => {
  res.json({ success: true, data: history });
});

export default router; 