import { useState, useCallback } from 'react';

// Checklist modal data type (contains React refs)
export type ChecklistModalData = {
  checklistId: string;
  itemIndex: number;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
};

// Custom hook for managing checklist modal states
export function useChecklistModals() {
  const [assignModalData, setAssignModalData] = useState<ChecklistModalData | null>(null);
  const [dueDateModalData, setDueDateModalData] = useState<ChecklistModalData | null>(null);
  const [actionModalData, setActionModalData] = useState<ChecklistModalData | null>(null);

  const handleOpenAssignModal = useCallback(
    (
      checklistId: string,
      itemIndex: number,
      buttonRef: React.RefObject<HTMLButtonElement | null>
    ) => {
      setAssignModalData((curr) => {
        // Toggle if already open for same target
        if (curr && curr.checklistId === checklistId && curr.itemIndex === itemIndex) {
          return null;
        }
        return { checklistId, itemIndex, buttonRef };
      });
    },
    []
  );

  const handleCloseAssignModal = useCallback(() => {
    setAssignModalData(null);
  }, []);

  const handleOpenDueDateModal = useCallback(
    (
      checklistId: string,
      itemIndex: number,
      buttonRef: React.RefObject<HTMLButtonElement | null>
    ) => {
      setDueDateModalData((curr) => {
        if (curr && curr.checklistId === checklistId && curr.itemIndex === itemIndex) {
          return null;
        }
        return { checklistId, itemIndex, buttonRef };
      });
    },
    []
  );

  const handleCloseDueDateModal = useCallback(() => {
    setDueDateModalData(null);
  }, []);

  const handleOpenActionModal = useCallback(
    (
      checklistId: string,
      itemIndex: number,
      buttonRef: React.RefObject<HTMLButtonElement | null>
    ) => {
      setActionModalData((curr) => {
        if (curr && curr.checklistId === checklistId && curr.itemIndex === itemIndex) {
          return null;
        }
        return { checklistId, itemIndex, buttonRef };
      });
    },
    []
  );

  const handleCloseActionModal = useCallback(() => {
    setActionModalData(null);
  }, []);

  return {
    assignModalData,
    dueDateModalData,
    actionModalData,
    handleOpenAssignModal,
    handleCloseAssignModal,
    handleOpenDueDateModal,
    handleCloseDueDateModal,
    handleOpenActionModal,
    handleCloseActionModal,
  };
}
