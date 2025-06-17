import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { verifyShopifySession } from '../middleware/shopify-auth';
import { validateRequest } from '../middleware/validation';

const router = Router();
// const db = new DatabaseService(); // Will implement proper database integration later

// Request validation schemas
const updateSettingsSchema = z.object({
  body: z.object({
    general: z.object({
      shopName: z.string().optional(),
      timezone: z.string().optional(),
      currency: z.string().optional(),
      language: z.string().optional()
    }).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      slack: z.boolean().optional(),
      webhook: z.boolean().optional(),
      frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).optional(),
      types: z.array(z.string()).optional()
    }).optional(),
    ai: z.object({
      autoOptimize: z.boolean().optional(),
      optimizationThreshold: z.number().min(0).max(1).optional(),
      brandAlignment: z.boolean().optional(),
      performancePrediction: z.boolean().optional(),
      customPrompts: z.array(z.string()).optional()
    }).optional(),
    performance: z.object({
      trackingEnabled: z.boolean().optional(),
      metricsRetention: z.number().min(30).max(365).optional(),
      autoReports: z.boolean().optional(),
      reportFrequency: z.enum(['daily', 'weekly', 'monthly']).optional()
    }).optional(),
    security: z.object({
      twoFactorRequired: z.boolean().optional(),
      sessionTimeout: z.number().min(5).max(480).optional(),
      allowedIPs: z.array(z.string()).optional(),
      auditLogging: z.boolean().optional()
    }).optional(),
    integrations: z.object({
      shopify: z.object({
        syncEnabled: z.boolean().optional(),
        syncFrequency: z.enum(['realtime', 'hourly', 'daily']).optional()
      }).optional(),
      analytics: z.object({
        googleAnalytics: z.string().optional(),
        facebookPixel: z.string().optional(),
        customTracking: z.array(z.object({
          name: z.string(),
          code: z.string(),
          enabled: z.boolean()
        })).optional()
      }).optional()
    }).optional()
  })
});

// Extended request interface
interface ExtendedRequest extends Request {
  shop?: any;
  shopDomain?: string;
}

// Get settings
router.get(
  '/',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const settings = getShopSettings(shop.id);

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Get settings error:', error);
      next(error);
    }
  }
);

// Update settings
router.put(
  '/',
  verifyShopifySession,
  validateRequest(updateSettingsSchema),
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const shop = req.shop;
      const updates = req.body;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const updatedSettings = await updateShopSettings(shop.id, updates);

      res.json({
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      console.error('Update settings error:', error);
      next(error);
    }
  }
);

// Reset settings
router.post(
  '/reset',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { category } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const resetSettings = await resetShopSettings(shop.id, category);

      res.json({
        success: true,
        data: resetSettings,
        message: `${category ? category + ' s' : 'S'}ettings reset to defaults`
      });
    } catch (error) {
      console.error('Reset settings error:', error);
      next(error);
    }
  }
);

// Export settings
router.get(
  '/export',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { format = 'json' } = req.query as any;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const settings = getShopSettings(shop.id);
      const exportData = await exportSettings(settings, format);

      if (format === 'json') {
        res.json({
          success: true,
          data: exportData
        });
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=settings.csv');
        res.send(exportData);
      }
    } catch (error) {
      console.error('Export settings error:', error);
      next(error);
    }
  }
);

// Import settings
router.post(
  '/import',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { settings, overwrite = false } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      if (!settings) {
        res.status(400).json({ 
          success: false, 
          error: 'Settings data is required' 
        });
        return;
      }

      const importResult = await importSettings(shop.id, settings, overwrite);

      res.json({
        success: true,
        data: importResult,
        message: 'Settings imported successfully'
      });
    } catch (error) {
      console.error('Import settings error:', error);
      next(error);
    }
  }
);

// Get settings history
router.get(
  '/history',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit = 10 } = req.query as any;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const history = getSettingsHistory(shop.id, parseInt(limit));

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Settings history error:', error);
      next(error);
    }
  }
);

// Get default settings
router.get(
  '/defaults',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const defaults = getDefaultSettings();

      res.json({
        success: true,
        data: defaults
      });
    } catch (error) {
      console.error('Default settings error:', error);
      next(error);
    }
  }
);

