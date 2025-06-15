import { db } from '../lib/supabase';

export type UserSegment = 'new' | 'returning' | 'vip';

export interface SegmentTriggerLog {
  userId: string;
  segment: UserSegment;
  contentVariant: string;
  reason: string;
  timestamp: Date;
}

export class LoyaltyContentEngine {
  /**
   * Detect user segment using tags or scoring.
   */
  async detectSegment(userId: string): Promise<UserSegment> {
    try {
      if (userId.startsWith('vip')) return 'vip';
      if (userId.startsWith('ret')) return 'returning';
      return 'new';
    } catch (error) {
      console.error('Error detecting user segment:', error);
      return 'new';
    }
  }

  /**
   * Personalize content for the detected segment.
   */
  async personalizeContent(userId: string, baseContent: string): Promise<string> {
    try {
      const segment = await this.detectSegment(userId);
      let variant = baseContent;
      if (segment === 'vip') {
        variant = `Welcome back, here's an exclusive bundle!\n${baseContent}`;
      } else if (segment === 'returning') {
        variant = `Welcome back! ${baseContent}`;
      }
      // Log the trigger
      await this.logTrigger({
        userId,
        segment,
        contentVariant: variant,
        reason: 'Segment-based personalization',
        timestamp: new Date()
      });
      return variant;
    } catch (error) {
      console.error('Error personalizing content:', error);
      return baseContent;
    }
  }

  /**
   * Log personalization trigger for learning.
   */
  async logTrigger(log: SegmentTriggerLog): Promise<boolean> {
    try {
      await db.from('segment_triggers').upsert({
        user_id: log.userId,
        data: log,
        created_at: log.timestamp
      });
      return true;
    } catch (error) {
      console.error('Error logging segment trigger:', error);
      return false;
    }
  }
} 