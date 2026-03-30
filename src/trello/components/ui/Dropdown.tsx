import React, {
  memo,
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode, HTMLAttributes } from 'react';
import { useDynamicDropdownPosition } from '../../hooks/use-dynamic-dropdown-position';
import { cn } from '@trello/_lib/shims/utils';

// Context for dropdown state
type DropdownContextValue = {
  closeOnClick: boolean;
  onClose: () => void;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

type DropdownPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-center';

type DropdownProps = {
  trigger: ReactNode;
  children: ReactNode;
  position?: DropdownPosition;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  closeOnClick?: boolean;
  offset?: number;
  usePortal?: boolean;
  useDynamicPositioning?: boolean;
  onOpenChange?: (open: boolean) => void;
  portalZIndex?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

type DropdownItemProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
} & HTMLAttributes<HTMLButtonElement>;

const Dropdown = memo(
  forwardRef<HTMLDivElement, DropdownProps>(function Dropdown(
    {
      trigger,
      children,
      position = 'bottom-left',
      className,
      contentClassName,
      disabled = false,
      closeOnClick = true,
      offset = 4,
      usePortal = false,
      useDynamicPositioning = false,
      onOpenChange,
      portalZIndex = 'z-[60]',
      ...props
    },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false);
    const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0 });
    const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
    const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Dynamic positioning hook
    const dynamicPosition = useDynamicDropdownPosition({
      isOpen: isOpen && useDynamicPositioning,
      triggerRef,
      contentRef,
      preferredPosition: position,
      offset,
    });

    // Calculate portal position based on trigger element and position prop
    const calculatePortalPosition = useCallback(() => {
      if (!triggerRef.current) return { top: 0, left: 0 };

      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = rect.bottom + scrollY + offset;
      let left = rect.left + scrollX;

      // Adjust position based on position prop
      switch (position) {
        case 'top-left':
          top = rect.top + scrollY - offset;
          left = rect.left + scrollX;
          break;
        case 'top-right':
          top = rect.top + scrollY - offset;
          left = rect.right + scrollX;
          break;
        case 'bottom-right':
          top = rect.bottom + scrollY + offset;
          left = rect.right + scrollX;
          break;
        case 'bottom-center':
          top = rect.bottom + scrollY + offset;
          left = rect.left + scrollX + rect.width / 2;
          break;
        default: // bottom-left
          top = rect.bottom + scrollY + offset;
          left = rect.left + scrollX;
      }

      return { top, left };
    }, [position, offset]);

    // Calculate max-height based on available viewport space
    const calculateMaxHeight = useCallback(() => {
      if (!triggerRef.current) return undefined;

      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const VIEWPORT_BUFFER = 16; // Buffer from bottom of screen

      // Determine the actual position (use dynamic position if available)
      const actualPosition =
        useDynamicPositioning && dynamicPosition.position ? dynamicPosition.position : position;

      // Calculate available space based on dropdown position
      let availableSpace: number;

      if (actualPosition.startsWith('top-')) {
        // Dropdown opens above the trigger
        availableSpace = rect.top - VIEWPORT_BUFFER - offset;
      } else {
        // Dropdown opens below the trigger (bottom-left, bottom-right, bottom-center)
        availableSpace = viewportHeight - rect.bottom - VIEWPORT_BUFFER - offset;
      }

      // Ensure we have at least a minimum usable height, but never exceed available space
      // This ensures the dropdown is always scrollable and never extends beyond viewport
      const minHeight = 100;
      const maxAllowedHeight = viewportHeight - VIEWPORT_BUFFER * 2;

      return Math.min(Math.max(minHeight, availableSpace), maxAllowedHeight);
    }, [offset, position, useDynamicPositioning, dynamicPosition.position]);

    const handleToggle = useCallback(() => {
      if (disabled) return;
      const newOpen = !isOpen;
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);

      // Calculate portal position and max-height if using portal
      if (usePortal && newOpen && triggerRef.current) {
        setPortalPosition(calculatePortalPosition());
        setMaxHeight(calculateMaxHeight());
        setTriggerWidth(triggerRef.current.offsetWidth);
      }

      if (!usePortal && newOpen && triggerRef.current) {
        // Also set max-height for non-portal dropdowns
        setMaxHeight(calculateMaxHeight());
        setTriggerWidth(triggerRef.current.offsetWidth);
      }
    }, [disabled, isOpen, onOpenChange, usePortal, calculatePortalPosition, calculateMaxHeight]);

    const handleClose = useCallback(() => {
      setIsOpen(false);
      onOpenChange?.(false);
    }, [onOpenChange]);

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          contentRef.current &&
          triggerRef.current &&
          !contentRef.current.contains(target) &&
          !triggerRef.current.contains(target)
        ) {
          handleClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, handleClose]);

    // Close on escape key
    useEffect(() => {
      if (!isOpen) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleClose();
          triggerRef.current?.focus();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, handleClose]);

    // Update portal position and max-height on scroll/resize when using portal
    useEffect(() => {
      if (!isOpen || !usePortal) return;

      const updatePosition = () => {
        if (triggerRef.current) {
          setPortalPosition(calculatePortalPosition());
          setMaxHeight(calculateMaxHeight());
          setTriggerWidth(triggerRef.current.offsetWidth);
        }
      };

      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }, [isOpen, usePortal, calculatePortalPosition, calculateMaxHeight]);

    // Update max-height on scroll/resize for non-portal dropdowns
    useEffect(() => {
      if (!isOpen || usePortal) return;

      const updateMaxHeight = () => {
        setMaxHeight(calculateMaxHeight());
        if (triggerRef.current) {
          setTriggerWidth(triggerRef.current.offsetWidth);
        }
      };

      window.addEventListener('scroll', updateMaxHeight, true);
      window.addEventListener('resize', updateMaxHeight);

      return () => {
        window.removeEventListener('scroll', updateMaxHeight, true);
        window.removeEventListener('resize', updateMaxHeight);
      };
    }, [isOpen, usePortal, calculateMaxHeight]);

    const positionClasses = {
      'bottom-left': 'top-full left-0',
      'bottom-right': 'top-full right-0',
      'top-left': 'bottom-full left-0',
      'top-right': 'bottom-full right-0',
      'bottom-center': 'top-full left-1/2 transform -translate-x-1/2',
    };

    const dropdownContent = isOpen && (
      <DropdownContext.Provider value={{ closeOnClick, onClose: handleClose }}>
        <div
          ref={contentRef}
          className={cn(
            usePortal ? `fixed ${portalZIndex}` : 'absolute z-50',
            contentClassName || 'min-w-48',
            'rounded-lg border border-gray-200 bg-white shadow-lg',
            'animate-in fade-in-0 zoom-in-95 py-1',
            'dropdown-portal', // Add specific class for click outside detection
            !usePortal && positionClasses[position]
          )}
          style={
            usePortal
              ? {
                  top: useDynamicPositioning ? dynamicPosition.top : portalPosition.top,
                  left: useDynamicPositioning ? dynamicPosition.left : portalPosition.left,
                  transform: position.includes('center') ? 'translateX(-50%)' : undefined,
                  maxHeight: maxHeight ? `${maxHeight}px` : undefined,
                  overflowY: 'auto',
                  ['--trigger-width' as string]: triggerWidth ? `${triggerWidth}px` : undefined,
                }
              : {
                  marginTop: offset,
                  maxHeight: maxHeight ? `${maxHeight}px` : undefined,
                  overflowY: 'auto',
                  ['--trigger-width' as string]: triggerWidth ? `${triggerWidth}px` : undefined,
                }
          }
          role="menu"
        >
          {children}
        </div>
      </DropdownContext.Provider>
    );

    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          className?.includes('block') ? 'block' : 'inline-block',
          className
        )}
        {...props}
      >
        {/* Trigger */}
        <button
          ref={triggerRef}
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            className?.includes('w-full') ? 'flex w-full' : 'inline-flex',
            'items-center justify-center',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {trigger}
        </button>

        {/* Content - render in portal if usePortal is true */}
        {usePortal
          ? dropdownContent && createPortal(dropdownContent, document.body)
          : dropdownContent}
      </div>
    );
  })
);

