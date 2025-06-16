import { useNotifications } from '@/hooks/useNotifications';
import { BellIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState } from 'react';

type NotificationType = 'info' | 'success' | 'warning' | 'error';
type NotificationFilter = 'all' | NotificationType;

export const NotificationList: React.FC = () => {
  const { notifications, markAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') {
      return notifications.notifications;
    }
    return notifications.notifications.filter(n => n.type === filter);
  }, [notifications.notifications, filter]);

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: typeof filteredNotifications } = {};
    filteredNotifications.forEach(notification => {
      const date = new Date(notification.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });
    return groups;
  }, [filteredNotifications]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  if (notifications.notifications.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <BellIcon className="mx-auto h-12 w-12" />
        <p className="mt-2">No notifications</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as NotificationFilter)}
              className="text-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-500"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedNotifications).map(([date, notifications]) => (
            <div key={date} className="border-b border-gray-200 last:border-b-0">
              <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
                {date}
              </div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 ${
                    notification.read ? 'bg-white' : 'bg-purple-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead()}
                              className="text-xs text-purple-600 hover:text-purple-900"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{notifications.unread} unread</span>
          <button
            onClick={() => markAsRead()}
            className="text-purple-600 hover:text-purple-900"
          >
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
}; 