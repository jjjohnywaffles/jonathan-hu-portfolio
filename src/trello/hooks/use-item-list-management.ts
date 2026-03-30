// Reusable hook for managing lists of items with add, edit, and remove functionality
import { useState, useRef, useEffect, useCallback } from 'react';

type UseItemListManagementOptions = {
  onAddItem: (text: string) => void;
  onEditItem: (index: number, text: string) => void;
  onRemoveItem: (index: number) => void;
};

export function useItemListManagement({
  onAddItem,
  onEditItem,
  onRemoveItem,
}: UseItemListManagementOptions) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  const addItemInputRef = useRef<HTMLTextAreaElement>(null);
  const editItemInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when adding or editing item
  useEffect(() => {
    if (isAddingItem && addItemInputRef.current) {
      addItemInputRef.current.focus();
    }
  }, [isAddingItem]);

  // Auto-resize add item textarea
  useEffect(() => {
    if (addItemInputRef.current) {
      addItemInputRef.current.style.height = 'auto';
      addItemInputRef.current.style.height = `${addItemInputRef.current.scrollHeight}px`;
    }
  }, [newItemText]);

  // Focus and auto-resize edit item textarea
  useEffect(() => {
    if (editingItemIndex !== null && editItemInputRef.current) {
      editItemInputRef.current.focus();
      editItemInputRef.current.select();
    }
  }, [editingItemIndex]);

  // Auto-resize edit item textarea when text changes
  useEffect(() => {
    if (editItemInputRef.current) {
      editItemInputRef.current.style.height = 'auto';
      editItemInputRef.current.style.height = `${editItemInputRef.current.scrollHeight}px`;
    }
  }, [editingItemText]);

  const startAddingItem = useCallback(() => {
    setIsAddingItem(true);
    setEditingItemIndex(null); // Close edit form if open
    setEditingItemText('');
  }, []);

  const saveNewItem = useCallback(() => {
    const text = newItemText.trim();
    if (text) {
      onAddItem(text);
      // Keep the add input open for rapid entry (like card creation)
      setNewItemText('');
      setIsAddingItem(true);
      // Reset textarea height and refocus
      setTimeout(() => {
        if (addItemInputRef.current) {
          addItemInputRef.current.style.height = 'auto';
          addItemInputRef.current.focus();
        }
      }, 0);
      return;
    }
    // If nothing to add, keep the input open (do not close on empty Enter)
    setIsAddingItem(true);
  }, [newItemText, onAddItem]);

  const cancelAddItem = useCallback(() => {
    setNewItemText('');
    setIsAddingItem(false);
  }, []);

  const closeAddItem = useCallback(() => {
    // Close without clearing text
    setIsAddingItem(false);
  }, []);

  const startEditingItem = useCallback((index: number, currentText: string) => {
    setEditingItemIndex(index);
    setEditingItemText(currentText);
    setIsAddingItem(false); // Close add form if open
  }, []);

  const saveEditedItem = useCallback(() => {
    if (editingItemIndex !== null && editingItemText.trim()) {
      onEditItem(editingItemIndex, editingItemText.trim());
    }
    setEditingItemIndex(null);
    setEditingItemText('');
  }, [editingItemIndex, editingItemText, onEditItem]);

  const cancelEditItem = useCallback(() => {
    setEditingItemIndex(null);
    setEditingItemText('');
  }, []);

  const removeItem = useCallback(
    (index: number) => {
      onRemoveItem(index);
      // If we were editing this item, close the edit form
      if (editingItemIndex === index) {
        setEditingItemIndex(null);
        setEditingItemText('');
      }
    },
    [editingItemIndex, onRemoveItem]
  );

  const handleAddKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveNewItem();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelAddItem();
      }
    },
    [saveNewItem, cancelAddItem]
  );

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEditedItem();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditItem();
      }
    },
    [saveEditedItem, cancelEditItem]
  );

  return {
    // Adding state
    isAddingItem,
    newItemText,
    setNewItemText,
    addItemInputRef,
    startAddingItem,
    saveNewItem,
    cancelAddItem,
    closeAddItem,
    handleAddKeyDown,

    // Editing state
    editingItemIndex,
    editingItemText,
    setEditingItemText,
    editItemInputRef,
    startEditingItem,
    saveEditedItem,
    cancelEditItem,
    handleEditKeyDown,

    // Remove functionality
    removeItem,
  };
}
