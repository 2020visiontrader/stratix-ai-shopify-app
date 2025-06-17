import express from 'express';
import { body, validationResult } from 'express-validator';
import { FrameworkExtractor } from '../../core/FrameworkExtractor.js';
import { ToneInferrer } from '../../core/ToneInferrer.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

const router = express.Router();
const frameworkExtractor = new FrameworkExtractor();
const toneInferrer = new ToneInferrer(process.env.OPENAI_API_KEY);
const dbService = new DatabaseService();

// Framework extraction endpoint
router.post('/framework',
  authMiddleware,
  rateLimitMiddleware('analysis', 10, 60), // 10 requests per minute
  [
    body('content').isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
    body('userId').isString().withMessage('User ID is required'),
    body('type').optional().isIn(['product', 'marketing', 'email', 'social']).withMessage('Invalid content type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { content, userId, type = 'marketing', metadata = {} } = req.body;

      // Track usage
      await dbService.trackUsage(userId, 'framework_extraction', {
        contentLength: content.length,
        contentType: type,
        ...metadata
      });

      // Perform framework extraction
      const result = await frameworkExtractor.extractFrameworks(content);

      // Store analysis in database
      const analysisId = await dbService.storeAnalysis({
        userId,
        type: 'FRAMEWORK_EXTRACTION',
        inputData: { content, type, metadata },
        results: result,
        confidence: result.analysisMetadata.confidenceScore,
        processingTime: result.analysisMetadata.processingTime
      });

      res.json({
        success: true,
        analysisId,
        data: result,
        usage: {
          contentLength: content.length,
          processingTime: result.analysisMetadata.processingTime
        }
      });

    } catch (error) {
      console.error('Framework extraction error:', error);
      res.status(500).json({
        success: false,
        error: 'Framework extraction failed',
        message: error.message
      });
    }
  }
);

// Tone analysis endpoint
router.post('/tone',
  authMiddleware,
  rateLimitMiddleware('analysis', 10, 60),
  [
    body('content').isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
    body('userId').isString().withMessage('User ID is required'),
    body('brandProfile').optional().isObject().withMessage('Brand profile must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { content, userId, brandProfile, metadata = {} } = req.body;

      // Create content samples array
      const contentSamples = [{
        type: 'marketing_copy',
        content: content,
        source: 'user_input',
        timestamp: new Date()
      }];

      // Track usage
      await dbService.trackUsage(userId, 'tone_analysis', {
        contentLength: content.length,
        hasBrandProfile: !!brandProfile,
        ...metadata
      });

      // Perform tone analysis
      const result = await toneInferrer.analyzeTone(contentSamples);

      // Get recommendations if brand profile provided
      let recommendations = null;
      if (brandProfile) {
        const recommendationResult = await toneInferrer.getToneRecommendationsForContent(
          metadata.contentType || 'product',
          result.primaryTone
        );
        recommendations = recommendationResult;
      }

      // Store analysis in database
      const analysisId = await dbService.storeAnalysis({
        userId,
        type: 'TONE_ANALYSIS',
        inputData: { content, brandProfile, metadata },
        results: { ...result, recommendations },
        confidence: result.confidence,
        processingTime: Date.now() - req.startTime || 0
      });

      res.json({
        success: true,
        analysisId,
        data: {
          ...result,
          recommendations
        },
        usage: {
          contentLength: content.length,
          confidence: result.confidence
        }
      });

    } catch (error) {
      console.error('Tone analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Tone analysis failed',
        message: error.message
      });
    }
  }
);

// Get analysis history
router.get('/history/:userId',
  authMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, type } = req.query;

      const analyses = await dbService.getAnalysisHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        type
      });

      res.json({
        success: true,
        data: analyses
      });

    } catch (error) {
      console.error('Get analysis history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analysis history',
        message: error.message
      });
    }
  }
);

// Get specific analysis
router.get('/:analysisId',
  authMiddleware,
  async (req, res) => {
    try {
      const { analysisId } = req.params;

      const analysis = await dbService.getAnalysis(analysisId);

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Get analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analysis',
        message: error.message
      });
    }
  }
);

// Batch analysis endpoint
router.post('/batch',
  authMiddleware,
  rateLimitMiddleware('batch_analysis', 2, 60), // 2 batch requests per minute
  [
    body('analyses').isArray({ min: 1, max: 10 }).withMessage('Analyses array must contain 1-10 items'),
    body('userId').isString().withMessage('User ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { analyses, userId } = req.body;
      const results = [];

      // Process each analysis
      for (const analysis of analyses) {
        try {
          let result;
          const startTime = Date.now();

          if (analysis.type === 'framework') {
            result = await frameworkExtractor.extractFrameworks(analysis.content);
          } else if (analysis.type === 'tone') {
            const contentSamples = [{
              type: 'marketing_copy',
              content: analysis.content,
              source: 'batch_input',
              timestamp: new Date()
            }];
            result = await toneInferrer.analyzeTone(contentSamples);
          } else {
            throw new Error(`Unknown analysis type: ${analysis.type}`);
          }

          const processingTime = Date.now() - startTime;

          // Store in database
          const analysisId = await dbService.storeAnalysis({
            userId,
            type: analysis.type === 'framework' ? 'FRAMEWORK_EXTRACTION' : 'TONE_ANALYSIS',
            inputData: { content: analysis.content, batchId: req.body.batchId },
            results: result,
            confidence: result.confidence || result.analysisMetadata?.confidenceScore || 0,
            processingTime
          });

          results.push({
            id: analysis.id || results.length,
            analysisId,
            type: analysis.type,
            success: true,
            data: result,
            processingTime
          });

          // Track usage
          await dbService.trackUsage(userId, `batch_${analysis.type}`, {
            contentLength: analysis.content.length,
            processingTime
          });

        } catch (error) {
          results.push({
            id: analysis.id || results.length,
            type: analysis.type,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: analyses.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          }
        }
      });

    } catch (error) {
      console.error('Batch analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Batch analysis failed',
        message: error.message
      });
    }
  }
);

// Analysis statistics endpoint
router.get('/stats/:userId',
  authMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { period = '30d' } = req.query;

      const stats = await dbService.getAnalysisStats(userId, period);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get analysis stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analysis statistics',
        message: error.message
      });
    }
  }
);

// Middleware to track request start time
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

export default router;
