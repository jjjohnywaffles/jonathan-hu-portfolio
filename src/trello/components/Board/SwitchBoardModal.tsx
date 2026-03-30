import React, { memo, useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CardModal } from '../ui';
import { IconDueDate } from '../icons/card/icon-duedate';
import { IconChevronDown } from '../icons/board/icon-chevron-down';
import { IconPlus } from '../icons/list/icon-plus';
import { IconBoardStar } from '../icons/board/icon-board-star';
import { NewBoardModal } from './NewBoardModal';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useTrelloStore } from '@trello/_lib';
import { useTrelloOperations } from '@trello/_lib/selectors';
import { getTrelloBrandName } from '@trello/_lib/utils/brand';
import { pushPointerSuppression, popPointerSuppression } from '@trello/hooks/use-pointer-position';

type SwitchBoardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (title: string) => void;
  onSwitchBoard?: (boardId: string) => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
};

type Board = {
  id: string;
  title: string;
  background?: string;
  starred?: boolean;
  workspace?: string;
};

const SwitchBoardModal: FC<SwitchBoardModalProps> = memo(function SwitchBoardModal({
  isOpen,
  onClose,
  onCreateBoard,
  onSwitchBoard,
  buttonRef,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'trello-workspace'>('add');
  const [isStarredCollapsed, setIsStarredCollapsed] = useState(false);
  const [isRecentCollapsed, setIsRecentCollapsed] = useState(false);
  const [isTrelloWorkspaceCollapsed, setIsTrelloWorkspaceCollapsed] = useState(false);
  const [isYourBoardsCollapsed, setIsYourBoardsCollapsed] = useState(false);
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const createBoardButtonRef = useRef<HTMLButtonElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const newBoardModalWasOpenRef = useRef(false);
  const [activeButtonRef, setActiveButtonRef] =
    useState<React.RefObject<HTMLButtonElement | null>>(plusButtonRef);

  // Get boards and workspaces from store
  const { boards, workspaces } = useTrelloStore(
    useShallow((state) => ({
      boards: state.boards,
      workspaces: state.workspaces,
    }))
  );

  // Get operations
  const { toggleBoardStar } = useTrelloOperations();

  // Convert boards object to array and filter by search
  const allBoards: Board[] = Object.values(boards).map((board: Board) => ({
    id: board.id,
    title: board.title,
    background: board.background,
    starred: board.starred,
    workspace: board.workspace,
  }));

  const filteredBoards = allBoards.filter((board) =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const isSearching = searchQuery.trim().length > 0;

  // Separate boards by categories
  const starredBoards = filteredBoards.filter((board) => board.starred);
  const recentBoards = filteredBoards.slice(0, 4); // Show first 4 as recent
  const workspaceBoards = filteredBoards; // Show all in workspace

  // Use unified anchored positioning
  const position = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'top',
    offset: 20,
    fallbackWidth: 640,
    fallbackHeight: 650,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Use dynamic modal height hook
  const modalHeight = useDynamicModalHeight();

  // Persist collapsed/expanded section state across openings
  const STORAGE_KEY = 'trello:switch-boards:collapse-state';

  // Load persisted collapsed state once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed != null &&
        typeof parsed === 'object' &&
        'starred' in parsed &&
        'recent' in parsed &&
        'workspace' in parsed &&
        'yourBoards' in parsed
      ) {
        const p = parsed as {
          starred: boolean;
          recent: boolean;
          workspace: boolean;
          yourBoards: boolean;
        };
        setIsStarredCollapsed(p.starred);
        setIsRecentCollapsed(p.recent);
        setIsTrelloWorkspaceCollapsed(p.workspace);
        setIsYourBoardsCollapsed(p.yourBoards);
      }
    } catch {}
  }, []);

  // Save collapsed state whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        starred: isStarredCollapsed,
        recent: isRecentCollapsed,
        workspace: isTrelloWorkspaceCollapsed,
        yourBoards: isYourBoardsCollapsed,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [isStarredCollapsed, isRecentCollapsed, isTrelloWorkspaceCollapsed, isYourBoardsCollapsed]);

  // Reset transient state when modal closes (preserve collapsed state) and focus search on open.
  // Also suppress global pointer updates while open so background UI doesn't react to mouse moves.
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setActiveTab('add');
      setIsNewBoardModalOpen(false);
      setHoveredSection(null);
    } else {
      // focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
      pushPointerSuppression();
    }
    return () => {
      popPointerSuppression();
    };
  }, [isOpen]);

  // Track newBoardModal state for child modal handling
  useEffect(() => {
    newBoardModalWasOpenRef.current = isNewBoardModalOpen;
  }, [isNewBoardModalOpen]);

  const handleBoardClick = (boardId: string) => {
    if (onSwitchBoard) {
      onSwitchBoard(boardId);
    }
    onClose();
  };

  const handleCreateBoard = (title: string) => {
    onCreateBoard(title);
    setIsNewBoardModalOpen(false);
  };

  const handleOpenNewBoardModal = () => {
    setActiveButtonRef(plusButtonRef);
    setIsNewBoardModalOpen(true);
  };

  const handleOpenNewBoardModalFromCreateButton = () => {
    setActiveButtonRef(createBoardButtonRef);
    setIsNewBoardModalOpen(true);
  };

  const handleCloseNewBoardModal = () => {
    setIsNewBoardModalOpen(false);
  };

  const BoardItem: FC<{ board: Board }> = ({ board }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleStarClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent navigating to the board
      toggleBoardStar({ boardId: board.id });
    };

    // Function to darken a hex color
    const darkenColor = (color: string, amount: number = 0.2) => {
      const hex = color.replace('#', '');
      const num = parseInt(hex, 16);
      const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
      const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount));
      const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    };

    // Check if background is a URL (image) or color
    const isImageBackground = board.background && board.background.startsWith('http');
    const boardColor = isImageBackground ? '#0079BF' : board.background || '#0079BF';
    const hoveredColor = isHovered ? darkenColor(boardColor) : boardColor;

    const backgroundStyle = isImageBackground
      ? {
          backgroundImage: `url(${board.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: boardColor, // fallback
        }
      : { backgroundColor: hoveredColor };

    return (
      <div
        onClick={() => handleBoardClick(board.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`h-28 w-36 cursor-pointer overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md ${
          isHovered ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        {/* Top section with board color/image (70% height) */}
        <div
          className="relative h-[70%] w-full transition-all duration-200"
          style={backgroundStyle}
        >
          {/* Overlay for image backgrounds on hover */}
          {isImageBackground && (
            <div
              className={`h-full w-full transition-all duration-200 ${
                isHovered ? 'bg-opacity-20 bg-black' : ''
              }`}
            />
          )}

          {/* Star icon in top-right corner */}
          <button
            onClick={handleStarClick}
            className={`absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded transition-all duration-200 hover:bg-white/20 ${
              board.starred ? 'opacity-100' : isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            title={board.starred ? 'Unstar board' : 'Star board'}
          >
            <IconBoardStar className="h-4 w-4 text-white drop-shadow-md" filled={board.starred} />
          </button>
        </div>

        {/* Bottom section with board title (30% height) */}
        <div className="relative flex h-[30%] w-full items-center bg-white px-2">
          <span className="truncate text-sm font-medium text-gray-800" title={board.title}>
            {board.title}
          </span>
        </div>
      </div>
    );
  };

  const SectionHeader: FC<{
    title: string;
    icon: React.ReactNode;
    isCollapsed: boolean;
    onToggle: () => void;
    isRecent?: boolean;
    showPlusButton?: boolean;
    onPlusClick?: () => void;
  }> = ({
    title,
    icon,
    isCollapsed,
    onToggle,
    isRecent = false,
    showPlusButton = false,
    onPlusClick,
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    const getDisplayIcon = () => {
      if (isRecent) {
        if (isCollapsed) {
          return <IconChevronDown className="h-4 w-4 -rotate-90 text-gray-600" />;
        } else if (isHovered) {
          return <IconChevronDown className="h-4 w-4 text-gray-600" />;
        } else {
          return icon;
        }
      } else {
        // Workspace section
        if (isCollapsed) {
          return <IconChevronDown className="h-4 w-4 -rotate-90 text-gray-600" />;
        } else {
          return <IconChevronDown className="h-4 w-4 text-gray-600" />;
        }
      }
    };

    const handlePlusClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering the header toggle
      if (onPlusClick) {
        onPlusClick();
      }
    };

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex w-full cursor-pointer items-center gap-2 rounded bg-gray-50 p-3 transition-colors hover:bg-gray-100"
        onClick={onToggle}
      >
        {getDisplayIcon()}
        <span className="flex-1 text-left text-sm font-bold text-gray-700">{title}</span>

        {/* Plus button that appears on hover for Workspace */}
        {showPlusButton && (
          <button
            ref={plusButtonRef}
            onClick={handlePlusClick}
            className={`flex h-6 w-6 items-center justify-center rounded bg-gray-200 transition-all duration-200 hover:bg-gray-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            title="Create new board"
          >
            <IconPlus className="h-3 w-3 text-gray-600" />
          </button>
        )}
      </div>
    );
  };

  // When modal is open, capture typing to feed the search input
  useEffect(() => {
    if (!isOpen || isNewBoardModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input already
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      const key = e.key;
      if (key.length === 1) {
        e.preventDefault();
        // Append printable character
        setSearchQuery((prev) => `${prev}${key}`);
        searchInputRef.current?.focus();
        return;
      }
      if (key === 'Backspace') {
        e.preventDefault();
        setSearchQuery((prev) => prev.slice(0, -1));
        searchInputRef.current?.focus();
        return;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isNewBoardModalOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with correct blur effect */}
      <div
        className="fixed inset-0 z-50 transition-opacity"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)' }}
      />

      <CardModal
        ref={modalRef}
        title=""
        isOpen={isOpen}
        onClose={onClose}
        position={{ top: position.top, left: position.left }}
        buttonRef={buttonRef}
        dataAttribute="data-switch-board-modal"
        containerClassName={`z-[60] ${modalHeight.modalContainerClasses}`}
        className={`!h-[650px] !w-[640px] !rounded-xl !border-2 !border-gray-400 !shadow-2xl ${modalHeight.modalClasses}`}
        showCloseButton={false}
        showHeader={false}
        childModals={[
          {
            isOpen: isNewBoardModalOpen,
            wasOpenRef: newBoardModalWasOpenRef,
          },
        ]}
      >
        <div className={`space-y-4 p-4 ${modalHeight.contentClasses}`}>
          {/* Search Bar */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your boards"
              className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <svg
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Tab Buttons */}
          <div className="flex justify-start gap-1">
            <button
              onClick={() => setActiveTab('add')}
              className={`rounded border px-3 py-1 text-sm font-medium transition-colors ${
                activeTab === 'add'
                  ? 'border-blue-600 bg-gray-100 text-blue-600'
                  : 'border-gray-200 bg-gray-100 text-gray-600 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('trello-workspace')}
              className={`rounded border px-3 py-1 text-sm font-medium transition-colors ${
                activeTab === 'trello-workspace'
                  ? 'border-blue-600 bg-gray-100 text-blue-600'
                  : 'border-gray-200 bg-gray-100 text-gray-600 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              {`${getTrelloBrandName()} Workspace`}
            </button>
          </div>

          {/* Content based on active tab or search */}
          <div className="space-y-4">
            {isSearching ? (
              <div className="grid grid-cols-4 gap-2 px-2">
                {filteredBoards.map((board) => (
                  <BoardItem key={board.id} board={board} />
                ))}
                {filteredBoards.length === 0 && (
                  <p className="col-span-4 p-2 text-sm text-gray-500">No boards found</p>
                )}
              </div>
            ) : activeTab === 'add' ? (
              <>
                {/* Starred Section */}
                {starredBoards.length > 0 && (
                  <div className="space-y-2">
                    <SectionHeader
                      title="Starred"
                      icon={<IconBoardStar className="h-4 w-4 text-gray-600" filled={false} />}
                      isCollapsed={isStarredCollapsed}
                      onToggle={() => setIsStarredCollapsed(!isStarredCollapsed)}
                      isRecent={false}
                    />
                    {!isStarredCollapsed && (
                      <div className="grid grid-cols-4 gap-2 px-2">
                        {starredBoards.map((board) => (
                          <BoardItem key={board.id} board={board} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Section */}
                <div className="space-y-2">
                  <SectionHeader
                    title="Recent"
                    icon={<IconDueDate className="h-4 w-4 text-gray-600" />}
                    isCollapsed={isRecentCollapsed}
                    onToggle={() => setIsRecentCollapsed(!isRecentCollapsed)}
                    isRecent={true}
                  />
                  {!isRecentCollapsed && (
                    <div className="grid grid-cols-4 gap-2 px-2">
                      {recentBoards.map((board) => (
                        <BoardItem key={board.id} board={board} />
                      ))}
                      {recentBoards.length === 0 && (
                        <p className="col-span-4 p-2 text-sm text-gray-500">
                          No recent boards found
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Workspace Section */}
                <div className="space-y-2">
                  <SectionHeader
                    title={`${getTrelloBrandName()} Workspace`}
                    icon={<IconChevronDown className="h-4 w-4 text-gray-600" />}
                    isCollapsed={isTrelloWorkspaceCollapsed}
                    onToggle={() => setIsTrelloWorkspaceCollapsed(!isTrelloWorkspaceCollapsed)}
                    showPlusButton={true}
                    onPlusClick={handleOpenNewBoardModal}
                  />
                  {!isTrelloWorkspaceCollapsed && (
                    <div className="grid grid-cols-4 gap-2 px-2">
                      {workspaceBoards.map((board) => (
                        <BoardItem key={board.id} board={board} />
                      ))}
                      {workspaceBoards.length === 0 && (
                        <p className="col-span-4 p-2 text-sm text-gray-500">
                          No workspace boards found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : activeTab === 'trello-workspace' ? (
              <div className="space-y-4">
                {/* Starred Section (Workspace) */}
                {starredBoards.length > 0 && (
                  <div className="space-y-2">
                    <SectionHeader
                      title="Starred"
                      icon={<IconBoardStar className="h-4 w-4 text-gray-600" filled={false} />}
                      isCollapsed={isStarredCollapsed}
                      onToggle={() => setIsStarredCollapsed(!isStarredCollapsed)}
                      isRecent={false}
                    />
                    {!isStarredCollapsed && (
                      <div className="grid grid-cols-4 gap-2 px-2">
                        {starredBoards.map((board) => (
                          <BoardItem key={board.id} board={board} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Your boards Section */}
                <div className="space-y-2">
                  <SectionHeader
                    title="Your boards"
                    icon={<IconChevronDown className="h-4 w-4 text-gray-600" />}
                    isCollapsed={isYourBoardsCollapsed}
                    onToggle={() => setIsYourBoardsCollapsed(!isYourBoardsCollapsed)}
                    showPlusButton={true}
                    onPlusClick={handleOpenNewBoardModal}
                  />
                  {!isYourBoardsCollapsed && (
                    <div className="grid grid-cols-4 gap-2 px-2">
                      {/* Existing Boards */}
                      {workspaceBoards.map((board) => (
                        <BoardItem key={board.id} board={board} />
                      ))}

                      {/* Create New Board Button - always in rightmost position */}
                      <button
                        ref={createBoardButtonRef}
                        onClick={handleOpenNewBoardModalFromCreateButton}
                        className="group flex h-28 w-36 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 shadow-sm transition-all duration-200 hover:bg-gray-200 hover:shadow-md"
                        style={{
                          gridColumn:
                            workspaceBoards.length % 4 === 0
                              ? '1'
                              : `${(workspaceBoards.length % 4) + 1}`,
                        }}
                      >
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-700">
                          Create new board
                        </span>
                      </button>

                      {workspaceBoards.length === 0 && (
                        <p className="col-span-4 mt-2 p-2 text-sm text-gray-500">
                          No workspace boards found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardModal>

      {/* New Board Modal */}
      <NewBoardModal
        isOpen={isNewBoardModalOpen}
        onClose={handleCloseNewBoardModal}
        onCreateBoard={handleCreateBoard}
        buttonRef={activeButtonRef}
      />
    </>
  );
});

export { SwitchBoardModal };
