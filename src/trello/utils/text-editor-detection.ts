/**
 * Utility functions for detecting when text editors are active
 */

/**
 * Checks if the currently focused element is a text input or textarea
 * that should prevent keyboard shortcuts from being triggered
 */
export function isTextEditorActive(): boolean {
  const activeElement = document.activeElement;

  if (!activeElement) {
    return false;
  }

  // Check if it's a textarea
  if (activeElement.tagName === 'TEXTAREA') {
    return true;
  }

  // Check if it's a text-like input
  if (activeElement.tagName === 'INPUT') {
    const inputType = (activeElement as HTMLInputElement).type;
    // Include text-like input types, exclude non-text types
    const textInputTypes = ['text', 'email', 'password', 'search', 'tel', 'url', 'number'];
    return textInputTypes.includes(inputType);
  }

  // Check if it's a contenteditable element
  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Check if it's inside a contenteditable container
  const contentEditableParent = activeElement.closest('[contenteditable="true"]');
  if (contentEditableParent) {
    return true;
  }

  return false;
}

/**
 * Checks if the currently focused element is specifically a text input
 * (excludes checkboxes, radio buttons, etc.)
 */
export function isTextInputActive(): boolean {
  const activeElement = document.activeElement;

  if (!activeElement) {
    return false;
  }

  if (activeElement.tagName === 'TEXTAREA') {
    return true;
  }

  if (activeElement.tagName === 'INPUT') {
    const inputType = (activeElement as HTMLInputElement).type;
    // Include text-like input types, exclude non-text types
    const textInputTypes = ['text', 'email', 'password', 'search', 'tel', 'url', 'number'];
    return textInputTypes.includes(inputType);
  }

  // Check contenteditable elements
  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Check if it's inside a contenteditable container
  const contentEditableParent = activeElement.closest('[contenteditable="true"]');
  if (contentEditableParent) {
    return true;
  }

  return false;
}
