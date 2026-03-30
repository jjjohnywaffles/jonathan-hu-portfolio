import React, { memo } from 'react';
import type { FC } from 'react';
import { cn } from '@trello/_lib/shims/utils';
import { getUserInitials } from '@trello/utils/user-initials';

// Reusable avatar display component
export type UserAvatarProps = {
  user: { id: string; displayName: string; avatar?: string };
  size?: 'sm' | 'md';
  className?: string;
};

export const UserAvatar: FC<UserAvatarProps> = memo(function UserAvatar({
  user,
  size = 'md',
  className,
}) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
  };

  const avatarClass = cn('rounded-full', sizeClasses[size], className);
  const initials = getUserInitials(user.displayName);

  return (
    <div
      className={cn(
        avatarClass,
        'flex cursor-pointer items-center justify-center bg-gray-300 text-xs font-semibold text-gray-700'
      )}
      title={user.displayName}
    >
      {initials}
    </div>
  );
});
