import { db } from '../lib/supabase';
import { sendEmail } from '../utils/email';
import { sendSlackAlert } from '../utils/slackAlerts';

export type IncidentType = 
  | 'BILLING_FAILURE'
  | 'STORAGE_OVERAGE'
  | 'TOKEN_DEPLETION'
  | 'AI_GENERATION_STALL'
  | 'PLAN_DOWNGRADE_REQUEST';

interface Incident {
  type: IncidentType;
  brand_id: string;
  severity: 'low' | 'medium' | 'high';
  details: Record<string, any>;
  timestamp: Date;
}

export class EscalationEngine {
  private static instance: EscalationEngine;
  
  private constructor() {}

  public static getInstance(): EscalationEngine {
    if (!EscalationEngine.instance) {
      EscalationEngine.instance = new EscalationEngine();
    }
    return EscalationEngine.instance;
  }

  public async escalateIncident(incident: Incident): Promise<void> {
    try {
      // Get brand details
      const { data: brand } = await db.brands.getById(incident.brand_id);
      if (!brand) throw new Error('Brand not found');

      // Log incident
      await this.logIncident(incident);

      // Send notifications
      await this.sendNotifications(brand, incident);

      // Take immediate action based on incident type
      await this.handleIncident(brand, incident);
    } catch (error) {
      console.error('Error escalating incident:', error);
      throw error;
    }
  }

  private async logIncident(incident: Incident): Promise<void> {
    await db.events.create({
      type: `INCIDENT_${incident.type}`,
      brand_id: incident.brand_id,
      payload: {
        severity: incident.severity,
        details: incident.details,
        timestamp: incident.timestamp
      }
    });
  }

  private async sendNotifications(brand: any, incident: Incident): Promise<void> {
    const subject = this.getEmailSubject(incident);
    const message = this.getSlackMessage(brand, incident);

    // Send email to support team
    await sendEmail({
      to: process.env.SUPPORT_EMAIL || 'support@stratix.ai',
      subject,
      template: 'incident-alert',
      data: {
        brand,
        incident,
        timestamp: incident.timestamp.toISOString()
      }
    });

    // Send Slack alert
    await sendSlackAlert({
      type: incident.type,
      brand,
      message,
      details: {
        severity: incident.severity,
        ...incident.details,
        timestamp: incident.timestamp.toISOString()
      }
    });
  }

  private getEmailSubject(incident: Incident): string {
    const prefix = incident.severity === 'high' ? '🚨' : '⚠️';
    return `${prefix} Stratix AI Alert: ${this.formatIncidentType(incident.type)}`;
  }

  private getSlackMessage(brand: any, incident: Incident): string {
    const emoji = this.getSeverityEmoji(incident.severity);
    return `${emoji} [${brand.name}] ${this.formatIncidentType(incident.type)} - ${incident.severity.toUpperCase()} severity`;
  }

  private getSeverityEmoji(severity: Incident['severity']): string {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return '📝';
      default:
        return '❗';
    }
  }

  private formatIncidentType(type: IncidentType): string {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  }

  private async handleIncident(brand: any, incident: Incident): Promise<void> {
    switch (incident.type) {
      case 'BILLING_FAILURE':
        await this.handleBillingFailure(brand, incident);
        break;
      case 'STORAGE_OVERAGE':
      case 'TOKEN_DEPLETION':
        await this.handleResourceOverage(brand, incident);
        break;
      case 'AI_GENERATION_STALL':
        await this.handleAIStall(brand, incident);
        break;
      case 'PLAN_DOWNGRADE_REQUEST':
        await this.handleDowngradeRequest(brand, incident);
        break;
    }
  }

  private async handleBillingFailure(brand: any, incident: Incident): Promise<void> {
    // Lock non-critical features
    await db.brand_configs.update(brand.id, {
      feature_locks: {
        autopilot: true,
        bulk_operations: true,
        advanced_analytics: true
      }
    });
  }

  private async handleResourceOverage(brand: any, incident: Incident): Promise<void> {
    // Enable low resource mode
    await db.brand_configs.update(brand.id, {
      low_resource_mode: true,
      feature_locks: {
        bulk_operations: true,
        advanced_analytics: true
      }
    });
  }

  private async handleAIStall(brand: any, incident: Incident): Promise<void> {
    // Switch to fallback mode
    await db.brand_configs.update(brand.id, {
      ai_fallback_mode: true
    });
  }

  private async handleDowngradeRequest(brand: any, incident: Incident): Promise<void> {
    // Create task for account manager review
    await db.events.create({
      type: 'ACCOUNT_REVIEW_NEEDED',
      brand_id: brand.id,
      payload: {
        current_plan: brand.plan,
        requested_plan: incident.details.requested_plan,
        reason: incident.details.reason,
        timestamp: incident.timestamp
      }
    });
  }
} 