import { getDisplayPath } from '../../utils/pathUtils';

export const TerminalPrompt = ({ path }: { path: string }) => (
  <span className="flex shrink-0">
    <span className="text-accent">visitor</span>
    <span className="text-text-muted">@</span>
    <span className="text-accent-secondary">jonathan.hu</span>
    <span className="text-accent-secondary ml-2">{getDisplayPath(path)}</span>
    <span className="text-text-primary ml-2">$</span>
  </span>
);
