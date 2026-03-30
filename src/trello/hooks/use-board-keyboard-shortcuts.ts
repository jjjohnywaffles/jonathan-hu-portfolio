import { useEffect } from 'react';
import { useTrelloUI } from '../components/TrelloUIContext';
import { useTrelloOperations } from '@trello/_lib/selectors';

export function useBoardKeyboardShortcuts() {
  const { hoveredListId, isAddingList } = useTrelloUI();
  const { toggleListCollapse } = useTrelloOperations();

  // Add keyboard shortcut support for toggling list collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when adding a list or when no list is hovered
      if (!hoveredListId || isAddingList) return;

      // Toggle list collapse with backslash key
      if (e.key === '\\') {
        e.preventDefault();
        toggleListCollapse({ listId: hoveredListId });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hoveredListId, isAddingList, toggleListCollapse]);
}
