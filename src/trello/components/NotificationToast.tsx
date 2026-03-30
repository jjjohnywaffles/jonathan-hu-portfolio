import React, { memo, useEffect, useState, useRef } from 'react';
import type { FC } from 'react';
import { useNotifications } from './NotificationContext';
import { IconNotification } from './icons/system/icon-notification';
import { IconCheckmark } from './icons/card/icon-checkmark';
import { IconFilter } from './icons/header/icon-filter';
import { FlexContainer, Button, Text, IconButton } from './ui';

const NotificationToast: FC = memo(function NotificationToast() {
  const { notifications, hideNotification } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<Set<string>>(new Set());
  const notificationRefs = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    // Store notification data for exiting animations
    notifications.forEach((notification) => {
      notificationRefs.current.set(notification.id, notification);
    });

    // Add new notifications with a slight delay for animation
    notifications.forEach((notification) => {
      if (!visibleNotifications.has(notification.id)) {
        setTimeout(() => {
          setVisibleNotifications((prev) => new Set(prev).add(notification.id));
        }, 50);
      }
    });

    // Handle notifications that should exit
    const currentIds = notifications.map((n) => n.id);
    const currentVisible = Array.from(visibleNotifications);

    currentVisible.forEach((id) => {
      if (!currentIds.includes(id)) {
        // Start exit animation by removing from visible
        setVisibleNotifications((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });

        // Clean up after animation completes
        setTimeout(() => {
          notificationRefs.current.delete(id);
        }, 350);
      }
    });
  }, [notifications, visibleNotifications]);

  // Get all notifications that should be rendered
  const allNotifications = Array.from(notificationRefs.current.values());

  if (allNotifications.length === 0) return null;

  return (
    <FlexContainer direction="col" gap="3" className="fixed bottom-6 left-6 z-50">
      {allNotifications.map((notification, index) => (
        <FlexContainer
          key={notification.id}
          align="start"
          gap="4"
          className={`transform rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-lg transition-all duration-300 ease-out ${
            visibleNotifications.has(notification.id)
              ? 'translate-x-0 opacity-100'
              : '-translate-x-full opacity-0'
          } `}
          style={{
            transitionDelay: visibleNotifications.has(notification.id) ? index * 50 + 'ms' : '0ms',
            minWidth: '280px',
            maxWidth: '420px',
          }}
        >
          {/* Icon */}
          <div
            className={
              notification.type === 'filter' ? 'mt-1 flex-shrink-0' : 'mt-0.5 flex-shrink-0'
            }
          >
            {notification.type === 'success' ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-green-500">
                <IconCheckmark className="h-4 w-4 text-green-500" />
              </div>
            ) : notification.type === 'filter' ? (
              <IconFilter className="h-4 w-4 text-gray-600" />
            ) : (
              <IconNotification className="h-6 w-6 text-gray-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div
              className={
                notification.type === 'filter'
                  ? 'text-sm font-bold text-gray-800'
                  : 'text-sm text-gray-800'
              }
            >
              {notification.message}
            </div>
            {notification.onAction && notification.actionLabel && (
              <button
                onClick={() => {
                  notification.onAction?.();
                  hideNotification(notification.id);
                }}
                className="mt-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {notification.actionLabel}
              </button>
            )}

            {/* Undo button for archive notifications */}
            {notification.onUndo && (
              <div className="mt-3">
                <Button
                  onClick={() => {
                    notification.onUndo?.();
                    hideNotification(notification.id);
                  }}
                  variant="secondary"
                  size="default"
                  className="bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300"
                >
                  Undo
                </Button>
              </div>
            )}
          </div>

          {/* Close button */}
          <IconButton
            onClick={() => hideNotification(notification.id)}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Close notification"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </IconButton>
        </FlexContainer>
      ))}
    </FlexContainer>
  );
});

export { NotificationToast };
