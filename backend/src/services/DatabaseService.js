import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DatabaseService {
  constructor() {
    this.prisma = prisma;
  }

  // User management
  async getUserById(userId) {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          trial: true,
          subscription: true,
          settings: true
        }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
        include: {
          trial: true,
          subscription: true,
          settings: true
        }
      });
    } catch (error) {
      console.error('Get user by email error:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      return await this.prisma.user.create({
        data: userData,
        include: {
          settings: true
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  // Trial management
  async createTrial(trialData) {
    try {
      return await this.prisma.trial.create({
        data: trialData
      });
    } catch (error) {
      console.error('Create trial error:', error);
      throw error;
    }
  }

  async getActiveTrial(userId) {
    try {
      return await this.prisma.trial.findFirst({
        where: {
          userId,
          isActive: true,
          endDate: {
            gte: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Get active trial error:', error);
      throw error;
    }
  }

  async updateTrialStatus(userId, updateData) {
    try {
      return await this.prisma.trial.update({
        where: { userId },
        data: updateData
      });
    } catch (error) {
      console.error('Update trial status error:', error);
      throw error;
    }
  }

  async getTrialUsageStats(userId) {
    try {
      const trial = await this.prisma.trial.findUnique({
        where: { userId }
      });

      if (!trial) return null;

      // Get usage statistics from usage_stats table
      const usageStats = await this.prisma.usageStats.groupBy({
        by: ['feature'],
        where: {
          userId,
          timestamp: {
            gte: trial.startDate
          }
        },
        _count: true
      });

      const totalUsage = await this.prisma.usageStats.count({
        where: {
          userId,
          timestamp: {
            gte: trial.startDate
          }
        }
      });

      return {
        trial,
        usageByFeature: usageStats,
        totalUsage,
        avgDailyUsage: totalUsage / Math.max(1, Math.floor((new Date() - trial.startDate) / (1000 * 60 * 60 * 24)))
      };
    } catch (error) {
      console.error('Get trial usage stats error:', error);
      throw error;
    }
  }

  // Subscription management
  async getActiveSubscription(userId) {
    try {
      return await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          currentPeriodEnd: {
            gte: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Get active subscription error:', error);
      throw error;
    }
  }

  async createSubscription(subscriptionData) {
    try {
      return await this.prisma.subscription.create({
        data: subscriptionData
      });
    } catch (error) {
      console.error('Create subscription error:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId, updateData) {
    try {
      return await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: updateData
      });
    } catch (error) {
      console.error('Update subscription error:', error);
      throw error;
    }
  }

  // Analysis management
  async storeAnalysis(analysisData) {
    try {
      const analysis = await this.prisma.analysis.create({
        data: {
          ...analysisData,
          status: 'COMPLETED'
        }
      });
      return analysis.id;
    } catch (error) {
      console.error('Store analysis error:', error);
      throw error;
    }
  }

  async getAnalysis(analysisId) {
    try {
      return await this.prisma.analysis.findUnique({
        where: { id: analysisId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Get analysis error:', error);
      throw error;
    }
  }

  async getAnalysisHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 20, type } = options;
      const skip = (page - 1) * limit;

      const where = { userId };
      if (type) {
        where.type = type;
      }

      const [analyses, total] = await Promise.all([
        this.prisma.analysis.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            type: true,
            status: true,
            confidence: true,
            processingTime: true,
            createdAt: true,
            inputData: true
          }
        }),
        this.prisma.analysis.count({ where })
      ]);

      return {
        analyses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get analysis history error:', error);
      throw error;
    }
  }

  async getAnalysisStats(userId, period = '30d') {
    try {
      const days = parseInt(period.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analyses = await this.prisma.analysis.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate
          }
        },
        select: {
          type: true,
          confidence: true,
          processingTime: true,
          createdAt: true
        }
      });

      const stats = {
        total: analyses.length,
        byType: {},
        avgConfidence: 0,
        avgProcessingTime: 0,
        dailyStats: {}
      };

      // Group by type
      analyses.forEach(analysis => {
        if (!stats.byType[analysis.type]) {
          stats.byType[analysis.type] = 0;
        }
        stats.byType[analysis.type]++;
      });

      // Calculate averages
      if (analyses.length > 0) {
        stats.avgConfidence = analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length;
        stats.avgProcessingTime = analyses.reduce((sum, a) => sum + (a.processingTime || 0), 0) / analyses.length;
      }

      // Group by day
      analyses.forEach(analysis => {
        const day = analysis.createdAt.toISOString().split('T')[0];
        if (!stats.dailyStats[day]) {
          stats.dailyStats[day] = 0;
        }
        stats.dailyStats[day]++;
      });

      return stats;
    } catch (error) {
      console.error('Get analysis stats error:', error);
      throw error;
    }
  }

  // Usage tracking
  async trackUsage(userId, feature, metadata = {}) {
    try {
      await this.prisma.usageStats.create({
        data: {
          userId,
          feature,
          action: metadata.action || 'use',
          metadata: metadata,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Track usage error:', error);
      // Don't throw error for usage tracking failures
    }
  }

  // Security scans
  async createSecurityScan(scanData) {
    try {
      const scan = await this.prisma.securityScan.create({
        data: scanData
      });
      return scan.id;
    } catch (error) {
      console.error('Create security scan error:', error);
      throw error;
    }
  }

  async updateSecurityScan(scanId, updateData) {
    try {
      return await this.prisma.securityScan.update({
        where: { id: scanId },
        data: updateData
      });
    } catch (error) {
      console.error('Update security scan error:', error);
      throw error;
    }
  }

  async getLatestSecurityScan(userId) {
    try {
      return await this.prisma.securityScan.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Get latest security scan error:', error);
      throw error;
    }
  }

  async getSecurityScan(scanId) {
    try {
      return await this.prisma.securityScan.findUnique({
        where: { id: scanId }
      });
    } catch (error) {
      console.error('Get security scan error:', error);
      throw error;
    }
  }

  async getSecurityScanHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const [scans, total] = await Promise.all([
        this.prisma.securityScan.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            scanType: true,
            status: true,
            overallScore: true,
            totalChecks: true,
            passedChecks: true,
            warnings: true,
            failures: true,
            startedAt: true,
            completedAt: true
          }
        }),
        this.prisma.securityScan.count({ where: { userId } })
      ]);

      return {
        scans,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get security scan history error:', error);
      throw error;
    }
  }

  // User settings
  async getUserSettings(userId) {
    try {
      let settings = await this.prisma.userSettings.findUnique({
        where: { userId }
      });

      if (!settings) {
        // Create default settings
        settings = await this.prisma.userSettings.create({
          data: {
            userId,
            enableReminders: true,
            reminderDays: [7, 3, 1],
            reminderChannels: ['email', 'in-app'],
            autoAnalysis: true,
            analysisFrequency: 'daily',
            emailNotifications: true,
            pushNotifications: true
          }
        });
      }

      return settings;
    } catch (error) {
      console.error('Get user settings error:', error);
      throw error;
    }
  }

  async updateUserSettings(userId, settingsData) {
    try {
      return await this.prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          ...settingsData
        },
        update: settingsData
      });
    } catch (error) {
      console.error('Update user settings error:', error);
      throw error;
    }
  }

  async getUserReminderSettings(userId) {
    try {
      const settings = await this.getUserSettings(userId);
      return {
        enableReminders: settings.enableReminders,
        reminderDays: settings.reminderDays,
        reminderChannels: settings.reminderChannels,
        customMessage: settings.customMessage
      };
    } catch (error) {
      console.error('Get user reminder settings error:', error);
      throw error;
    }
  }

  async updateUserReminderSettings(userId, reminderSettings) {
    try {
      return await this.updateUserSettings(userId, reminderSettings);
    } catch (error) {
      console.error('Update user reminder settings error:', error);
      throw error;
    }
  }

  // Notifications
  async createNotification(notificationData) {
    try {
      return await this.prisma.notification.create({
        data: notificationData
      });
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const skip = (page - 1) * limit;

      const where = { userId };
      if (unreadOnly) {
        where.readAt = null;
      }

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.notification.count({ where })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get user notifications error:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      return await this.prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() }
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  // Webhook events
  async createWebhookEvent(eventData) {
    try {
      return await this.prisma.webhookEvent.create({
        data: eventData
      });
    } catch (error) {
      console.error('Create webhook event error:', error);
      throw error;
    }
  }

  async updateWebhookEvent(eventId, updateData) {
    try {
      return await this.prisma.webhookEvent.update({
        where: { id: eventId },
        data: updateData
      });
    } catch (error) {
      console.error('Update webhook event error:', error);
      throw error;
    }
  }

  // Audit logging
  async createAuditLog(logData) {
    try {
      await this.prisma.auditLog.create({
        data: {
          ...logData,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Create audit log error:', error);
      // Don't throw error for audit log failures
    }
  }

  // Cleanup operations
  async cleanupExpiredData() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Clean up old usage stats
      await this.prisma.usageStats.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo
          }
        }
      });

      // Clean up old webhook events
      await this.prisma.webhookEvent.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          status: 'COMPLETED'
        }
      });

      console.log('Database cleanup completed');
    } catch (error) {
      console.error('Database cleanup error:', error);
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date() };
    } catch (error) {
      console.error('Database health check failed:', error);
      throw error;
    }
  }

  // Close connection
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export default DatabaseService;
