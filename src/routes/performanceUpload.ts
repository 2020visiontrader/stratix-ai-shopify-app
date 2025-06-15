import csv from 'csv-parse';
import { Router } from 'express';
import multer from 'multer';
import { InsightsEngine } from '../core/InsightsEngine';
import { db } from '../lib/supabase';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface PerformanceMetrics {
  campaign_name: string;
  ad_id: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions: number;
  conversion_rate: number;
  roas: number;
  cpm: number;
}

router.post('/upload/performance', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const brandId = req.headers['x-brand-id'] as string;
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }

    // Parse CSV
    const records: PerformanceMetrics[] = [];
    const parser = csv.parse({
      columns: true,
      skip_empty_lines: true
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read())) {
        records.push({
          campaign_name: record.campaign_name,
          ad_id: record.ad_id,
          impressions: Number(record.impressions),
          clicks: Number(record.clicks),
          ctr: Number(record.ctr),
          cpc: Number(record.cpc),
          spend: Number(record.spend),
          conversions: Number(record.conversions),
          conversion_rate: Number(record.conversion_rate),
          roas: Number(record.roas),
          cpm: Number(record.cpm)
        });
      }
    });

    // Process results
    parser.on('end', async () => {
      try {
        // Store raw data
        const { data: upload } = await db.performance_uploads.create({
          brand_id: brandId,
          raw_data: records,
          metrics_summary: calculateMetricsSummary(records),
          upload_date: new Date()
        });

        if (!upload?.id) {
          throw new Error('Failed to store upload data');
        }

        // Extract insights
        const insights = await analyzePerformance(records);
        
        // Store insights
        await db.performance_insights.create({
          brand_id: brandId,
          upload_id: upload.id,
          top_performers: insights.topPerformers,
          weak_performers: insights.weakPerformers,
          recommendations: insights.recommendations,
          created_at: new Date()
        });

        // Update brand DNA with learnings
        await InsightsEngine.getInstance().processPerformanceData(brandId, insights);

        res.json({
          success: true,
          upload_id: upload.id,
          summary: insights
        });
      } catch (error) {
        console.error('Error processing performance data:', error);
        res.status(500).json({ error: 'Error processing performance data' });
      }
    });

    // Handle parsing errors
    parser.on('error', (error) => {
      console.error('Error parsing CSV:', error);
      res.status(400).json({ error: 'Invalid CSV format' });
    });

    // Start parsing
    parser.write(req.file.buffer);
    parser.end();

  } catch (error) {
    console.error('Error handling performance upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateMetricsSummary(records: PerformanceMetrics[]) {
  return {
    total_impressions: records.reduce((sum, r) => sum + r.impressions, 0),
    total_clicks: records.reduce((sum, r) => sum + r.clicks, 0),
    total_spend: records.reduce((sum, r) => sum + r.spend, 0),
    total_conversions: records.reduce((sum, r) => sum + r.conversions, 0),
    average_ctr: records.reduce((sum, r) => sum + r.ctr, 0) / records.length,
    average_cpc: records.reduce((sum, r) => sum + r.cpc, 0) / records.length,
    average_roas: records.reduce((sum, r) => sum + r.roas, 0) / records.length,
    average_cpm: records.reduce((sum, r) => sum + r.cpm, 0) / records.length
  };
}

async function analyzePerformance(records: PerformanceMetrics[]) {
  // Sort by key metrics
  const sortedByROAS = [...records].sort((a, b) => b.roas - a.roas);
  const sortedByCTR = [...records].sort((a, b) => b.ctr - a.ctr);
  const sortedByConvRate = [...records].sort((a, b) => b.conversion_rate - a.conversion_rate);

  const topPerformers = {
    by_roas: sortedByROAS.slice(0, 5),
    by_ctr: sortedByCTR.slice(0, 5),
    by_conversion: sortedByConvRate.slice(0, 5)
  };

  const weakPerformers = {
    by_roas: sortedByROAS.slice(-5).reverse(),
    by_ctr: sortedByCTR.slice(-5).reverse(),
    by_conversion: sortedByConvRate.slice(-5).reverse()
  };

  // Generate recommendations
  const recommendations = [];

  // Check CTR trends
  const avgCTR = records.reduce((sum, r) => sum + r.ctr, 0) / records.length;
  if (avgCTR < 1.5) {
    recommendations.push({
      type: 'ctr_improvement',
      message: 'CTR below target. Consider refreshing ad creative and copy.',
      metric: 'ctr',
      current: avgCTR,
      target: 1.5
    });
  }

  // Check ROAS efficiency
  const avgROAS = records.reduce((sum, r) => sum + r.roas, 0) / records.length;
  if (avgROAS < 2) {
    recommendations.push({
      type: 'roas_improvement',
      message: 'ROAS below target. Review targeting and bidding strategy.',
      metric: 'roas',
      current: avgROAS,
      target: 2
    });
  }

  return {
    topPerformers,
    weakPerformers,
    recommendations,
    timestamp: new Date()
  };
}

export default router; 