import express from 'express';
import { parsePromptAndPatch } from '../../modules/prompt_parser/promptParser';
import { insertSection, listAvailableSections } from '../../modules/section_library/sectionLibrary';
import { BrandConfig, initializeTheme } from '../../modules/theme_builder/themeBuilder';

const router = express.Router();

// POST /api/theme/init
router.post('/init', async (req, res) => {
  const { shop, brandConfig } = req.body as { shop: string; brandConfig: BrandConfig };
  try {
    const result = await initializeTheme(shop, brandConfig);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/theme/updateSection
router.post('/updateSection', async (req, res) => {
  const { pageTemplatePath, sectionName, settings } = req.body;
  try {
    await insertSection(pageTemplatePath, sectionName, settings);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/prompt/patch
router.post('/prompt/patch', async (req, res) => {
  const { themeFiles, userPrompt } = req.body;
  try {
    const patch = await parsePromptAndPatch(themeFiles, userPrompt);
    res.json(patch);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /api/theme/sections
router.get('/sections', async (_req, res) => {
  try {
    const sections = await listAvailableSections();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router; 