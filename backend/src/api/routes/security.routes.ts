import { NextFunction, Request, Response, Router } from 'express';
import { verifyShopifySession } from '../middleware/shopify-auth';

const router = Router();
// const db = new DatabaseService(); // Will implement proper database integration later

// Extended request interface
interface ExtendedRequest extends Request {
  shop?: any;
  shopDomain?: string;
}

// Get security status
router.get(
  '/status',
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

      const securityStatus = generateMockSecurityStatus(shop.id);

      res.json({
        success: true,
        data: securityStatus
      });
    } catch (error) {
      console.error('Security status error:', error);
      next(error);
    }
  }
);

// Run security scan
router.post(
  '/scan',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { scanType = 'full' } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const scan = await startSecurityScan(shop.id, scanType);

      res.json({
        success: true,
        data: {
          scanId: scan.id,
          status: scan.status,
          estimatedDuration: scan.estimatedDuration
        },
        message: 'Security scan started successfully'
      });
    } catch (error) {
      console.error('Security scan error:', error);
      next(error);
    }
  }
);

// Get scan results
router.get(
  '/scan/:id',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const scanResult = await getScanResult(id, shop.id);

      if (!scanResult) {
        res.status(404).json({ 
          success: false, 
          error: 'Scan not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: scanResult
      });
    } catch (error) {
      console.error('Scan result error:', error);
      next(error);
    }
  }
);

// Get security recommendations
router.get(
  '/recommendations',
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

      const recommendations = generateSecurityRecommendations(shop.id);

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Security recommendations error:', error);
      next(error);
    }
  }
);

// Get security alerts
router.get(
  '/alerts',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { status = 'active', limit = 10 } = req.query as any;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const alerts = generateSecurityAlerts(shop.id, status, parseInt(limit));

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Security alerts error:', error);
      next(error);
    }
  }
);

// Update alert status
router.patch(
  '/alerts/:id',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const updatedAlert = await updateAlertStatus(id, shop.id, status, notes);

      if (!updatedAlert) {
        res.status(404).json({ 
          success: false, 
          error: 'Alert not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: updatedAlert,
        message: 'Alert status updated successfully'
      });
    } catch (error) {
      console.error('Update alert error:', error);
      next(error);
    }
  }
);

// Get security settings
router.get(
  '/settings',
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

      const settings = getSecuritySettings(shop.id);

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Security settings error:', error);
      next(error);
    }
  }
);

// Update security settings
router.put(
  '/settings',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const settings = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const updatedSettings = await updateSecuritySettings(shop.id, settings);

      res.json({
        success: true,
        data: updatedSettings,
        message: 'Security settings updated successfully'
      });
    } catch (error) {
      console.error('Update security settings error:', error);
      next(error);
    }
  }
);

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateMockSecurityStatus(shopId: string): any {
  const threats = Math.floor(Math.random() * 5);
  const lastScan = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
  
  return {
    overallScore: Math.floor(Math.random() * 30) + 70, // 70-100 range
    status: threats > 2 ? 'warning' : threats > 0 ? 'medium' : 'good',
    lastScan: lastScan.toISOString(),
    threats: threats,
    vulnerabilities: {
      high: Math.floor(Math.random() * 2),
      medium: Math.floor(Math.random() * 3),
      low: Math.floor(Math.random() * 5)
    },
    recommendations: [
      'Enable two-factor authentication',
      'Update admin passwords regularly',
      'Review app permissions',
      'Monitor unusual login activity',
      'Keep themes and apps updated'
    ].slice(0, Math.floor(Math.random() * 3) + 2),
    nextScanDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    scanHistory: generateScanHistory(5)
  };
}

async function startSecurityScan(shopId: string, scanType: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: generateId(),
        shopId,
        type: scanType,
        status: 'running',
        startedAt: new Date().toISOString(),
        estimatedDuration: '5-10 minutes',
        progress: 0
      });
    }, 100);
  });
}

