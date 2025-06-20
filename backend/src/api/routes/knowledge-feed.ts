import { createClient } from '@supabase/supabase-js';
import { Router } from 'express';
import { ingestBooksToFeed } from '../../modules/learning/feedManager';

const router = Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

// POST /api/knowledge-feed/ingest
router.post('/ingest', async (req, res) => {
  try {
    const items = await ingestBooksToFeed();
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/knowledge-feed/items
router.get('/items', async (req, res) => {
  try {
    const { data, error } = await supabase.from('knowledge_feed').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 