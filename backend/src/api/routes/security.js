import axios from 'axios';
import express from 'express';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../../services/DatabaseService.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

const router = express.Router();
const dbService = new DatabaseService();

// Security check definitions
const SECURITY_CHECKS = [
  {
    id: 'ssl_certificate',
    name: 'SSL Certificate Validation',
    description: 'Verify SSL certificate is valid and properly configured',
    severity: 'high',
    checkFunction: async (shopDomain) => {
      try {
        const response = await axios.get(`https://${shopDomain}`, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        const isHttps = response.request.protocol === 'https:';
        const hasValidCert = response.status !== 526 && response.status !== 525;
        
        return {
          status: isHttps && hasValidCert ? 'pass' : 'fail',
          details: {
            protocol: response.request.protocol,
            statusCode: response.status,
            secure: isHttps && hasValidCert
          }
        };
      } catch (error) {
        return {
          status: 'fail',
          details: { error: error.message }
        };
      }
    }
  },
  {
    id: 'webhook_verification',
    name: 'Webhook HMAC Verification',
    description: 'Ensure webhooks are properly secured with HMAC verification',
    severity: 'critical',
    checkFunction: async (shopDomain, userId) => {
      try {
        // Check if webhook verification is enabled in settings
        const settings = await dbService.getUserSettings(userId);
        const hasWebhookSecurity = settings?.webhookSecurity || false;
        
        return {
          status: hasWebhookSecurity ? 'pass' : 'warning',
          details: {
            webhookSecurityEnabled: hasWebhookSecurity,
            recommendation: !hasWebhookSecurity ? 'Enable HMAC verification for all webhooks' : null
          }
        };
      } catch (error) {
        return {
          status: 'fail',
          details: { error: error.message }
        };
      }
    }
  },
  {
    id: 'api_rate_limiting',
    name: 'API Rate Limiting',
    description: 'Check if proper rate limiting is implemented',
    severity: 'medium',
    checkFunction: async (shopDomain, userId) => {
      try {
        // Check rate limiting configuration
        const rateLimitConfig = process.env.RATE_LIMIT_ENABLED === 'true';
        
        return {
          status: rateLimitConfig ? 'pass' : 'warning',
          details: {
            rateLimitingEnabled: rateLimitConfig,
            recommendation: !rateLimitConfig ? 'Enable rate limiting to prevent API abuse' : null
          }
        };
      } catch (error) {
        return {
          status: 'fail',
          details: { error: error.message }
        };
      }
    }
  },
  {
    id: 'data_encryption',
    name: 'Data Encryption at Rest',
    description: 'Verify sensitive data is properly encrypted',
    severity: 'high',
    checkFunction: async (shopDomain, userId) => {
      try {
        // Check encryption settings
        const encryptionEnabled = process.env.DATA_ENCRYPTION_ENABLED === 'true';
        
        return {
          status: encryptionEnabled ? 'pass' : 'fail',
          details: {
            encryptionEnabled,
            recommendation: !encryptionEnabled ? 'Enable encryption for sensitive customer data' : null
          }
        };
      } catch (error) {
        return {
          status: 'fail',
          details: { error: error.message }
        };
      }
    }
  },
  {
    id: 'session_security',
    name: 'Session Security',
    description: 'Check session management and security settings',
    severity: 'medium',
    checkFunction: async (shopDomain, userId) => {
      try {
        const sessionSecure = process.env.SESSION_SECURE === 'true';
        const sessionSecret = process.env.SESSION_SECRET;
        
        const hasSecureSettings = sessionSecure && sessionSecret && sessionSecret.length >= 32;
        
        return {
          status: hasSecureSettings ? 'pass' : 'warning',
          details: {
            sessionSecure,
            hasSessionSecret: !!sessionSecret,
            secretLength: sessionSecret?.length || 0,
            recommendation: !hasSecureSettings ? 'Configure secure session settings with strong secret' : null
          }
        };
      } catch (error) {
        return {
          status: 'fail',
          details: { error: error.message }
        };
      }
    }
  },
  {
    id: 'cors_configuration',
    name: 'CORS Configuration',
    description: 'Verify Cross-Origin Resource Sharing is properly configured',
    severity: 'medium',
    checkFunction: async (shopDomain, userId) => {
      try {
        const corsOrigin = process.env.CORS_ORIGIN;
        const hasRestrictiveCors = corsOrigin && corsOrigin !== '*';
        
        return {
          status: hasRestrictiveCors ? 'pass' : 'warning',
          details: {
            corsOrigin,
            isRestrictive: hasRestrictiveCors,
            recommendation: !hasRestrictiveCors ? 'Configure CORS to restrict origins to trusted domains only' : null
          }
        };
      } catch (error) {
        return {
          status: 'fail',
          details: { error: error.message }
        };
      }
    }
  }
];

// Get current security status
router.get('/status',
  authMiddleware,
  async (req, res) => {
    try {
      const { userId, shopId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // Get latest security scan
      const latestScan = await dbService.getLatestSecurityScan(userId);

      if (!latestScan) {
        // No scan exists, run initial scan
        return res.json({
          success: true,
          data: {
            checks: [],
            overview: {
              overallScore: 0,
              totalChecks: 0,
              passedChecks: 0,
              warnings: 0,
              failures: 0,
              lastUpdated: null
            },
            message: 'No security scan found. Please run a security scan.'
          }
        });
      }

      res.json({
        success: true,
        data: {
          checks: latestScan.checkResults || [],
          overview: {
            overallScore: latestScan.overallScore || 0,
            totalChecks: latestScan.totalChecks || 0,
            passedChecks: latestScan.passedChecks || 0,
            warnings: latestScan.warnings || 0,
            failures: latestScan.failures || 0,
            lastUpdated: latestScan.completedAt
          }
        }
      });

    } catch (error) {
      console.error('Get security status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security status',
        message: error.message
      });
    }
  }
);

// Run security scan
router.post('/scan',
  authMiddleware,
  rateLimitMiddleware('security_scan', 2, 3600), // 2 scans per hour
  [
    body('userId').isString().withMessage('User ID is required'),
    body('shopDomain').optional().isString().withMessage('Shop domain must be a string'),
    body('scanType').optional().isIn(['full', 'quick', 'targeted']).withMessage('Invalid scan type')
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

      const { userId, shopDomain, scanType = 'full' } = req.body;

      // Create scan record
      const scanId = await dbService.createSecurityScan({
        userId,
        scanType,
        status: 'running',
        startedAt: new Date()
      });

      // Run security checks
      const checkResults = [];
      let checksToRun = SECURITY_CHECKS;

      if (scanType === 'quick') {
        checksToRun = SECURITY_CHECKS.filter(check => 
          ['ssl_certificate', 'webhook_verification'].includes(check.id)
        );
      }

      for (const check of checksToRun) {
        try {
          const result = await check.checkFunction(shopDomain, userId);
          
          checkResults.push({
            id: check.id,
            name: check.name,
            description: check.description,
            severity: check.severity,
            status: result.status,
            lastChecked: new Date(),
            details: result.details,
            recommendation: result.details?.recommendation
          });
        } catch (error) {
          checkResults.push({
            id: check.id,
            name: check.name,
            description: check.description,
            severity: check.severity,
            status: 'fail',
            lastChecked: new Date(),
            details: { error: error.message },
            recommendation: 'Unable to perform check - please verify configuration'
          });
        }
      }

      // Calculate overall score
      const totalChecks = checkResults.length;
      const passedChecks = checkResults.filter(check => check.status === 'pass').length;
      const warnings = checkResults.filter(check => check.status === 'warning').length;
      const failures = checkResults.filter(check => check.status === 'fail').length;
      const overallScore = Math.round((passedChecks / totalChecks) * 100);

      // Update scan record
      await dbService.updateSecurityScan(scanId, {
        status: 'completed',
        completedAt: new Date(),
        overallScore,
        totalChecks,
        passedChecks,
        warnings,
        failures,
        checkResults,
        recommendations: checkResults
          .filter(check => check.recommendation)
          .map(check => ({
            checkId: check.id,
            severity: check.severity,
            recommendation: check.recommendation
          }))
      });

      // Track usage
      await dbService.trackUsage(userId, 'security_scan', {
        scanType,
        checksRun: totalChecks,
        overallScore
      });

      res.json({
        success: true,
        data: {
          scanId,
          checks: checkResults,
          overview: {
            overallScore,
            totalChecks,
            passedChecks,
            warnings,
            failures,
            lastUpdated: new Date()
          }
        }
      });

    } catch (error) {
      console.error('Security scan error:', error);
      res.status(500).json({
        success: false,
        error: 'Security scan failed',
        message: error.message
      });
    }
  }
);

