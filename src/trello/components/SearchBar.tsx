import React, { memo, useState, useEffect, useRef } from 'react';
import { isValidSearchQuery, getSearchSuggestions } from '../utils/search-parser';
import { IconSearch } from './icons/header/IconSearch';
import { IconSearchBoard } from './icons/header/icon-search-board';
import { FlexContainer, Input, Button } from './ui';
import { SearchResults } from './SearchResults';
import { NewBoardModal } from './Board/NewBoardModal';
import { useTrelloUI } from './TrelloUIContext';
import {
  useTrelloOperations,
  useSearchQuery,
  useSearchIsActive,
  useRecentSearches,
  useRecentBoards,
  useSortedSearchResults,
  useBoardTitle,
} from '@trello/_lib/selectors';
import { getTrelloBrandName } from '@trello/_lib/utils/brand';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';
import { cn } from '@trello/_lib/shims/utils';

const SearchBar: React.FC = memo(function SearchBar() {
  const [localQuery, setLocalQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState('Search');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  const isSearchDisabled = useIsModifierEnabled('disabledSearch');
  const searchQuery = useSearchQuery();
  const isSearchActive = useSearchIsActive();
  const recentSearches = useRecentSearches();
  const recentBoards = useRecentBoards();
  const searchResults = useSortedSearchResults();
  const currentBoardTitle = useBoardTitle();
  const { activeCardModal } = useTrelloUI();

  const {
    updateSearchQuery,
    clearSearch,
    addRecentSearch,
    setSearchActive,
    switchBoard,
    createBoard,
  } = useTrelloOperations();

  useEffect(() => {
    if (!isSearchActive) {
      setShowDropdown(false);
      setPlaceholder('Search');
    }
  }, [isSearchActive]);

  // Sync local state with store
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Global "/" shortcut to focus the search bar
  useEffect(() => {
    const handleGlobalSlash = (e: KeyboardEvent) => {
      if (isSearchDisabled) return;
      if (activeCardModal != null) return;
      if (e.key !== '/' || e.ctrlKey || e.metaKey) {
        return;
      }
      // Ignore if already typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
      setSearchActive({ isActive: true });
      setShowDropdown(true);
      setPlaceholder(`Search ${getTrelloBrandName()}`);
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', handleGlobalSlash);
    return () => document.removeEventListener('keydown', handleGlobalSlash);
  }, [setSearchActive, activeCardModal, isSearchDisabled]);

  // Get suggestions based on current input
  const suggestions = getSearchSuggestions(localQuery);

  // Show search results if we have valid query and results
  const trimmedQuery = localQuery.trim();
  const showSearchResults = isSearchActive && trimmedQuery.length >= 2;

  const showShortQueryError =
    trimmedQuery.length > 0 && trimmedQuery.length < 3 && searchResults.totalCount === 0;
  const showNoResultError = trimmedQuery.length >= 3 && searchResults.totalCount === 0;
  const showSingleCharError = showShortQueryError || showNoResultError;

  // Dropdown items - only recent boards and advanced search initially
  const dropdownItems =
    !showSearchResults && !showSingleCharError
      ? [
          // Recent boards section
          ...(recentBoards.length > 0
            ? [
                { type: 'header' as const, label: 'Recent Boards' },
                ...[...recentBoards]
                  .sort((a, b) => {
                    // Put current board first
                    if (a.title === currentBoardTitle) return -1;
                    if (b.title === currentBoardTitle) return 1;
                    return 0;
                  })
                  .map((board) => ({
                    type: 'recent-board' as const,
                    label: board.title,
                    subtitle:
                      board.title === currentBoardTitle
                        ? 'Currently viewing'
                        : `${getTrelloBrandName()} Workspace`,
                    value: `board:${board.title}`,
                    boardId: board.id,
                    isCurrentBoard: board.title === currentBoardTitle,
                  })),
              ]
            : []),

          // Advanced search option
          {
            type: 'advanced' as const,
            label: 'Advanced Search',
            subtitle: '',
            value: '',
          },
        ]
      : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    setFocusedIndex(-1);

    if (value.length === 0) {
      if (showDropdown) {
        setShowDropdown(false);
      }
      if (placeholder !== 'Search') {
        setPlaceholder('Search');
      }
    } else {
      if (!isSearchActive) {
        setSearchActive({ isActive: true });
      }
      if (!showDropdown) {
        setShowDropdown(true);
      }
      if (placeholder !== `Search ${getTrelloBrandName()}`) {
        setPlaceholder(`Search ${getTrelloBrandName()}`);
      }
    }

    // Update search in real-time if valid
    if (isValidSearchQuery(value)) {
      updateSearchQuery({ query: value });
    } else if (value.length === 0) {
      clearSearch();
    }
  };

  const handleInputFocus = () => {
    setPlaceholder(`Search ${getTrelloBrandName()}`);
    setShowDropdown(true);
    setSearchActive({ isActive: true });
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Check if the focus is moving to the dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }

    setTimeout(() => {
      handleClear({ refocus: false });
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const selectableItems = dropdownItems.filter(
      (item) => item.type !== 'header' && item.type !== 'advanced'
    );

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < selectableItems.length - 1 ? prev + 1 : prev));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < selectableItems.length) {
          handleItemSelect(selectableItems[focusedIndex]);
        } else if (isValidSearchQuery(localQuery)) {
          handleSearchSubmit();
        }
        break;

      case 'Escape':
        handleClear({ refocus: false });
        inputRef.current?.blur();
        break;
    }
  };

  const handleItemSelect = (item: any) => {
    if (item.type === 'advanced') {
      // TODO: Open advanced search modal
      console.log('Open advanced search modal');
      return;
    }

    if (item.type === 'recent-board') {
      // Handle board switching
      if (!item.isCurrentBoard && item.boardId) {
        console.log('Switching to board:', item.boardId, item.label);
        switchBoard({ boardId: item.boardId });
      }
      setShowDropdown(false);
      inputRef.current?.blur();
      return;
    }

    // Handle regular search suggestions
    const newQuery = item.value;
    setLocalQuery(newQuery);
    updateSearchQuery({ query: newQuery });
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleSearchSubmit = () => {
    if (isValidSearchQuery(localQuery)) {
      updateSearchQuery({ query: localQuery });
      // Add to recent searches when user explicitly searches
      // This will be handled by the search results component
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = (options?: { refocus?: boolean }) => {
    const shouldRefocus = options?.refocus ?? true;
    setLocalQuery('');
    clearSearch();
    setSearchActive({ isActive: false });
    setShowDropdown(false);
    setPlaceholder('Search');
    setFocusedIndex(-1);
    if (shouldRefocus) {
      inputRef.current?.focus();
    }
  };

  return (
    <FlexContainer className="relative w-full max-w-[800px]" justify="start">
      <div className={cn('relative flex-1', isSearchDisabled && 'matrices-disabled')}>
        {/* Search Input */}
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
          <IconSearch />
        </span>
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          tabIndex={-1} // prevent tab to focus the input
          disabled={isSearchDisabled}
          className="h-8 border-slate-500 pr-8 pl-8 font-normal"
          aria-label="Search"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />

        {/* Clear Button */}
        {localQuery && (
          <button
            type="button"
            onClick={() => handleClear()}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            ×
          </button>
        )}

        {/* Search Dropdown - Show either suggestions or results */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border border-slate-300 bg-white shadow-lg"
            role="listbox"
            aria-label="Search suggestions"
          >
            {showSingleCharError ? (
              <div className="px-3 py-4 text-center">
                <p className="mb-1 text-sm text-slate-600">
                  We couldn't find anything matching your search.
                </p>
                <p className="text-xs text-slate-500">
                  Try again with a different term, or refine your results with Advanced Search
                </p>
              </div>
            ) : showSearchResults ? (
              <SearchResults />
            ) : (
              <>
                {dropdownItems.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">Start typing to search...</div>
                ) : (
                  dropdownItems.map((item, index) => {
                    if (item.type === 'header') {
                      return (
                        <div
                          key={`header-${item.label}`}
                          className="bg-slate-50 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 uppercase"
                        >
                          {item.label}
                        </div>
                      );
                    }

                    const isAdvanced = item.type === 'advanced';
                    const isRecentBoard = item.type === 'recent-board';
                    const isCurrentBoard = isRecentBoard && item.isCurrentBoard;

                    return (
                      <button
                        key={`${item.type}-${index}`}
                        type="button"
                        className={`w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 ${
                          isAdvanced
                            ? 'matrices-disabled border-t bg-slate-50 hover:bg-slate-100'
                            : isCurrentBoard
                              ? 'cursor-default'
                              : 'cursor-pointer hover:bg-slate-50'
                        }`}
                        onClick={() => handleItemSelect(item)}
                        role="option"
                        aria-selected={
                          focusedIndex ===
                          index - dropdownItems.filter((i) => i.type === 'header').length
                        }
                        disabled={isCurrentBoard || isAdvanced}
                        aria-disabled={isAdvanced}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isRecentBoard && (
                              <IconSearchBoard color="#0079BF" className="flex-shrink-0" />
                            )}
                            <div>
                              <div
                                className={`text-sm ${
                                  isAdvanced ? 'font-medium text-blue-600' : 'text-slate-900'
                                }`}
                              >
                                {item.label}
                              </div>
                              {item.subtitle && (
                                <div className="text-xs text-slate-500">{item.subtitle}</div>
                              )}
                            </div>
                          </div>
                          {isAdvanced && <div className="text-blue-600">→</div>}
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>
        )}
      </div>

      <Button
        ref={createButtonRef}
        className="ml-2 h-8 bg-[#1677ff] font-normal hover:bg-[#166fe0]"
        variant="default"
        type="button"
        onClick={() => setIsCreateBoardModalOpen(true)}
      >
        Create
      </Button>

      {/* Create Board Modal */}
      <NewBoardModal
        isOpen={isCreateBoardModalOpen}
        onClose={() => setIsCreateBoardModalOpen(false)}
        onCreateBoard={(title) => {
          const newBoardId = createBoard({ title });
          switchBoard({ boardId: newBoardId });
          setIsCreateBoardModalOpen(false);
        }}
        buttonRef={createButtonRef}
        placement="bottom"
      />
    </FlexContainer>
  );
});

export { SearchBar };
