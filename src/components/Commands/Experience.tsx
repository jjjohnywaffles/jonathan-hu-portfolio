import { useState, useEffect, useCallback } from 'react';
import { portfolioData } from '../../data/portfolio';
import { useTerminalContext } from '../../context/TerminalContext';
import { CommandHeader, ListItemButton, ActionButton, ListHint } from './CommandList';

export const Experience = () => {
  const { isActive } = useTerminalContext();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = useCallback(
    (index: number) => {
      if (!isActive) return;
      setSelectedIndex(index);
    },
    [isActive]
  );

  const handleBack = useCallback(() => {
    if (!isActive) return;
    setSelectedIndex(null);
  }, [isActive]);

  // Keyboard navigation - only when active
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      if (selectedIndex !== null) {
        // When viewing details, Escape goes back
        if (key === 'Escape') {
          e.preventDefault();
          handleBack();
        }
      } else {
        // When viewing list, number keys select an item
        const num = parseInt(key);
        if (num >= 1 && num <= portfolioData.experience.length) {
          e.preventDefault();
          handleSelect(num - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, selectedIndex, handleSelect, handleBack]);

  // Show detailed view for selected experience
  if (selectedIndex !== null) {
    const exp = portfolioData.experience[selectedIndex];
    return (
      <div className="text-text-primary">
        <CommandHeader>Experience &gt; {exp.company}</CommandHeader>
        <br />
        <div className="pl-2">
          <div className="flex justify-between items-baseline gap-4 flex-wrap max-md:flex-col max-md:gap-1">
            <span className="text-accent font-semibold">{exp.title}</span>
            <span className="text-text-muted text-xs">{exp.period}</span>
          </div>
          <div className="flex justify-between items-baseline gap-4 mb-2 flex-wrap max-md:flex-col max-md:gap-1">
            <span className="text-text-secondary">{exp.company}</span>
            <span className="text-text-muted text-xs">{exp.location}</span>
          </div>
          {exp.summary && (
            <p className="text-text-primary my-3 pl-4 border-l-2 border-border">{exp.summary}</p>
          )}
          {exp.sections ? (
            <div className="mt-3">
              {exp.sections.map((section, sIdx) => (
                <div key={sIdx} className="mb-4 last:mb-0">
                  {section.header && (
                    <p className="text-accent-secondary text-xs uppercase tracking-wide mb-2">
                      {section.header}
                    </p>
                  )}
                  <ul className="list-none pl-4">
                    {section.points.map((point, pIdx) => (
                      <li
                        key={pIdx}
                        className="text-text-secondary mb-1 relative before:content-['›'] before:absolute before:-left-4 before:text-text-muted"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            exp.points && (
              <ul className="list-none pl-4">
                {exp.points.map((point, pIdx) => (
                  <li
                    key={pIdx}
                    className="text-text-secondary mb-1 relative before:content-['›'] before:absolute before:-left-4 before:text-text-muted"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
        {isActive && (
          <>
            <br />
            <ActionButton keyLabel="ESC" onClick={handleBack}>
              Back to list
            </ActionButton>
          </>
        )}
      </div>
    );
  }

  // Show list view
  return (
    <div className="text-text-primary">
      <CommandHeader>Work Experience</CommandHeader>
      <br />
      <div className="flex flex-col gap-2">
        {portfolioData.experience.map((exp, index) => (
          <ListItemButton
            key={exp.id}
            index={index + 1}
            title={exp.title}
            subtitle={exp.company}
            trailing={exp.period}
            isActive={isActive}
            onSelect={() => handleSelect(index)}
          />
        ))}
      </div>
      {isActive && (
        <ListHint>Press 1-{portfolioData.experience.length} or click to view details.</ListHint>
      )}
    </div>
  );
};
