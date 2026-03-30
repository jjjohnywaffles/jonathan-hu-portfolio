// Reusable hook for auto-resizing textarea functionality with dynamic height adjustment
import { useRef, useCallback, useEffect } from 'react';

export function useAutoResizeTextarea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to match content height
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;

      // Reset height to 0 to get accurate scrollHeight
      textarea.style.height = '0px';

      // Get the actual content height
      const scrollHeight = textarea.scrollHeight;

      // Set the height to match the content exactly
      textarea.style.height = scrollHeight + 'px';
    }
  }, []);

  // Reset textarea height to default
  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '';
      textareaRef.current.style.removeProperty('height');
    }
  }, []);

  // Auto-adjust height when content changes
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      return e;
    },
    [adjustHeight]
  );

  return {
    textareaRef,
    adjustHeight,
    resetHeight,
    handleInput,
  };
}
