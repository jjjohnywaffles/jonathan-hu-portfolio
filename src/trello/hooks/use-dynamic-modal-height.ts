import { useMemo } from 'react';

type DynamicModalHeightConfig = {
  /**
   * Maximum height of the modal container
   * @default "calc(100vh-2rem)"
   */
  maxModalHeight?: string;

  /**
   * Maximum height of the scrollable content area
   * @default "calc(100vh-8rem)"
   */
  maxContentHeight?: string;

  /**
   * Whether to enable thin scrollbar styling
   * @default true
   */
  useScrollbarStyling?: boolean;

  /**
   * Additional classes for the modal container
   */
  modalClassName?: string;

  /**
   * Additional classes for the content container
   */
  contentClassName?: string;
};

type DynamicModalHeightResult = {
  /**
   * Classes to apply to the modal container (CardModal or similar)
   */
  modalClasses: string;

  /**
   * Classes to apply to the modal container's containerClassName prop
   */
  modalContainerClasses: string;
  /** Inline styles to apply to the modal container (for dynamic max-height) */
  modalContainerStyle?: React.CSSProperties;

  /**
   * Classes to apply to the scrollable content wrapper
   */
  contentClasses: string;
  /** Inline styles to apply to the content wrapper (for dynamic max-height) */
  contentStyle?: React.CSSProperties;

  /**
   * Classes to apply to fixed footer/action buttons
   */
  footerClasses: string;
};

/**
 * Hook to manage dynamic modal heights with scrollable content
 *
 * @example
 * const modalHeight = useDynamicModalHeight();
 *
 * return (
 *   <CardModal
 *     className={modalHeight.modalClasses}
 *     containerClassName={modalHeight.modalContainerClasses}
 *   >
 *     <div className={modalHeight.contentClasses}>
 *       {// Scrollable content}
 *     </div>
 *     <div className={modalHeight.footerClasses}>
 *       {// Fixed buttons}
 *     </div>
 *   </CardModal>
 * );
 */
export function useDynamicModalHeight(
  config: DynamicModalHeightConfig = {}
): DynamicModalHeightResult {
  const {
    maxModalHeight = 'calc(100vh-2rem)',
    maxContentHeight = 'calc(100vh-8rem)',
    useScrollbarStyling = true,
    modalClassName = '',
    contentClassName = '',
  } = config;

  return useMemo(() => {
    const scrollbarClasses = useScrollbarStyling
      ? 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'
      : '';

    // Note: Tailwind doesn't support dynamic values in template literals
    // So we use the most common values as defaults
    const modalContainerHeight =
      maxModalHeight === 'calc(100vh-2rem)'
        ? 'max-h-[calc(100vh-2rem)]'
        : maxModalHeight === 'calc(100vh - 120px)'
          ? 'max-h-[calc(100vh-120px)]'
          : maxModalHeight === '420px'
            ? 'max-h-[420px]'
            : undefined;

    const contentHeight =
      maxContentHeight === 'calc(100vh-8rem)'
        ? 'max-h-[calc(100vh-8rem)]'
        : maxContentHeight === 'calc(100vh - 200px)'
          ? 'max-h-[calc(100vh-200px)]'
          : maxContentHeight === '300px'
            ? 'max-h-[300px]'
            : undefined;

    return {
      modalClasses: `flex flex-col ${modalClassName}`.trim(),
      modalContainerClasses: `${modalContainerHeight ?? ''} overflow-hidden`.trim(),
      modalContainerStyle: modalContainerHeight == null ? { maxHeight: maxModalHeight } : undefined,
      contentClasses:
        `flex-1 overflow-y-auto overflow-x-hidden ${contentHeight ?? ''} ${scrollbarClasses} ${contentClassName}`.trim(),
      contentStyle: contentHeight == null ? { maxHeight: maxContentHeight } : undefined,
      footerClasses: 'flex-shrink-0',
    };
  }, [maxModalHeight, maxContentHeight, useScrollbarStyling, modalClassName, contentClassName]);
}
