// Re-export registry functions
export { registerPreview, renderPreview } from './previewRegistry';

// Register built-in previews
import { registerPreview } from './previewRegistry';
import { renderTerminalPreview } from './PreviewComponents';

registerPreview('terminal', renderTerminalPreview);
