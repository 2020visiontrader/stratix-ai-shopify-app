import { db } from '../lib/supabase';
import { sendEmail } from '../utils/email';
import { sendSlackAlert } from '../utils/slackAlerts';

export class TrialReminder {
  private static instance: TrialReminder;
  
  private constructor() {}

  public static getInstance(): TrialReminder {
    if (!TrialReminder.instance) {
      TrialReminder.instance = new TrialReminder();
    }
    return TrialReminder.instance;
  }

  public async checkTrialStatus(brandId: string): Promise<void> {
    try {
      const { data: brand } = await db.brands.getById(brandId);
      if (!brand) throw new Error('Brand not found');

      const { data: config } = await db.brand_configs.getByBrandId(brandId);
      if (!config) throw new Error('Brand config not found');

      // Skip if reminder already sent
      if (config.trial_reminder_sent) return;

      const trialStartDate = new Date(brand.trial_start_date);
      const daysSinceStart = this.getDaysSinceDate(trialStartDate);

      if (daysSinceStart === 6) {
        await this.sendTrialEndingReminders(brand);
        await this.markReminderSent(brandId);
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
      throw error;
    }
  }

  private getDaysSinceDate(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async sendTrialEndingReminders(brand: any): Promise<void> {
    // Send email to user
    await sendEmail({
      to: brand.email,
      subject: '⚠️ Your Stratix AI trial ends tomorrow',
      template: 'trial-ending',
      data: {
        brandName: brand.name
      }
    });

    // Send Slack alert to admin
    await sendSlackAlert({
      type: 'TRIAL_ENDING',
      brand,
      message: `Trial ending tomorrow for ${brand.name} (${brand.email}). Follow up needed.`
    });
  }

  private async markReminderSent(brandId: string): Promise<void> {
    await db.brand_configs.update(brandId, {
      trial_reminder_sent: true
    });
  }
} 