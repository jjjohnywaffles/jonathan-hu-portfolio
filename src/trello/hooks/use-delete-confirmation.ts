import { useState, useCallback } from 'react';

type UseDeleteConfirmationReturn = {
  deleteConfirmId: string | null;
  deleteButtonElement: HTMLElement | null;
  handleDelete: (id: string, buttonElement: HTMLElement) => void;
  handleConfirmDelete: () => void;
  handleCancelDelete: () => void;
};

export function useDeleteConfirmation(
  onConfirm: (id: string) => void
): UseDeleteConfirmationReturn {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteButtonElement, setDeleteButtonElement] = useState<HTMLElement | null>(null);

  const handleDelete = useCallback((id: string, buttonElement: HTMLElement) => {
    setDeleteConfirmId(id);
    setDeleteButtonElement(buttonElement);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirmId) {
      onConfirm(deleteConfirmId);
      setDeleteConfirmId(null);
      setDeleteButtonElement(null);
    }
  }, [deleteConfirmId, onConfirm]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmId(null);
    setDeleteButtonElement(null);
  }, []);

  return {
    deleteConfirmId,
    deleteButtonElement,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
  };
}