const DropdownItem = memo(
  forwardRef<HTMLButtonElement, DropdownItemProps>(function DropdownItem(
    {
      children,
      onClick,
      disabled = false,
      destructive = false,
      className,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) {
    const dropdownContext = useContext(DropdownContext);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Stop event propagation to prevent interference with modal click outside detection
        e.stopPropagation();

        // Call the original onClick handler first
        onClick?.(e);

        // Then close the dropdown if closeOnClick is enabled
        if (dropdownContext?.closeOnClick && !disabled) {
          dropdownContext.onClose();
        }
      },
      [onClick, dropdownContext, disabled]
    );

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-left text-sm',
          'flex items-center gap-2',
          'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          destructive && 'text-red-600 hover:bg-red-50 focus:bg-red-50',
          className
        )}
        role="menuitem"
        {...props}
      >
        {leftIcon && <span className="h-4 w-4 flex-shrink-0">{leftIcon}</span>}

        <span className="flex-1 truncate">{children}</span>

        {rightIcon && <span className="h-4 w-4 flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  })
);

const DropdownSeparator = memo(function DropdownSeparator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('my-1 border-t border-gray-100', className)} role="separator" {...props} />
  );
});

export { Dropdown, DropdownItem, DropdownSeparator };
export type { DropdownProps, DropdownItemProps, DropdownPosition };
