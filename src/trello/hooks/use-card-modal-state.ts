// Comprehensive hook that manages all card modal state including visibility, sidebar, modals, and user interactions for the unified card modal system
import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { useModalClickOutside } from './use-modal-click-outside';

export function useCardModalState(cardId: string) {
  // UI state
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Modal states
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveModalOpenedFromActionModal, setMoveModalOpenedFromActionModal] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isMirrorModalOpen, setIsMirrorModalOpen] = useState(false);
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const [labelsModalOpenedFromAddButton, setLabelsModalOpenedFromAddButton] = useState(false);
  const [isCreateLabelModalOpen, setIsCreateLabelModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistModalOpenedFromAddButton, setChecklistModalOpenedFromAddButton] = useState(false);
  const [isAddToCardModalOpen, setIsAddToCardModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarModalOpenedFromAddButton, setCalendarModalOpenedFromAddButton] = useState(false);
  const [isCustomFieldCalendarModalOpen, setIsCustomFieldCalendarModalOpen] = useState(false);
  const [customFieldCalendarData, setCustomFieldCalendarData] = useState<{
    fieldId: string;
    fieldName: string;
    currentValue?: string;
    buttonRef?: HTMLButtonElement | null;
  } | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [membersModalOpenedFromAddButton, setMembersModalOpenedFromAddButton] = useState(false);
  const [isAssignChecklistModalOpen, setIsAssignChecklistModalOpen] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [customFieldModalOpenedFromAddButton, setCustomFieldModalOpenedFromAddButton] =
    useState(false);

  // Modal trigger refs and state tracking
  const [moveModalTriggerRef, setMoveModalTriggerRef] = useState<
    React.RefObject<HTMLButtonElement | null> | undefined
  >(undefined);
  const [copyModalTriggerRef, setCopyModalTriggerRef] = useState<
    React.RefObject<HTMLButtonElement | null> | undefined
  >(undefined);
  const [mirrorModalTriggerRef, setMirrorModalTriggerRef] = useState<
    React.RefObject<HTMLButtonElement | null> | undefined
  >(undefined);
  const [editingLabelId, setEditingLabelId] = useState<string | undefined>(undefined);
  // standalone active field editor removed; inline editing used in CustomFieldModal

  // Color picker state
  // inline color picker handled within CustomFieldModal

  // Refs for modal positioning and click handling
  const modalRef = useRef<HTMLDivElement>(null);
  const bottomNavRef = useRef<HTMLDivElement>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const checklistButtonRef = useRef<HTMLButtonElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const labelsButtonRef = useRef<HTMLButtonElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const dueDateBadgeRef = useRef<HTMLButtonElement>(null);
  const labelsContainerRef = useRef<HTMLDivElement>(null);
  const labelsTitleRef = useRef<HTMLDivElement>(null);
  const labelsModalRef = useRef<HTMLDivElement>(null);
  const labelsModalPositionRef = useRef<{ top: number; left: number } | null>(null);
  const createLabelModalRef = useRef<HTMLDivElement>(null);
  const createLabelButtonRef = useRef<HTMLButtonElement>(null);
  // Remember if the labels modal was open when launching the label editor so we can restore it on back navigation
  const shouldRestoreLabelsModalRef = useRef(false);
  const membersButtonRef = useRef<HTMLButtonElement>(null);
  const membersGadgetButtonRef = useRef<HTMLButtonElement>(null);
  const membersModalRef = useRef<HTMLDivElement>(null);
  const assignChecklistButtonRef = useRef<HTMLButtonElement>(null);
  const assignChecklistModalRef = useRef<HTMLDivElement>(null);
  const createTemplateButtonRef = useRef<HTMLButtonElement>(null);
  const createTemplateModalRef = useRef<HTMLDivElement>(null);
  const customFieldButtonRef = useRef<HTMLButtonElement>(null);
  const customFieldEditButtonRef = useRef<HTMLButtonElement>(null);
  const customFieldModalRef = useRef<HTMLDivElement>(null);
  // removed standalone editor/color picker refs

  // Race condition protection refs
  const wasMoveModalOpenRef = useRef(false);
  const wasActionModalOpenRef = useRef(false);
  const wasCopyModalOpenRef = useRef(false);
  const wasMirrorModalOpenRef = useRef(false);

  // Pending archive state (for regular cards only)
  const [pendingArchiveTimestamp, setPendingArchiveTimestamp] = useState<string | null>(null);

  // Track modal state changes for race condition protection
  useEffect(() => {
    wasMoveModalOpenRef.current = isMoveModalOpen;
    // Reset the flag when move modal closes
    if (!isMoveModalOpen) {
      setMoveModalOpenedFromActionModal(false);
    }
  }, [isMoveModalOpen]);

  useEffect(() => {
    wasActionModalOpenRef.current = isActionModalOpen;
  }, [isActionModalOpen]);

  useEffect(() => {
    wasCopyModalOpenRef.current = isCopyModalOpen;
  }, [isCopyModalOpen]);

  useEffect(() => {
    wasMirrorModalOpenRef.current = isMirrorModalOpen;
  }, [isMirrorModalOpen]);

  // Modal handlers
  const handleOpenMoveModal = (triggerRef?: React.RefObject<HTMLButtonElement | null>) => {
    // Toggle if already open
    if (isMoveModalOpen) {
      setIsMoveModalOpen(false);
      return;
    }
    setMoveModalTriggerRef(triggerRef ?? actionButtonRef);
    // Track if opened from action modal
    setMoveModalOpenedFromActionModal(isActionModalOpen);
    setIsMoveModalOpen(true);
  };

  const handleOpenCopyModal = () => {
    if (isCopyModalOpen) {
      setIsCopyModalOpen(false);
      return;
    }
    setCopyModalTriggerRef(actionButtonRef);
    setIsCopyModalOpen(true);
  };

  const handleOpenMirrorModal = () => {
    if (isMirrorModalOpen) {
      setIsMirrorModalOpen(false);
      return;
    }
    setMirrorModalTriggerRef(actionButtonRef);
    setIsMirrorModalOpen(true);
  };

  const captureLabelsModalPosition = () => {
    const rect = labelsModalRef.current?.getBoundingClientRect();
    if (rect) {
      labelsModalPositionRef.current = { top: rect.top, left: rect.left };
      return;
    }
    labelsModalPositionRef.current = null;
  };

  const handleOpenLabelsModalFromAddButton = () => {
    if (isLabelsModalOpen) {
      handleCloseLabelsModal();
      return;
    }
    setLabelsModalOpenedFromAddButton(true);
    setIsLabelsModalOpen(true);
  };

  const handleOpenLabelsModalFromElsewhere = () => {
    if (isLabelsModalOpen) {
      handleCloseLabelsModal();
      return;
    }
    setLabelsModalOpenedFromAddButton(false);
    setIsLabelsModalOpen(true);
  };

  const handleCloseLabelsModal = () => {
    setIsLabelsModalOpen(false);
    setLabelsModalOpenedFromAddButton(false);
    shouldRestoreLabelsModalRef.current = false;
  };

  const handleOpenCreateLabelModal = (buttonRef?: React.RefObject<HTMLButtonElement | null>) => {
    captureLabelsModalPosition();
    shouldRestoreLabelsModalRef.current = isLabelsModalOpen;
    setIsLabelsModalOpen(false);
    setIsCreateLabelModalOpen(true);
    setEditingLabelId(undefined);

    // Store the button reference for positioning
    if (buttonRef && buttonRef.current) {
      createLabelButtonRef.current = buttonRef.current;
    }
  };

  const handleOpenEditLabelModal = (labelId: string, buttonElement?: HTMLButtonElement) => {
    captureLabelsModalPosition();
    shouldRestoreLabelsModalRef.current = isLabelsModalOpen;
    setIsLabelsModalOpen(false);
    setIsCreateLabelModalOpen(true);
    setEditingLabelId(labelId);

    // No need to store button reference since we position on top of labels modal
  };

  const handleCloseCreateLabelModal = () => {
    setIsCreateLabelModalOpen(false);
    setEditingLabelId(undefined);
    shouldRestoreLabelsModalRef.current = false;
  };

  const handleBackFromCreateLabel = () => {
    setIsCreateLabelModalOpen(false);
    setEditingLabelId(undefined);
    if (shouldRestoreLabelsModalRef.current) {
      setIsLabelsModalOpen(true);
    }
    shouldRestoreLabelsModalRef.current = false;
  };

  const handleOpenChecklistModalFromAddButton = () => {
    if (isChecklistModalOpen) {
      handleCloseChecklistModal();
      return;
    }
    setChecklistModalOpenedFromAddButton(true);
    setIsChecklistModalOpen(true);
  };

  const handleOpenChecklistModalFromElsewhere = () => {
    if (isChecklistModalOpen) {
      handleCloseChecklistModal();
      return;
    }
    setChecklistModalOpenedFromAddButton(false);
    setIsChecklistModalOpen(true);
  };

  const handleCloseChecklistModal = () => {
    setIsChecklistModalOpen(false);
    setChecklistModalOpenedFromAddButton(false);
  };

  const handleOpenAddToCardModal = () => {
    setIsAddToCardModalOpen((open) => !open);
  };

  const handleCloseAddToCardModal = () => {
    setIsAddToCardModalOpen(false);
  };

  const handleOpenCalendarModalFromAddButton = () => {
    if (isCalendarModalOpen) {
      handleCloseCalendarModal();
      return;
    }
    setCalendarModalOpenedFromAddButton(true);
    setIsCalendarModalOpen(true);
  };

  const handleOpenCalendarModalFromElsewhere = () => {
    if (isCalendarModalOpen) {
      handleCloseCalendarModal();
      return;
    }
    setCalendarModalOpenedFromAddButton(false);
    setIsCalendarModalOpen(true);
  };

  const handleCloseCalendarModal = () => {
    setIsCalendarModalOpen(false);
    setCalendarModalOpenedFromAddButton(false);
  };

  const handleOpenCustomFieldCalendarModal = (
    fieldId: string,
    fieldName: string,
    currentValue?: string,
    buttonRef?: HTMLButtonElement | null
  ) => {
    setCustomFieldCalendarData({ fieldId, fieldName, currentValue, buttonRef });
    setIsCustomFieldCalendarModalOpen(true);
  };

  const handleCloseCustomFieldCalendarModal = () => {
    setIsCustomFieldCalendarModalOpen(false);
    setCustomFieldCalendarData(null);
  };

  const handleOpenMembersModalFromAddButton = () => {
    if (isMembersModalOpen) {
      handleCloseMembersModal();
      return;
    }
    setMembersModalOpenedFromAddButton(true);
    setIsMembersModalOpen(true);
  };

  const handleOpenMembersModalFromElsewhere = () => {
    if (isMembersModalOpen) {
      handleCloseMembersModal();
      return;
    }
    setMembersModalOpenedFromAddButton(false);
    setIsMembersModalOpen(true);
  };

  const handleCloseMembersModal = () => {
    setIsMembersModalOpen(false);
    setMembersModalOpenedFromAddButton(false);
  };

  const handleOpenAssignChecklistModal = () => {
    setIsAssignChecklistModalOpen(true);
  };

  const handleCloseAssignChecklistModal = () => {
    setIsAssignChecklistModalOpen(false);
  };

  const handleOpenCreateTemplateModal = () => {
    setIsCreateTemplateModalOpen((open) => !open);
  };

  const handleCloseCreateTemplateModal = () => {
    setIsCreateTemplateModalOpen(false);
  };

  const handleOpenCustomFieldModalFromAddButton = () => {
    if (isCustomFieldModalOpen) {
      handleCloseCustomFieldModal();
      return;
    }
    setCustomFieldModalOpenedFromAddButton(true);
    setIsCustomFieldModalOpen(true);
  };

  const handleOpenCustomFieldModal = () => {
    if (isCustomFieldModalOpen) {
      handleCloseCustomFieldModal();
      return;
    }
    setCustomFieldModalOpenedFromAddButton(false);
    setIsCustomFieldModalOpen(true);
  };

  const handleCloseCustomFieldModal = () => {
    setIsCustomFieldModalOpen(false);
    setCustomFieldModalOpenedFromAddButton(false);
  };

  // removed standalone active field editor handlers

  // removed card-level color picker handlers

  const handleOpenActionModal = () => {
    setIsActionModalOpen(true);
  };

  return {
    // UI state
    isSidebarVisible,
    setIsSidebarVisible,
    showDetails,
    setShowDetails,

    // Modal states
    isMoveModalOpen,
    setIsMoveModalOpen,
    moveModalOpenedFromActionModal,
    isActionModalOpen,
    setIsActionModalOpen,
    isCopyModalOpen,
    setIsCopyModalOpen,
    isMirrorModalOpen,
    setIsMirrorModalOpen,
    isLabelsModalOpen,
    setIsLabelsModalOpen,
    labelsModalOpenedFromAddButton,
    isCreateLabelModalOpen,
    setIsCreateLabelModalOpen,
    isChecklistModalOpen,
    setIsChecklistModalOpen,
    checklistModalOpenedFromAddButton,
    isAddToCardModalOpen,
    setIsAddToCardModalOpen,
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    calendarModalOpenedFromAddButton,
    isCustomFieldCalendarModalOpen,
    setIsCustomFieldCalendarModalOpen,
    customFieldCalendarData,
    setCustomFieldCalendarData,
    isMembersModalOpen,
    setIsMembersModalOpen,
    membersModalOpenedFromAddButton,
    isAssignChecklistModalOpen,
    setIsAssignChecklistModalOpen,
    isCreateTemplateModalOpen,
    setIsCreateTemplateModalOpen,
    isCustomFieldModalOpen,
    setIsCustomFieldModalOpen,
    customFieldModalOpenedFromAddButton,

    // Modal trigger refs
    moveModalTriggerRef,
    setMoveModalTriggerRef,
    copyModalTriggerRef,
    setCopyModalTriggerRef,
    mirrorModalTriggerRef,
    setMirrorModalTriggerRef,
    editingLabelId,
    setEditingLabelId,

    // Refs
    modalRef,
    bottomNavRef,
    moveButtonRef,
    actionButtonRef,
    checklistButtonRef,
    addButtonRef,
    labelsButtonRef,
    calendarButtonRef,
    dueDateBadgeRef,
    labelsContainerRef,
    labelsTitleRef,
    labelsModalRef,
    labelsModalPositionRef,
    createLabelModalRef,
    createLabelButtonRef,
    membersButtonRef,
    membersGadgetButtonRef,
    membersModalRef,
    assignChecklistButtonRef,
    assignChecklistModalRef,
    createTemplateButtonRef,
    createTemplateModalRef,
    customFieldButtonRef,
    customFieldEditButtonRef,
    customFieldModalRef,

    // Race condition protection
    wasMoveModalOpenRef,
    wasActionModalOpenRef,
    wasCopyModalOpenRef,
    wasMirrorModalOpenRef,

    // Archive state
    pendingArchiveTimestamp,
    setPendingArchiveTimestamp,

    // Handlers
    handleOpenMoveModal,
    handleOpenCopyModal,
    handleOpenMirrorModal,
    handleOpenLabelsModalFromAddButton,
    handleOpenLabelsModalFromElsewhere,
    handleCloseLabelsModal,
    handleOpenCreateLabelModal,
    handleOpenEditLabelModal,
    handleCloseCreateLabelModal,
    handleBackFromCreateLabel,
    handleOpenChecklistModalFromAddButton,
    handleOpenChecklistModalFromElsewhere,
    handleCloseChecklistModal,
    handleOpenAddToCardModal,
    handleCloseAddToCardModal,
    handleOpenCalendarModalFromAddButton,
    handleOpenCalendarModalFromElsewhere,
    handleCloseCalendarModal,
    handleOpenCustomFieldCalendarModal,
    handleCloseCustomFieldCalendarModal,
    handleOpenMembersModalFromAddButton,
    handleOpenMembersModalFromElsewhere,
    handleCloseMembersModal,
    handleOpenAssignChecklistModal,
    handleCloseAssignChecklistModal,
    handleOpenCreateTemplateModal,
    handleCloseCreateTemplateModal,
    handleOpenCustomFieldModalFromAddButton,
    handleOpenCustomFieldModal,
    handleCloseCustomFieldModal,

    handleOpenActionModal,
  };
}
