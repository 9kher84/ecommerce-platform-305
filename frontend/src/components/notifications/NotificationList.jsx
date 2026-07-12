import React from 'react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/queries/notificationQueries';

export const NotificationList = ({ onClose }) => {
  const { data, isLoading, isError } = useNotifications({ page: 1, limit: 10 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-500">Loading notifications...</div>;
  if (isError) return <div className="p-4 text-center text-sm text-red-500">Failed to load notifications</div>;

  const notifications = data?.data || [];

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (onClose) onClose();
  };

  if (notifications.length === 0) {
    return <div className="p-8 text-center text-sm text-gray-500">You have no notifications.</div>;
  }

  return (
    <div>
      <div className="p-2 border-b border-gray-100 flex justify-end bg-white">
        <button 
          onClick={() => markAllAsRead.mutate()} 
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2"
        >
          Mark all as read
        </button>
      </div>
      <ul className="divide-y divide-gray-100">
        {notifications.map(notification => (
          <li 
            key={notification.id} 
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-indigo-50/30' : 'bg-white'}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex justify-between items-start">
              <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                {notification.message}
              </p>
              {!notification.isRead && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0"></span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
