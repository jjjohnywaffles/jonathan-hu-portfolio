import { useState, useEffect, useCallback } from 'react';
import { useTerminalContext } from '../../context/TerminalContext';

export const Resume = () => {
  const { isActive } = useTerminalContext();
  const [dismissed, setDismissed] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const handleDownload = useCallback(() => {
    if (!isActive) return;
    const link = document.createElement('a');
    link.href = '/filesystem/home/visitor/Documents/Resume.pdf';
    link.download = 'Jonathan_Hu_Resume.pdf';
    link.click();
    setAction('Downloading resume...');
  }, [isActive]);

  const handleCancel = useCallback(() => {
    if (!isActive) return;
    setDismissed(true);
  }, [isActive]);

  // Listen for keyboard shortcuts - only when active
  useEffect(() => {
    if (dismissed || action || !isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'd') {
        e.preventDefault();
        handleDownload();
      } else if (key === 'c' || key === 'escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismissed, action, isActive, handleDownload, handleCancel]);

  if (dismissed) {
    return <p className="text-text-muted">Cancelled.</p>;
  }

  if (action) {
    return <p className="text-accent">{action}</p>;
  }

  return (
    <div className="text-text-primary">
      <p className="text-text-muted text-xs">// Resume</p>
      <br />
      <p className="text-text-secondary">What would you like to do?</p>
      <br />
      <div className="flex flex-col gap-2">
        <button
          className={`flex items-center gap-4 px-4 py-3 bg-accent/5 border border-border rounded cursor-pointer font-mono text-sm text-left transition-all hover:bg-accent/10 hover:border-accent disabled:cursor-default disabled:opacity-70 ${!isActive ? '[&_.option-key]:text-text-muted' : ''}`}
          onClick={handleDownload}
          disabled={!isActive}
        >
          <span className="option-key text-accent font-semibold">[D]</span>
          <span className="text-text-primary">Download PDF</span>
        </button>
        <button
          className={`flex items-center gap-4 px-4 py-3 bg-transparent border border-border rounded cursor-pointer font-mono text-sm text-left transition-all hover:bg-error/10 hover:border-error disabled:cursor-default disabled:opacity-70 ${!isActive ? '[&_.option-key]:text-text-muted' : ''}`}
          onClick={handleCancel}
          disabled={!isActive}
        >
          <span className="option-key text-error font-semibold">[C]</span>
          <span className="text-text-primary">Cancel</span>
        </button>
      </div>
      {isActive && (
        <>
          <br />
          <p className="text-text-muted text-xs">Press D or C to select an option.</p>
        </>
      )}
    </div>
  );
};