// Validate settings
router.post(
  '/validate',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { settings } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const validationResult = validateSettings(settings);

      res.json({
        success: true,
        data: validationResult
      });
    } catch (error) {
      console.error('Validate settings error:', error);
      next(error);
    }
  }
);

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getShopSettings(shopId: string): any {
  return {
    general: {
      shopName: 'My Shopify Store',
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    notifications: {
      email: true,
      slack: false,
      webhook: false,
      frequency: 'daily',
      types: ['analysis_complete', 'optimization_ready', 'security_alerts', 'trial_expiring'],
      emailAddress: 'admin@example.com',
      slackWebhook: '',
      webhookUrl: ''
    },
    ai: {
      autoOptimize: false,
      optimizationThreshold: 0.7,
      brandAlignment: true,
      performancePrediction: true,
      customPrompts: [
        'Focus on eco-friendly messaging',
        'Emphasize premium quality',
        'Target young professionals'
      ],
      modelPreferences: {
        primary: 'gpt-4',
        fallback: 'gpt-3.5-turbo',
        temperature: 0.7
      }
    },
    performance: {
      trackingEnabled: true,
      metricsRetention: 90,
      autoReports: true,
      reportFrequency: 'weekly',
      dashboardRefresh: 'realtime',
      alertThresholds: {
        conversionDrop: 0.1,
        trafficDrop: 0.2,
        revenueDrop: 0.15
      }
    },
    security: {
      twoFactorRequired: false,
      sessionTimeout: 30,
      allowedIPs: [],
      auditLogging: true,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: false
      },
      loginAttempts: {
        maxAttempts: 5,
        lockoutDuration: 15
      }
    },
    integrations: {
      shopify: {
        syncEnabled: true,
        syncFrequency: 'hourly',
        webhooksEnabled: true,
        syncProducts: true,
        syncOrders: true,
        syncCustomers: false
      },
      analytics: {
        googleAnalytics: '',
        facebookPixel: '',
        customTracking: [
          {
            name: 'Hotjar',
            code: '',
            enabled: false
          },
          {
            name: 'Mixpanel',
            code: '',
            enabled: false
          }
        ]
      },
      email: {
        provider: 'sendgrid',
        apiKey: '',
        fromEmail: 'noreply@example.com',
        fromName: 'Stratix AI'
      }
    },
    billing: {
      plan: 'trial',
      billingCycle: 'monthly',
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usage: {
        analyses: 45,
        optimizations: 12,
        apiCalls: 1250
      }
    },
    features: {
      aiAnalysis: true,
      productOptimization: true,
      performanceTracking: true,
      brandAlignment: true,
      securityScanning: false,
      bulkOperations: false,
      advancedAnalytics: false,
      customBranding: false
    }
  };
}

async function updateShopSettings(shopId: string, updates: any): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const currentSettings = getShopSettings(shopId);
      const updatedSettings = mergeSettings(currentSettings, updates);
      
      resolve({
        ...updatedSettings,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin'
      });
    }, 200);
  });
}

async function resetShopSettings(shopId: string, category?: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const defaults = getDefaultSettings();
      
      if (category) {
        const currentSettings = getShopSettings(shopId);
        const resetSettings = {
          ...currentSettings,
          [category]: defaults[category]
        };
        resolve(resetSettings);
      } else {
        resolve(defaults);
      }
    }, 100);
  });
}

async function exportSettings(settings: any, format: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (format === 'csv') {
        const csv = convertToCSV(settings);
        resolve(csv);
      } else {
        resolve({
          ...settings,
          exportedAt: new Date().toISOString(),
          version: '1.0'
        });
      }
    }, 100);
  });
}

async function importSettings(shopId: string, settings: any, overwrite: boolean): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const currentSettings = getShopSettings(shopId);
      const importedSettings = overwrite 
        ? { ...settings, importedAt: new Date().toISOString() }
        : mergeSettings(currentSettings, settings);
      
      resolve({
        settings: importedSettings,
        imported: Object.keys(settings).length,
        overwritten: overwrite,
        importedAt: new Date().toISOString()
      });
    }, 300);
  });
}

