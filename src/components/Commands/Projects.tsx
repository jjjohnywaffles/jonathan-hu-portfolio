import { useState, useEffect, useCallback, useMemo } from 'react';
import { portfolioData } from '../../data/portfolio';
import { useTerminalContext } from '../../context/TerminalContext';
import { CommandHeader, ListItemButton, InlineConfirm, ListHint } from './CommandList';

export const Projects = () => {
  const { isActive } = useTerminalContext();
  const allProjects = useMemo(
    () => [...portfolioData.portfolioProjects, ...portfolioData.interactiveProjects],
    []
  );
  const portfolioCount = portfolioData.portfolioProjects.length;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = useCallback(
    (index: number) => {
      if (!isActive) return;
      setSelectedIndex((prev) => (prev === index ? null : index));
    },
    [isActive]
  );

  const handleBack = useCallback(() => {
    if (!isActive) return;
    setSelectedIndex(null);
  }, [isActive]);

  const handleConfirmOpen = useCallback(() => {
    if (!isActive || selectedIndex === null) return;
    const project = allProjects[selectedIndex];
    window.open(project.link, '_blank', 'noopener,noreferrer');
    setSelectedIndex(null);
  }, [isActive, selectedIndex, allProjects]);

  // Keyboard navigation - only when active
  // Uses capture phase so Enter is intercepted before the terminal input consumes it
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      if (selectedIndex !== null) {
        if (key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          handleConfirmOpen();
        } else if (key === 'Escape') {
          e.preventDefault();
          handleBack();
        }
      } else {
        const num = parseInt(key);
        if (num >= 1 && num <= allProjects.length) {
          e.preventDefault();
          handleSelect(num - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, selectedIndex, allProjects.length, handleSelect, handleBack, handleConfirmOpen]);

  const renderItem = (project: (typeof allProjects)[number], globalIndex: number) => (
    <div key={project.id}>
      <ListItemButton
        index={globalIndex + 1}
        title={project.title}
        subtitle={project.description}
        isActive={isActive}
        selected={selectedIndex === globalIndex}
        onSelect={() => handleSelect(globalIndex)}
      />
      {selectedIndex === globalIndex && (
        <InlineConfirm
          label="Open in new tab?"
          url={project.link}
          onConfirm={handleConfirmOpen}
          onCancel={handleBack}
        />
      )}
    </div>
  );

  return (
    <div className="text-text-primary">
      <CommandHeader>Projects</CommandHeader>
      <br />
      <p className="text-accent font-semibold mb-2 text-xs uppercase tracking-wide">
        Portfolio Projects
      </p>
      <div className="flex flex-col gap-2">
        {portfolioData.portfolioProjects.map((project, index) => renderItem(project, index))}
      </div>
      <br />
      <p className="text-accent font-semibold mb-2 text-xs uppercase tracking-wide">
        Interactive Projects
      </p>
      <div className="flex flex-col gap-2">
        {portfolioData.interactiveProjects.map((project, index) =>
          renderItem(project, portfolioCount + index)
        )}
      </div>
      {isActive && <ListHint>Press 1-{allProjects.length} or click to open a project.</ListHint>}
    </div>
  );
};
