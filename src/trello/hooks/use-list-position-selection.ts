// Reusable hook for list and position selection logic used in card movement and copying modals
import { useState, useEffect, useMemo } from 'react';
import { useListCards } from '@trello/_lib/selectors';

type UseListPositionSelectionOptions = {
  currentCardId?: string;
  currentListId?: string;
  isOpen: boolean;
};

export function useListPositionSelection({
  currentCardId,
  currentListId,
  isOpen,
}: UseListPositionSelectionOptions) {
  const [selectedListId, setSelectedListId] = useState(currentListId ?? '');
  const [selectedPosition, setSelectedPosition] = useState(1);
  const [selectedView, setSelectedView] = useState<'inbox' | 'board'>('board');

  // Get cards in the selected list to determine available positions
  const selectedListCards = useListCards(selectedListId);
  const currentListCards = useListCards(currentListId ?? '');
  const inboxCards = useListCards('inbox');

  // Compute current position of the card
  const currentPosition = useMemo(() => {
    if (!currentCardId || !currentListId) return 1;
    const currentIndex = currentListCards.findIndex((c) => c.id === currentCardId);
    return currentIndex + 1;
  }, [currentCardId, currentListId, currentListCards]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && currentListId) {
      setSelectedListId(currentListId);
      setSelectedPosition(currentPosition);
      setSelectedView('board');
    }
  }, [isOpen, currentListId, currentPosition]);

  // Update selected position when list changes (but not when modal first opens)
  useEffect(() => {
    if (currentListId && selectedListId && selectedListId !== currentListId) {
      // Different list - default to end
      setSelectedPosition(selectedListCards.length + 1);
    }
  }, [selectedListId, currentListId, selectedListCards.length]);

  // Reset position when switching views
  useEffect(() => {
    if (selectedView === 'inbox') {
      // Inbox positions should be limited to existing count (min 1 when empty)
      const maxPos = inboxCards.length === 0 ? 1 : inboxCards.length;
      setSelectedPosition(maxPos);
    } else {
      setSelectedPosition(1); // Default to position 1 for board view
    }
  }, [selectedView, inboxCards.length]);

  // Generate position options based on selected list
  const positionOptions = useMemo(() => {
    const targetCards = selectedView === 'inbox' ? inboxCards : selectedListCards;
    const maxPositions =
      selectedView === 'inbox'
        ? targetCards.length === 0
          ? 1
          : targetCards.length
        : targetCards.length + 1; // non-inbox still allows end position

    return Array.from({ length: maxPositions }, (_, i) => ({
      value: i + 1,
      label: i + 1,
    }));
  }, [selectedView, inboxCards, selectedListCards]);

  // Check if the current selection would be a no-op (same list and position)
  const isNoOp = useMemo(() => {
    if (selectedView === 'inbox') {
      return currentListId === 'inbox' && selectedPosition === currentPosition;
    }
    return selectedListId === currentListId && selectedPosition === currentPosition;
  }, [selectedView, selectedListId, currentListId, selectedPosition, currentPosition]);

  return {
    selectedListId,
    setSelectedListId,
    selectedPosition,
    setSelectedPosition,
    selectedView,
    setSelectedView,
    positionOptions,
    currentPosition,
    isNoOp,
    selectedListCards,
    inboxCards,
  };
}