function getSettingsHistory(shopId: string, limit: number): any[] {
  const history: any[] = [];
  
  for (let i = 0; i < limit; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const actions = ['updated', 'reset', 'imported', 'exported'];
    const categories = ['general', 'notifications', 'ai', 'performance', 'security', 'integrations'];
    
    const action = actions[Math.floor(Math.random() * actions.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    history.push({
      id: generateId(),
      action,
      category,
      timestamp: date.toISOString(),
      user: 'admin',
      description: `Settings ${action} for ${category} category`,
      changes: Math.floor(Math.random() * 5) + 1
    });
  }
  
  return history.reverse();
}

function getDefaultSettings(): any {
  return {
    general: {
      shopName: '',
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    notifications: {
      email: true,
      slack: false,
      webhook: false,
      frequency: 'daily',
      types: ['analysis_complete', 'security_alerts'],
      emailAddress: '',
      slackWebhook: '',
      webhookUrl: ''
    },
    ai: {
      autoOptimize: false,
      optimizationThreshold: 0.7,
      brandAlignment: true,
      performancePrediction: false,
      customPrompts: [],
      modelPreferences: {
        primary: 'gpt-4',
        fallback: 'gpt-3.5-turbo',
        temperature: 0.7
      }
    },
    performance: {
      trackingEnabled: true,
      metricsRetention: 30,
      autoReports: false,
      reportFrequency: 'weekly',
      dashboardRefresh: 'hourly',
      alertThresholds: {
        conversionDrop: 0.1,
        trafficDrop: 0.2,
        revenueDrop: 0.15
      }
    },
    security: {
      twoFactorRequired: false,
      sessionTimeout: 60,
      allowedIPs: [],
      auditLogging: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: false,
        requireNumbers: false,
        requireSymbols: false
      }
    },
    integrations: {
      shopify: {
        syncEnabled: true,
        syncFrequency: 'daily',
        webhooksEnabled: false
      },
      analytics: {
        googleAnalytics: '',
        facebookPixel: '',
        customTracking: []
      }
    }
  };
}

function validateSettings(settings: any): any {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate general settings
  if (settings.general) {
    if (settings.general.timezone && !isValidTimezone(settings.general.timezone)) {
      errors.push('Invalid timezone specified');
    }
    if (settings.general.currency && !isValidCurrency(settings.general.currency)) {
      errors.push('Invalid currency code');
    }
  }
  
  // Validate notifications
  if (settings.notifications) {
    if (settings.notifications.emailAddress && !isValidEmail(settings.notifications.emailAddress)) {
      errors.push('Invalid email address format');
    }
    if (settings.notifications.slackWebhook && !isValidUrl(settings.notifications.slackWebhook)) {
      errors.push('Invalid Slack webhook URL');
    }
    if (settings.notifications.webhookUrl && !isValidUrl(settings.notifications.webhookUrl)) {
      errors.push('Invalid webhook URL');
    }
  }
  
  // Validate AI settings
  if (settings.ai) {
    if (settings.ai.optimizationThreshold && (settings.ai.optimizationThreshold < 0 || settings.ai.optimizationThreshold > 1)) {
      errors.push('Optimization threshold must be between 0 and 1');
    }
    if (settings.ai.modelPreferences?.temperature && (settings.ai.modelPreferences.temperature < 0 || settings.ai.modelPreferences.temperature > 2)) {
      warnings.push('Temperature outside recommended range (0-2)');
    }
  }
  
  // Validate security settings
  if (settings.security) {
    if (settings.security.sessionTimeout && (settings.security.sessionTimeout < 5 || settings.security.sessionTimeout > 480)) {
      errors.push('Session timeout must be between 5 and 480 minutes');
    }
    if (settings.security.allowedIPs && Array.isArray(settings.security.allowedIPs)) {
      settings.security.allowedIPs.forEach((ip: string, index: number) => {
        if (!isValidIP(ip)) {
          errors.push(`Invalid IP address at index ${index}: ${ip}`);
        }
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalChecks: errors.length + warnings.length + 10, // mock additional checks
    passedChecks: 10 - errors.length
  };
}

function mergeSettings(current: any, updates: any): any {
  const merged = { ...current };
  
  Object.keys(updates).forEach(key => {
    if (typeof updates[key] === 'object' && !Array.isArray(updates[key]) && updates[key] !== null) {
      merged[key] = { ...merged[key], ...updates[key] };
    } else {
      merged[key] = updates[key];
    }
  });
  
  return merged;
}

function convertToCSV(settings: any): string {
  const rows = [];
  rows.push(['Category', 'Setting', 'Value']);
  
  Object.keys(settings).forEach(category => {
    if (typeof settings[category] === 'object' && !Array.isArray(settings[category])) {
      Object.keys(settings[category]).forEach(setting => {
        const value = Array.isArray(settings[category][setting]) 
          ? settings[category][setting].join(';')
          : String(settings[category][setting]);
        rows.push([category, setting, value]);
      });
    }
  });
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Validation helper functions
function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function isValidCurrency(currency: string): boolean {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'];
  return validCurrencies.includes(currency.toUpperCase());
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidIP(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

export default router;
