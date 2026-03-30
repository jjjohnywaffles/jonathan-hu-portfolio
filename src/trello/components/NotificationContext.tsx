import React, { createContext, useContext, useState, useCallback, useRef, memo } from 'react';
import type { FC, ReactNode } from 'react';
import { mockNow } from '@trello/_lib/shims/time';

type NotificationType = 'archive' | 'unarchive' | 'info' | 'success' | 'filter';

type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  onUndo?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  duration?: number;
};

type NotificationContextValue = {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => string;
  hideNotification: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

type NotificationProviderProps = {
  children: ReactNode;
};

export const NotificationProvider: FC<NotificationProviderProps> = memo(
  function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const hideTimersRef = useRef<Map<string, number>>(new Map());

    const hideNotification = useCallback((id: string) => {
      const timers = hideTimersRef.current;
      const existingTimerId = timers.get(id);
      if (existingTimerId != null) {
        clearTimeout(existingTimerId);
        timers.delete(id);
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const showNotification = useCallback(
      (notification: Omit<Notification, 'id'>) => {
        const duration = notification.duration ?? 7000;
        const timers = hideTimersRef.current;

        // If we're showing an archive notification and one already exists,
        // keep the same toast (same id), just update its content and reset the timer.
        if (notification.type === 'archive') {
          const existingArchive = notifications.find((n) => n.type === 'archive');
          if (existingArchive) {
            const id = existingArchive.id;

            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, ...notification, id, duration } : n))
            );

            // Reset the auto-hide timer for this existing toast
            const existingTimerId = timers.get(id);
            if (existingTimerId != null) {
              clearTimeout(existingTimerId);
            }
            if (duration > 0) {
              const timerId = window.setTimeout(() => {
                hideNotification(id);
              }, duration);
              timers.set(id, timerId);
            } else {
              timers.delete(id);
            }
            return id;
          }
        }

        // If we're showing a filter notification and one already exists,
        // keep the same toast (same id), just update its content and reset the timer.
        if (notification.type === 'filter') {
          const existingFilter = notifications.find((n) => n.type === 'filter');
          if (existingFilter) {
            const id = existingFilter.id;

            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, ...notification, id, duration } : n))
            );

            // Reset the auto-hide timer for this existing toast
            const existingTimerId = timers.get(id);
            if (existingTimerId != null) {
              clearTimeout(existingTimerId);
            }
            if (duration > 0) {
              const timerId = window.setTimeout(() => {
                hideNotification(id);
              }, duration);
              timers.set(id, timerId);
            } else {
              timers.delete(id);
            }
            return id;
          }
        }

        // Otherwise, create a new notification as usual
        const id = `notification-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
        const newNotification: Notification = {
          ...notification,
          id,
          duration,
        };

        setNotifications((prev) => [...prev, newNotification]);

        // Auto-hide notification after duration (including those with undo actions)
        if (duration > 0) {
          const timerId = window.setTimeout(() => {
            hideNotification(id);
          }, duration);
          timers.set(id, timerId);
        }

        return id;
      },
      [hideNotification, notifications]
    );

    return (
      <NotificationContext.Provider value={{ notifications, showNotification, hideNotification }}>
        {children}
      </NotificationContext.Provider>
    );
  }
);
