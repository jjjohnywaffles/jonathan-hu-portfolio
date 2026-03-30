import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  memo,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import type { FC, ReactNode } from 'react';
import { useTrelloOperations } from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib';

// Enhanced TrelloUIContext following GCal pattern
type TrelloUIContextType = {
  // Card modal state
  activeCardModal: string | null;
  activeCardModalIsMirror: boolean;
  activeCardModalListId: string | null;
  openCardModal: (cardId: string, config?: { isMirror?: boolean; listId?: string }) => void;
  closeCardModal: () => void;

  // Board UI state
  isEditingBoardTitle: boolean;
  editingBoardTitle: string;
  startBoardTitleEdit: (currentTitle: string) => void;
  updateBoardTitleEdit: (title: string) => void;
  saveBoardTitleEdit: () => void;
  cancelBoardTitleEdit: () => void;

  // Board interaction state
  hoveredListId: string | null;
  setHoveredListId: (listId: string | null) => void;

  // Drag scrolling state
  isDragging: boolean;
  startX: number;
  scrollLeft: number;
  setDragState: (isDragging: boolean, startX?: number, scrollLeft?: number) => void;

  // Add list form state
  isAddingList: boolean;
  newListTitle: string;
  startAddingList: () => void;
  updateNewListTitle: (title: string) => void;
  cancelAddingList: () => void;
  saveNewList: () => void;
  addListFormRef: React.RefObject<HTMLDivElement | null>;
  addListInputRef: React.RefObject<HTMLInputElement | null>;

  // Board feature toggles
  toggleStarred: () => void;
  isPowerUpsActive: boolean;
  togglePowerUps: () => void;

  // Search state (for future enhancement)
  searchQuery: string;
  isSearchActive: boolean;
  setSearchQuery: (query: string) => void;
  toggleSearch: (active?: boolean) => void;

  // Sidebar state (for future enhancement)
  sidebarVisible: boolean;
  toggleSidebar: () => void;

  // Filter state (for future enhancement)
  activeFilters: string[];
  toggleFilter: (filter: string) => void;
  clearFilters: () => void;

  // Board custom fields modal state
  isBoardCustomFieldsModalOpen: boolean;
  openBoardCustomFieldsModal: (buttonElement?: HTMLElement) => void;
  closeBoardCustomFieldsModal: () => void;
  boardCustomFieldsButtonRef: React.RefObject<HTMLElement | null>;

  // Board-level field editor now inlined inside CustomFieldModal

  // Board labels modal state
  isBoardLabelsModalOpen: boolean;
  openBoardLabelsModal: () => void;
  closeBoardLabelsModal: () => void;
  boardLabelsModalRef: React.RefObject<HTMLDivElement | null>;

  // Board create label modal state (for board labels)
  isBoardCreateLabelModalOpen: boolean;
  boardEditingLabelId: string | undefined;
  openBoardCreateLabelModal: (buttonRef?: React.RefObject<HTMLButtonElement | null>) => void;
  closeBoardCreateLabelModal: () => void;
  openBoardEditLabel: (labelId: string) => void;
  boardCreateLabelButtonRef: React.RefObject<HTMLButtonElement | null>;
  boardCreateLabelModalRef: React.RefObject<HTMLDivElement | null>;

  // Board archived cards modal state
  isBoardArchivedCardsModalOpen: boolean;
  openBoardArchivedCardsModal: () => void;
  closeBoardArchivedCardsModal: () => void;

  // Board copy modal state
  isBoardCopyModalOpen: boolean;
  openBoardCopyModal: () => void;
  closeBoardCopyModal: () => void;
};

const TrelloUIContext = createContext<TrelloUIContextType | null>(null);

export const useTrelloUI = () => {
  const context = useContext(TrelloUIContext);
  if (!context) {
    throw new Error('useTrelloUI must be used within TrelloUIProvider');
  }
  return context;
};

type TrelloUIProviderProps = {
  children: ReactNode;
};

