import { useFileSystem } from '../../hooks/useFileSystem';
import { getDisplayPath } from '../../utils/pathUtils';

const PromptDisplay = ({ displayPath }: { displayPath: string }) => (
  <span className="flex shrink-0">
    <span className="text-accent">visitor</span>
    <span className="text-text-muted">@</span>
    <span className="text-accent-secondary">jonathan.hu</span>
    <span className="text-accent-secondary ml-2">{displayPath}</span>
    <span className="text-text-primary ml-2">$</span>
  </span>
);

/** Shows prompt with a frozen path snapshot (for history entries). */
export const StaticPrompt = ({ path }: { path: string }) => {
  return <PromptDisplay displayPath={getDisplayPath(path)} />;
};

/** Shows prompt with the live current path (for the active input line). */
export const TerminalPrompt = () => {
  const { currentPath } = useFileSystem();
  return <PromptDisplay displayPath={getDisplayPath(currentPath)} />;
};
