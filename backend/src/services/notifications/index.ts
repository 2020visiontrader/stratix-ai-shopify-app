import { supabase } from '../../db';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface Notification {
  id: string;
  user_id: string;
  type: 'content_ready' | 'performance_alert' | 'system_update';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: Date;
}

export class NotificationService {
  async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<Notification> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          read: false,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Send real-time notification
      await this.sendRealtimeNotification(notification as Notification);

      return notification as Notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw new AppError(500, 'NOTIFICATION_ERROR', 'Failed to create notification', error);
    }
  }

  private async sendRealtimeNotification(notification: Notification): Promise<void> {
    try {
      const { error } = await supabase
        .channel('notifications')
        .send({
          type: 'broadcast',
          event: 'notification',
          payload: notification
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error sending realtime notification:', error);
      // Don't throw error as it's not critical
    }
  }

  async getNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      type?: Notification['type'];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.unreadOnly) {
        query = query.eq('read', false);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      const { data, error, count } = await query
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 10) - 1);

      if (error) throw error;

      return {
        notifications: data as Notification[],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error getting notifications:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get notifications', error);
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to mark notification as read', error);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to mark all notifications as read', error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to delete notification', error);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get unread count', error);
    }
  }
} 