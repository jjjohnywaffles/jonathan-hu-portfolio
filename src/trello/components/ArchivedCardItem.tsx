import React, { memo } from 'react';
import type { FC } from 'react';
import { ArchivedCardDisplay, type ArchivedCard } from './Board/ArchivedCardDisplay';

type ArchivedCardItemProps = {
  card: ArchivedCard;
  onRestore: (cardId: string) => void;
  onDelete: (cardId: string, buttonElement: HTMLElement) => void;
  onToggleComplete: (cardId: string) => void;
  onCardClick?: (cardId: string) => void;
  variant?: 'board' | 'inbox';
};

const ArchivedCardItem: FC<ArchivedCardItemProps> = memo(function ArchivedCardItem({
  card,
  onRestore,
  onDelete,
  onToggleComplete,
  onCardClick,
  variant = 'board',
}) {
  const content = (
    <div className="space-y-2">
      {/* Archived Card Display with hover animation */}
      <ArchivedCardDisplay
        card={card}
        onToggleComplete={onToggleComplete}
        onClick={onCardClick ? () => onCardClick(card.id) : undefined}
      />

      {/* Actions underneath */}
      <div className="px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRestore(card.id)}
            className="text-sm font-medium text-gray-500 underline transition-colors hover:text-blue-600"
          >
            Restore
          </button>
          <span className="text-gray-300">•</span>
          <button
            onClick={(e) => onDelete(card.id, e.currentTarget)}
            className="text-sm font-medium text-gray-500 underline transition-colors hover:text-blue-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  // Wrap in container for inbox variant
  if (variant === 'inbox') {
    return <div className="rounded-lg bg-gray-100 p-3">{content}</div>;
  }

  return content;
});

export { ArchivedCardItem };
