import express from 'express';
import { body, validationResult } from 'express-validator';
import { TrialReminder } from '../../core/TrialReminder.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

const router = express.Router();
const trialReminder = new TrialReminder();
const dbService = new DatabaseService();

// Get trial status
router.get('/status/:userId',
  authMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const trialInfo = await trialReminder.checkTrialStatus(userId);

      if (!trialInfo) {
        return res.status(404).json({
          success: false,
          error: 'Trial not found'
        });
      }

      res.json({
        success: true,
        data: trialInfo
      });

    } catch (error) {
      console.error('Get trial status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve trial status',
        message: error.message
      });
    }
  }
);

// Create new trial
router.post('/create',
  authMiddleware,
  rateLimitMiddleware('trial_create', 1, 3600), // 1 trial creation per hour
  [
    body('userId').isString().withMessage('User ID is required'),
    body('planName').optional().isString().withMessage('Plan name must be a string'),
    body('trialDays').optional().isInt({ min: 1, max: 30 }).withMessage('Trial days must be between 1 and 30')
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

      const { userId, planName = 'Stratix AI Pro', trialDays = 14 } = req.body;

      // Check if user already has an active trial
      const existingTrial = await trialReminder.checkTrialStatus(userId);
      if (existingTrial && existingTrial.isActive) {
        return res.status(400).json({
          success: false,
          error: 'User already has an active trial'
        });
      }

      // Create new trial
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + trialDays);

      const trial = await dbService.createTrial({
        userId,
        planName,
        startDate,
        endDate,
        isActive: true,
        hasPaymentMethod: false,
        featuresUsed: [],
        totalActions: 0,
        engagementScore: 0,
        lastActiveDate: new Date()
      });

      // Track trial creation
      await dbService.trackUsage(userId, 'trial_created', {
        planName,
        trialDays
      });

      res.json({
        success: true,
        data: trial
      });

    } catch (error) {
      console.error('Create trial error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create trial',
        message: error.message
      });
    }
  }
);

// Update trial
router.put('/update/:userId',
  authMiddleware,
  [
    body('hasPaymentMethod').optional().isBoolean().withMessage('hasPaymentMethod must be a boolean'),
    body('paymentMethodId').optional().isString().withMessage('paymentMethodId must be a string'),
    body('featuresUsed').optional().isArray().withMessage('featuresUsed must be an array'),
    body('totalActions').optional().isInt({ min: 0 }).withMessage('totalActions must be a non-negative integer'),
    body('engagementScore').optional().isFloat({ min: 0, max: 1 }).withMessage('engagementScore must be between 0 and 1')
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

      const { userId } = req.params;
      const updateData = req.body;

      // Update last active date
      updateData.lastActiveDate = new Date();

      const updatedTrial = await dbService.updateTrialStatus(userId, updateData);

      if (!updatedTrial) {
        return res.status(404).json({
          success: false,
          error: 'Trial not found'
        });
      }

      res.json({
        success: true,
        data: updatedTrial
      });

    } catch (error) {
      console.error('Update trial error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update trial',
        message: error.message
      });
    }
  }
);

// Extend trial
router.post('/extend/:userId',
  authMiddleware,
  rateLimitMiddleware('trial_extend', 2, 86400), // 2 extensions per day
  [
    body('extensionDays').isInt({ min: 1, max: 14 }).withMessage('Extension days must be between 1 and 14'),
    body('reason').optional().isString().withMessage('Reason must be a string')
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

      const { userId } = req.params;
      const { extensionDays, reason = 'User requested extension' } = req.body;

      const success = await trialReminder.extendTrial(extensionDays);

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to extend trial'
        });
      }

      // Track extension
      await dbService.trackUsage(userId, 'trial_extended', {
        extensionDays,
        reason
      });

      const updatedTrial = await trialReminder.checkTrialStatus(userId);

      res.json({
        success: true,
        data: updatedTrial,
        message: `Trial extended by ${extensionDays} days`
      });

    } catch (error) {
      console.error('Extend trial error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extend trial',
        message: error.message
      });
    }
  }
);

// Get trial usage statistics
router.get('/usage/:userId',
  authMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const usageStats = trialReminder.getTrialUsageStats();
      const trialInfo = await trialReminder.checkTrialStatus(userId);

      if (!trialInfo) {
        return res.status(404).json({
          success: false,
          error: 'Trial not found'
        });
      }

      const detailedStats = await dbService.getTrialUsageStats(userId);

      res.json({
        success: true,
        data: {
          ...usageStats,
          ...detailedStats,
          trialDaysUsed: Math.floor((new Date() - trialInfo.startDate) / (1000 * 60 * 60 * 24)),
          trialDaysRemaining: trialInfo.daysRemaining
        }
      });

    } catch (error) {
      console.error('Get trial usage error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve trial usage statistics',
        message: error.message
      });
    }
  }
);

// Send trial reminder
router.post('/reminder/:userId',
  authMiddleware,
  rateLimitMiddleware('trial_reminder', 3, 3600), // 3 reminders per hour
  [
    body('channels').optional().isArray().withMessage('channels must be an array'),
    body('customMessage').optional().isString().withMessage('customMessage must be a string')
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

      const { userId } = req.params;
      const { channels = ['email', 'in-app'], customMessage } = req.body;

      const trialInfo = await trialReminder.checkTrialStatus(userId);

      if (!trialInfo) {
        return res.status(404).json({
          success: false,
          error: 'Trial not found'
        });
      }

      const settings = await dbService.getUserReminderSettings(userId);
      if (customMessage) {
        settings.customMessage = customMessage;
      }

      const shouldSend = await trialReminder.shouldSendReminder(trialInfo, settings);

      if (!shouldSend) {
        return res.status(400).json({
          success: false,
          error: 'Reminder not due or already sent today'
        });
      }

      const template = await trialReminder.generateReminderContent(trialInfo);
      const result = await trialReminder.sendReminder(trialInfo, template, channels);

      res.json({
        success: result.success,
        data: {
          channelResults: result.channelResults,
          template: {
            title: template.title,
            message: template.message,
            urgencyLevel: template.urgencyLevel
          }
        },
        error: result.error
      });

    } catch (error) {
      console.error('Send trial reminder error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send trial reminder',
        message: error.message
      });
    }
  }
);

// Process all trial reminders (admin endpoint)
router.post('/process-reminders',
  authMiddleware,
  rateLimitMiddleware('process_reminders', 1, 3600), // 1 process per hour
  async (req, res) => {
    try {
      const results = await trialReminder.processTrialReminders();

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Process trial reminders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process trial reminders',
        message: error.message
      });
    }
  }
);

// Get reminder settings
router.get('/settings/:userId',
  authMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const settings = await dbService.getUserReminderSettings(userId);

      res.json({
        success: true,
        data: settings
      });

    } catch (error) {
      console.error('Get reminder settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve reminder settings',
        message: error.message
      });
    }
  }
);

// Update reminder settings
router.put('/settings/:userId',
  authMiddleware,
  [
    body('enableReminders').optional().isBoolean().withMessage('enableReminders must be a boolean'),
    body('reminderDays').optional().isArray().withMessage('reminderDays must be an array'),
    body('reminderChannels').optional().isArray().withMessage('reminderChannels must be an array'),
    body('customMessage').optional().isString().withMessage('customMessage must be a string')
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

      const { userId } = req.params;
      const settings = req.body;

      const updatedSettings = await dbService.updateUserReminderSettings(userId, settings);

      res.json({
        success: true,
        data: updatedSettings
      });

    } catch (error) {
      console.error('Update reminder settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update reminder settings',
        message: error.message
      });
    }
  }
);

export default router;