// Refresh security status (run new scan)
router.post('/refresh',
  authMiddleware,
  rateLimitMiddleware('security_refresh', 3, 3600), // 3 refreshes per hour
  [
    body('userId').isString().withMessage('User ID is required'),
    body('shopId').optional().isString().withMessage('Shop ID must be a string')
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

      // Trigger a new scan
      req.body.scanType = 'quick'; // Use quick scan for refresh
      
      // Forward to scan endpoint
      return router.handle({
        ...req,
        url: '/scan',
        method: 'POST'
      }, res);

    } catch (error) {
      console.error('Security refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Security refresh failed',
        message: error.message
      });
    }
  }
);

// Get security scan history
router.get('/history/:userId',
  authMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const scans = await dbService.getSecurityScanHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: scans
      });

    } catch (error) {
      console.error('Get security history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security scan history',
        message: error.message
      });
    }
  }
);

// Get specific security scan
router.get('/scan/:scanId',
  authMiddleware,
  async (req, res) => {
    try {
      const { scanId } = req.params;

      const scan = await dbService.getSecurityScan(scanId);

      if (!scan) {
        return res.status(404).json({
          success: false,
          error: 'Security scan not found'
        });
      }

      res.json({
        success: true,
        data: scan
      });

    } catch (error) {
      console.error('Get security scan error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security scan',
        message: error.message
      });
    }
  }
);

// Get security recommendations
router.get('/recommendations/:userId',
  authMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const latestScan = await dbService.getLatestSecurityScan(userId);

      if (!latestScan || !latestScan.recommendations) {
        return res.json({
          success: true,
          data: {
            recommendations: [],
            message: 'No recommendations available. Run a security scan first.'
          }
        });
      }

      // Prioritize recommendations by severity
      const prioritizedRecommendations = latestScan.recommendations.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      res.json({
        success: true,
        data: {
          recommendations: prioritizedRecommendations,
          totalRecommendations: prioritizedRecommendations.length,
          criticalIssues: prioritizedRecommendations.filter(r => r.severity === 'critical').length,
          lastScanDate: latestScan.completedAt
        }
      });

    } catch (error) {
      console.error('Get security recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security recommendations',
        message: error.message
      });
    }
  }
);

export default router;
