import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { IconDescription } from '../icons/card-modal/icon-description';
import { FlexContainer, Button, Text } from '../ui';
import { useTrelloOperations } from '@trello/_lib/selectors';
import type { Card } from '@trello/_lib/types';

type CardDescriptionProps = {
  card: Card;
};

const CardDescription: FC<CardDescriptionProps> = function CardDescription({ card }) {
  const { updateCard } = useTrelloOperations();
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(card?.description ?? '');
  const hasDescription = Boolean(card?.description?.trim());

  const handleSave = () => {
    const trimmedValue = currentValue.trim();
    updateCard({
      cardId: card.id,
      updates: { description: trimmedValue || undefined },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(card?.description ?? '');
    setIsEditing(false);
  };

  // Sync currentValue when card description changes (e.g., after save)
  useEffect(() => {
    if (!isEditing) {
      setCurrentValue(card?.description ?? '');
    }
  }, [card?.description, isEditing]);

  return (
    <section className="mb-6">
      <div
        className={`mb-2 flex items-center ${hasDescription ? 'justify-between' : 'justify-start'}`}
      >
        <FlexContainer align="center" gap="2">
          <IconDescription className="h-5 w-5 text-gray-600" />
          <Text variant="body" className="font-semibold text-gray-800">
            Description
          </Text>
        </FlexContainer>
        {hasDescription && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none"
            style={{
              visibility: isEditing ? 'hidden' : 'visible',
            }}
          >
            Edit
          </button>
        )}
      </div>

      <div className="ml-7">
        {isEditing ? (
          <>
            <div className="w-full max-w-[600px] rounded-sm border-2 border-gray-400 bg-white">
              <textarea
                autoFocus
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="min-h-[100px] w-full resize-none border-none p-3 text-sm text-gray-700 focus:outline-none"
                placeholder="Add a more detailed description..."
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancel();
                  }
                }}
                style={{
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}
              />
            </div>
            <FlexContainer gap="2" className="mt-2">
              <Button onClick={handleSave} variant="blue" size="sm">
                Save
              </Button>
              <Button onClick={handleCancel} variant="ghost" size="sm">
                Cancel
              </Button>
            </FlexContainer>
          </>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={`min-h-[40px] w-full max-w-[600px] cursor-pointer p-3 text-sm text-gray-700 ${
              !card?.description
                ? 'rounded-sm border-2 border-gray-400 bg-white hover:bg-gray-50'
                : ''
            }`}
          >
            {card?.description ? (
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {card.description}
              </div>
            ) : (
              <Text variant="body" className="text-gray-500">
                Add a more detailed description...
              </Text>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export { CardDescription };
