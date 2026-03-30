import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useTrelloOperations } from '@trello/_lib/selectors';

type CardTitleProps = {
  cardId: string;
  title: string;
  className?: string;
  allowWrapping?: boolean;
};

const CardTitle: FC<CardTitleProps> = function CardTitle({
  cardId,
  title,
  className = '-mx-2 -my-1 cursor-pointer rounded px-2 py-1 text-3xl font-semibold text-gray-800 hover:bg-gray-50 whitespace-pre-wrap',
  allowWrapping = false,
}) {
  const { updateCard } = useTrelloOperations();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);

  useEffect(() => {
    if (!isEditing) {
      setValue(title);
    }
  }, [title, isEditing]);

  if (isEditing) {
    return (
      <textarea
        autoFocus
        rows={1}
        value={value}
        className="m-0 -mx-2 -my-1 box-border block w-full resize-none overflow-hidden rounded border-0 bg-transparent px-2 py-1 text-3xl leading-9 font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
        style={{ minHeight: '44px', boxSizing: 'border-box' }}
        onBlur={(e) => {
          const trimmed = value.trim();
          if (trimmed.length === 0) {
            setValue(title);
            setIsEditing(false);
            return;
          }
          if (trimmed !== title) {
            updateCard({ cardId, updates: { title: trimmed } });
          }
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setValue(title);
            setIsEditing(false);
          }
        }}
        onFocus={(e) => {
          // Set height to match content on focus
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <h1
      className={`${className} m-0 box-border block leading-9`}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      style={
        allowWrapping
          ? {
              // Allow natural wrapping when sidebar is hidden
              whiteSpace: 'pre-wrap',
              wordBreak: 'normal',
              overflowWrap: 'break-word',
              minHeight: '44px',
              boxSizing: 'border-box',
            }
          : {
              // Preserve explicit newlines and allow wrapping to ideal width; clip on overflow
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
              width: 'var(--card-title-ideal-width, 652px)',
              wordBreak: 'normal',
              overflowWrap: 'normal',
              minHeight: '44px',
              boxSizing: 'border-box',
            }
      }
    >
      {title}
    </h1>
  );
};

export { CardTitle };
