import { NetworkManager } from '@/lib/core/NetworkManager';
import { useCallback, useEffect, useState } from 'react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  unread: number;
  loading: boolean;
  error: string | null;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unread: 0,
    loading: false,
    error: null,
  });

  const fetchNotifications = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await NetworkManager.getInstance().get('/api/notifications');
      const notifications = response.data;
      const unread = notifications.filter((n: Notification) => !n.read).length;
      setState({ notifications, unread, loading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch notifications',
      }));
    }
  }, []);

  const markAsRead = useCallback(async (id?: string) => {
    try {
      if (id) {
        await NetworkManager.getInstance().patch(`/api/notifications/${id}/read`);
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unread: prev.unread - 1,
        }));
      } else {
        await NetworkManager.getInstance().patch('/api/notifications/read-all');
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, read: true })),
          unread: 0,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to mark notification as read',
      }));
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await NetworkManager.getInstance().delete(`/api/notifications/${id}`);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id),
        unread: prev.notifications.find(n => n.id === id)?.read
          ? prev.unread
          : prev.unread - 1,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to delete notification',
      }));
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    ...state,
    markAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}; 