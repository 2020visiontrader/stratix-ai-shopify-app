import { Router } from 'express';
import { ingestBrandDocument, searchBrandDocuments } from '../../modules/brand/brandDNA';

const router = Router();

// POST /api/brand-dna/ingest
router.post('/ingest', async (req, res) => {
  try {
    const { brandId, content } = req.body;
    if (!brandId || !content) return res.status(400).json({ error: 'brandId and content are required' });
    const doc = await ingestBrandDocument(brandId, content);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/brand-dna/query
router.post('/query', async (req, res) => {
  try {
    const { brandId, query, topK } = req.body;
    if (!brandId || !query) return res.status(400).json({ error: 'brandId and query are required' });
    const results = await searchBrandDocuments(brandId, query, topK);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
