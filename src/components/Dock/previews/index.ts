// Re-export types and registry functions
export type { MinimizedPreviewProps } from './previewRegistry';
export { getPreviewComponent, registerPreview, renderPreview } from './previewRegistry';

// Register built-in previews
import { registerPreview } from './previewRegistry';
import { renderTerminalPreview } from './PreviewComponents';

registerPreview('terminal', renderTerminalPreview);