async function getScanResult(scanId: string, shopId: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const threats = Math.floor(Math.random() * 5);
      
      resolve({
        id: scanId,
        shopId,
        status: 'completed',
        startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
        completedAt: new Date().toISOString(),
        duration: '7 minutes 32 seconds',
        results: {
          itemsScanned: Math.floor(Math.random() * 1000) + 500,
          threatsFound: threats,
          vulnerabilities: {
            high: Math.floor(threats / 3),
            medium: Math.floor(threats / 2),
            low: threats - Math.floor(threats / 3) - Math.floor(threats / 2)
          },
          categories: {
            malware: Math.floor(Math.random() * 2),
            phishing: Math.floor(Math.random() * 2),
            dataLeaks: Math.floor(Math.random() * 3),
            permissions: Math.floor(Math.random() * 2),
            outdatedSoftware: Math.floor(Math.random() * 3)
          }
        },
        details: generateScanDetails(threats),
        recommendations: generateScanRecommendations(threats)
      });
    }, 200);
  });
}

function generateSecurityRecommendations(shopId: string): any {
  return {
    priority: [
      {
        id: generateId(),
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security to your admin account',
        impact: 'high',
        difficulty: 'easy',
        category: 'authentication',
        estimatedTime: '5 minutes'
      },
      {
        id: generateId(),
        title: 'Review App Permissions',
        description: 'Audit installed apps and their access permissions',
        impact: 'medium',
        difficulty: 'medium',
        category: 'permissions',
        estimatedTime: '15 minutes'
      },
      {
        id: generateId(),
        title: 'Update Admin Passwords',
        description: 'Use strong, unique passwords for all admin accounts',
        impact: 'high',
        difficulty: 'easy',
        category: 'authentication',
        estimatedTime: '10 minutes'
      }
    ],
    general: [
      {
        id: generateId(),
        title: 'Regular Security Scans',
        description: 'Schedule weekly automated security scans',
        impact: 'medium',
        difficulty: 'easy',
        category: 'monitoring'
      },
      {
        id: generateId(),
        title: 'Monitor Login Activity',
        description: 'Set up alerts for unusual login patterns',
        impact: 'medium',
        difficulty: 'medium',
        category: 'monitoring'
      },
      {
        id: generateId(),
        title: 'Keep Software Updated',
        description: 'Regularly update themes, apps, and integrations',
        impact: 'medium',
        difficulty: 'easy',
        category: 'maintenance'
      }
    ],
    completed: [
      {
        id: generateId(),
        title: 'SSL Certificate Installed',
        description: 'HTTPS encryption is properly configured',
        completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
}

function generateSecurityAlerts(shopId: string, status: string, limit: number): any[] {
  const alerts = [];
  const severities = ['low', 'medium', 'high', 'critical'];
  const types = ['login_attempt', 'permission_change', 'data_access', 'malware_detected', 'unusual_activity'];
  
  for (let i = 0; i < limit; i++) {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    alerts.push({
      id: generateId(),
      type,
      severity,
      title: generateAlertTitle(type, severity),
      description: generateAlertDescription(type),
      status: status === 'active' ? (Math.random() > 0.3 ? 'active' : 'resolved') : status,
      createdAt: date.toISOString(),
      resolvedAt: status === 'resolved' ? new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
      source: 'security_scanner',
      metadata: {
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
  }
  
  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function updateAlertStatus(alertId: string, shopId: string, status: string, notes?: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: alertId,
        shopId,
        status,
        notes,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      });
    }, 100);
  });
}

function getSecuritySettings(shopId: string): any {
  return {
    scanSettings: {
      autoScan: true,
      scanFrequency: 'weekly',
      scanTime: '02:00',
      scanTypes: ['malware', 'vulnerabilities', 'permissions'],
      notifications: true
    },
    alertSettings: {
      emailNotifications: true,
      slackNotifications: false,
      alertThreshold: 'medium',
      digestFrequency: 'daily'
    },
    accessControl: {
      twoFactorRequired: false,
      sessionTimeout: 30,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: false
      }
    },
    monitoring: {
      logFailedLogins: true,
      trackPermissionChanges: true,
      monitorDataAccess: true,
      retentionDays: 90
    }
  };
}

async function updateSecuritySettings(shopId: string, settings: any): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...settings,
        shopId,
        updatedAt: new Date().toISOString()
      });
    }, 100);
  });
}