export const TrelloUIProvider: FC<TrelloUIProviderProps> = memo(function TrelloUIProvider({
  children,
}) {
  // Get backend operations
  const operations = useTrelloOperations();

  // Card modal state
  const [activeCardModal, setActiveCardModal] = useState<string | null>(null);
  const [activeCardModalIsMirror, setActiveCardModalIsMirror] = useState(false);
  const [activeCardModalListId, setActiveCardModalListId] = useState<string | null>(null);

  // Board title editing state
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [editingBoardTitle, setEditingBoardTitle] = useState('');

  // Board interaction state
  const [hoveredListId, setHoveredListId] = useState<string | null>(null);

  // Drag scrolling state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Add list form state
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const addListFormRef = useRef<HTMLDivElement | null>(null);
  const addListInputRef = useRef<HTMLInputElement | null>(null);

  // Board feature toggles
  const [isPowerUpsActive, setIsPowerUpsActive] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Sidebar state
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Board custom fields modal state
  const [isBoardCustomFieldsModalOpen, setIsBoardCustomFieldsModalOpen] = useState(false);
  const boardCustomFieldsButtonRef = useRef<HTMLElement | null>(null);

  // Board-level active field editor/color picker removed (inline editor is used)

  // Board labels modal state
  const [isBoardLabelsModalOpen, setIsBoardLabelsModalOpen] = useState(false);
  const boardLabelsModalRef = useRef<HTMLDivElement | null>(null);

  // Board create label modal state
  const [isBoardCreateLabelModalOpen, setIsBoardCreateLabelModalOpen] = useState(false);
  const [boardEditingLabelId, setBoardEditingLabelId] = useState<string | undefined>(undefined);
  const boardCreateLabelButtonRef = useRef<HTMLButtonElement | null>(null);
  const boardCreateLabelModalRef = useRef<HTMLDivElement | null>(null);

  // Board archived cards modal state
  const [isBoardArchivedCardsModalOpen, setIsBoardArchivedCardsModalOpen] = useState(false);

  // Board copy modal state
  const [isBoardCopyModalOpen, setIsBoardCopyModalOpen] = useState(false);

  // Track current board ID to close card modal on board switch
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const prevBoardIdRef = useRef(currentBoardId);

  // Close card modal when board changes
  useEffect(() => {
    if (prevBoardIdRef.current !== currentBoardId && activeCardModal) {
      setActiveCardModal(null);
      setActiveCardModalIsMirror(false);
      setActiveCardModalListId(null);
    }
    prevBoardIdRef.current = currentBoardId;
  }, [currentBoardId, activeCardModal]);

  // Close add list form when clicking outside (but preserve text)
  useEffect(() => {
    if (!isAddingList) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (addListFormRef.current && !addListFormRef.current.contains(target)) {
        setIsAddingList(false);
        // Don't clear the title - preserve it for next open
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddingList]);

  // Card modal handlers
  const openCardModal = useCallback(
    (cardId: string, config: { isMirror?: boolean; listId?: string } = {}) => {
      setActiveCardModal(cardId);
      setActiveCardModalIsMirror(config.isMirror ?? false);
      setActiveCardModalListId(config.listId ?? null);
    },
    []
  );

  const closeCardModal = useCallback(() => {
    setActiveCardModal(null);
    setActiveCardModalIsMirror(false);
    setActiveCardModalListId(null);
  }, []);

  // Board title editing handlers
  const startBoardTitleEdit = useCallback((currentTitle: string) => {
    setEditingBoardTitle(currentTitle);
    setIsEditingBoardTitle(true);
  }, []);

  const updateBoardTitleEdit = useCallback((title: string) => {
    setEditingBoardTitle(title);
  }, []);

  const saveBoardTitleEdit = useCallback(() => {
    setIsEditingBoardTitle(false);
  }, []);

  const cancelBoardTitleEdit = useCallback(() => {
    setIsEditingBoardTitle(false);
  }, []);

  // Drag state handler
  const setDragState = useCallback((isDragging: boolean, startX = 0, scrollLeft = 0) => {
    setIsDragging(isDragging);
    setStartX(startX);
    setScrollLeft(scrollLeft);
  }, []);

  // Add list handlers
  const startAddingList = useCallback(() => {
    setIsAddingList(true);
    // Scroll the form into view when opening
    setTimeout(() => {
      addListFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'end',
      });
    }, 0);
  }, []);

  const updateNewListTitle = useCallback((title: string) => {
    setNewListTitle(title);
  }, []);

  const cancelAddingList = useCallback(() => {
    setIsAddingList(false);
    setNewListTitle('');
  }, []);

  const saveNewList = useCallback(() => {
    if (newListTitle.trim()) {
      operations.addList({ title: newListTitle.trim() });
      // Clear the title but keep the form open for rapid entry (like card creation)
      setNewListTitle('');
      // Keep the form open
      setIsAddingList(true);
      // Scroll the form into view and refocus the input with smooth scroll
      setTimeout(() => {
        addListFormRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'end',
        });
        // Focus the input field with smooth scroll after a delay to avoid jarring behavior
        setTimeout(() => {
          addListInputRef.current?.focus({ preventScroll: true });
        }, 300); // Delay to allow smooth scroll to settle
      }, 0);
    }
  }, [newListTitle, operations]);

  // Board feature toggles
  const toggleStarred = useCallback(() => {
    operations.toggleBoardStar();
  }, [operations]);

  const togglePowerUps = useCallback(() => {
    setIsPowerUpsActive((prev) => !prev);
  }, []);

  // Search handlers
  const toggleSearch = useCallback(
    (active?: boolean) => {
      const newActive = active ?? !isSearchActive;
      setIsSearchActive(newActive);
      operations.setSearchActive({ isActive: newActive });
      if (!newActive) {
        setSearchQuery('');
        operations.clearSearch();
      }
    },
    [isSearchActive, operations]
  );

  const handleSearchQueryChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      operations.updateSearchQuery({ query });
    },
    [operations]
  );

  // Sidebar handlers
  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => !prev);
  }, []);

  // Filter handlers
  const toggleFilter = useCallback((filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
  }, []);

  // Board custom fields modal handlers
  const openBoardCustomFieldsModal = useCallback((buttonElement?: HTMLElement) => {
    setIsBoardCustomFieldsModalOpen(true);
    if (buttonElement) {
      boardCustomFieldsButtonRef.current = buttonElement;
    }
  }, []);

  const closeBoardCustomFieldsModal = useCallback(() => {
    setIsBoardCustomFieldsModalOpen(false);
    boardCustomFieldsButtonRef.current = null;
  }, []);

  // Removed board-level editor/color picker handlers

  // Board labels modal handlers
  const openBoardLabelsModal = useCallback(() => {
    setIsBoardLabelsModalOpen(true);
  }, []);

  const closeBoardLabelsModal = useCallback(() => {
    setIsBoardLabelsModalOpen(false);
  }, []);

  // Board create label modal handlers
  const openBoardCreateLabelModal = useCallback(
    (buttonRef?: React.RefObject<HTMLButtonElement | null>) => {
      setIsBoardCreateLabelModalOpen(true);
      if (buttonRef?.current) {
        boardCreateLabelButtonRef.current = buttonRef.current;
      }
    },
    []
  );

  const closeBoardCreateLabelModal = useCallback(() => {
    setIsBoardCreateLabelModalOpen(false);
    setBoardEditingLabelId(undefined);
  }, []);

  const openBoardEditLabel = useCallback((labelId: string) => {
    setBoardEditingLabelId(labelId);
    setIsBoardCreateLabelModalOpen(true);
  }, []);

  // Board archived cards modal handlers
  const openBoardArchivedCardsModal = useCallback(() => {
    setIsBoardArchivedCardsModalOpen(true);
  }, []);

  const closeBoardArchivedCardsModal = useCallback(() => {
    setIsBoardArchivedCardsModalOpen(false);
  }, []);

  // Board copy modal handlers
  const openBoardCopyModal = useCallback(() => {
    setIsBoardCopyModalOpen(true);
  }, []);

  const closeBoardCopyModal = useCallback(() => {
    setIsBoardCopyModalOpen(false);
  }, []);

  const contextValue: TrelloUIContextType = useMemo(
    () => ({
      // Card modal state
      activeCardModal,
      activeCardModalIsMirror,
      activeCardModalListId,
      openCardModal,
      closeCardModal,

      // Board UI state
      isEditingBoardTitle,
      editingBoardTitle,
      startBoardTitleEdit,
      updateBoardTitleEdit,
      saveBoardTitleEdit,
      cancelBoardTitleEdit,

      // Board interaction state
      hoveredListId,
      setHoveredListId,

      // Drag scrolling state
      isDragging,
      startX,
      scrollLeft,
      setDragState,

      // Add list form state
      isAddingList,
      newListTitle,
      startAddingList,
      updateNewListTitle,
      cancelAddingList,
      saveNewList,
      addListFormRef,
      addListInputRef,

      // Board feature toggles
      toggleStarred,
      isPowerUpsActive,
      togglePowerUps,

      // Search state
      searchQuery,
      isSearchActive,
      setSearchQuery: handleSearchQueryChange,
      toggleSearch,

      // Sidebar state
      sidebarVisible,
      toggleSidebar,

      // Filter state
      activeFilters,
      toggleFilter,
      clearFilters,

      // Board custom fields modal state
      isBoardCustomFieldsModalOpen,
      openBoardCustomFieldsModal,
      closeBoardCustomFieldsModal,
      boardCustomFieldsButtonRef,

      // Board labels modal state
      isBoardLabelsModalOpen,
      openBoardLabelsModal,
      closeBoardLabelsModal,
      boardLabelsModalRef,

      // Board create label modal state
      isBoardCreateLabelModalOpen,
      boardEditingLabelId,
      openBoardCreateLabelModal,
      closeBoardCreateLabelModal,
      openBoardEditLabel,
      boardCreateLabelButtonRef,
      boardCreateLabelModalRef,

      // Board archived cards modal state
      isBoardArchivedCardsModalOpen,
      openBoardArchivedCardsModal,
      closeBoardArchivedCardsModal,

      // Board copy modal state
      isBoardCopyModalOpen,
      openBoardCopyModal,
      closeBoardCopyModal,
    }),
    [
      activeCardModal,
      activeCardModalIsMirror,
      activeCardModalListId,
      openCardModal,
      closeCardModal,
      isEditingBoardTitle,
      editingBoardTitle,
      startBoardTitleEdit,
      updateBoardTitleEdit,
      saveBoardTitleEdit,
      cancelBoardTitleEdit,
      hoveredListId,
      isDragging,
      startX,
      scrollLeft,
      setDragState,
      isAddingList,
      newListTitle,
      startAddingList,
      updateNewListTitle,
      cancelAddingList,
      saveNewList,
      toggleStarred,
      isPowerUpsActive,
      togglePowerUps,
      searchQuery,
      isSearchActive,
      handleSearchQueryChange,
      toggleSearch,
      sidebarVisible,
      toggleSidebar,
      activeFilters,
      toggleFilter,
      clearFilters,
      isBoardCustomFieldsModalOpen,
      openBoardCustomFieldsModal,
      closeBoardCustomFieldsModal,

      isBoardLabelsModalOpen,
      openBoardLabelsModal,
      closeBoardLabelsModal,
      boardLabelsModalRef,
      isBoardCreateLabelModalOpen,
      boardEditingLabelId,
      openBoardCreateLabelModal,
      closeBoardCreateLabelModal,
      openBoardEditLabel,
      boardCreateLabelButtonRef,
      boardCreateLabelModalRef,
      isBoardArchivedCardsModalOpen,
      openBoardArchivedCardsModal,
      closeBoardArchivedCardsModal,
      isBoardCopyModalOpen,
      openBoardCopyModal,
      closeBoardCopyModal,
    ]
  );

  return <TrelloUIContext.Provider value={contextValue}>{children}</TrelloUIContext.Provider>;
});