function generateScanHistory(count: number): any[] {
  const history = [];
  
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const threats = Math.floor(Math.random() * 5);
    
    history.push({
      id: generateId(),
      date: date.toISOString(),
      threats,
      status: threats > 2 ? 'warning' : threats > 0 ? 'medium' : 'good',
      duration: `${Math.floor(Math.random() * 10) + 3} minutes`
    });
  }
  
  return history.reverse();
}

function generateScanDetails(threatCount: number): any[] {
  const details = [];
  const threatTypes = ['malware', 'phishing', 'dataLeak', 'permission', 'outdated'];
  
  for (let i = 0; i < threatCount; i++) {
    const type = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    
    details.push({
      id: generateId(),
      type,
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      title: generateThreatTitle(type),
      description: generateThreatDescription(type),
      location: generateThreatLocation(type),
      recommendation: generateThreatRecommendation(type)
    });
  }
  
  return details;
}

function generateScanRecommendations(threatCount: number): string[] {
  const recommendations = [
    'Review and update app permissions immediately',
    'Change all admin passwords',
    'Enable two-factor authentication',
    'Update outdated themes and plugins',
    'Review recent admin activity logs',
    'Implement IP whitelist for admin access',
    'Set up automated security monitoring'
  ];
  
  return recommendations.slice(0, Math.max(threatCount, 2));
}

function generateAlertTitle(type: string, severity: string): string {
  const titles: Record<string, string> = {
    login_attempt: `${severity === 'critical' ? 'Multiple failed' : 'Suspicious'} login attempts detected`,
    permission_change: `${severity === 'high' ? 'Critical' : 'Unauthorized'} permission changes`,
    data_access: `${severity === 'critical' ? 'Massive' : 'Unusual'} data access patterns`,
    malware_detected: `${severity === 'critical' ? 'Active malware' : 'Potential malware'} detected`,
    unusual_activity: `${severity === 'high' ? 'Highly suspicious' : 'Unusual'} account activity`
  };
  
  return titles[type] || 'Security alert';
}

function generateAlertDescription(type: string): string {
  const descriptions: Record<string, string> = {
    login_attempt: 'Multiple failed login attempts from different IP addresses',
    permission_change: 'App permissions were modified without authorization',
    data_access: 'Unusual patterns in customer data access detected',
    malware_detected: 'Suspicious code patterns identified in theme files',
    unusual_activity: 'Account activity outside normal business hours'
  };
  
  return descriptions[type] || 'Security issue detected';
}

function generateThreatTitle(type: string): string {
  const titles: Record<string, string> = {
    malware: 'Malicious code detected in theme files',
    phishing: 'Phishing attempt detected',
    dataLeak: 'Potential data exposure vulnerability',
    permission: 'Excessive app permissions granted',
    outdated: 'Outdated software with known vulnerabilities'
  };
  
  return titles[type] || 'Security threat detected';
}

function generateThreatDescription(type: string): string {
  const descriptions: Record<string, string> = {
    malware: 'Suspicious JavaScript code found that may compromise customer data',
    phishing: 'Email template contains links that may redirect to malicious sites',
    dataLeak: 'Customer information may be accessible without proper authentication',
    permission: 'Third-party app has more permissions than necessary for its function',
    outdated: 'Theme or app version contains known security vulnerabilities'
  };
  
  return descriptions[type] || 'Security issue identified during scan';
}

function generateThreatLocation(type: string): string {
  const locations: Record<string, string> = {
    malware: 'Theme files: assets/theme.js, templates/product.liquid',
    phishing: 'Email templates: order-confirmation.html',
    dataLeak: 'API endpoints: /api/customers, /api/orders',
    permission: 'Third-party apps: Marketing App Pro, Analytics Plus',
    outdated: 'Theme: Debut v2.1.0, App: Customer Reviews v1.5.2'
  };
  
  return locations[type] || 'Various locations';
}

function generateThreatRecommendation(type: string): string {
  const recommendations: Record<string, string> = {
    malware: 'Remove suspicious code and restore from backup',
    phishing: 'Update email templates and validate all external links',
    dataLeak: 'Implement proper authentication for sensitive endpoints',
    permission: 'Review and limit app permissions to minimum required',
    outdated: 'Update to the latest versions immediately'
  };
  
  return recommendations[type] || 'Contact security team for assistance';
}

export default router;
