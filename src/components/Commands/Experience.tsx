import { useState, useEffect, useCallback } from 'react';
import { portfolioData } from '../../data/portfolio';
import { useTerminalContext } from '../../context/TerminalContext';

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
        <p className="text-text-muted text-xs">// Experience &gt; {exp.company}</p>
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
            <button
              className="inline-flex items-center gap-3 px-4 py-2 bg-transparent border border-border rounded cursor-pointer font-mono text-sm transition-all hover:bg-accent-secondary/10 hover:border-accent-secondary"
              onClick={handleBack}
            >
              <span className="text-accent-secondary">[ESC]</span>
              <span className="text-text-primary">Back to list</span>
            </button>
          </>
        )}
      </div>
    );
  }

  // Show list view
  return (
    <div className="text-text-primary">
      <p className="text-text-muted text-xs">// Work Experience</p>
      <br />
      <div className="flex flex-col gap-2">
        {portfolioData.experience.map((exp, index) => (
          <button
            key={exp.id}
            className={`flex items-center gap-4 px-4 py-3 bg-accent/5 border border-border rounded cursor-pointer font-mono text-sm text-left transition-all w-full hover:bg-accent/10 hover:border-accent disabled:cursor-default disabled:opacity-70 ${!isActive ? '[&_.exp-list-key]:text-text-muted' : ''}`}
            onClick={() => handleSelect(index)}
            disabled={!isActive}
          >
            <span className="exp-list-key text-accent font-semibold shrink-0">[{index + 1}]</span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-text-primary font-medium">{exp.title}</span>
              <span className="text-text-secondary text-xs">{exp.company}</span>
            </div>
            <span className="text-text-muted text-xs shrink-0">{exp.period}</span>
          </button>
        ))}
      </div>
      {isActive && (
        <>
          <br />
          <p className="text-text-muted text-xs">
            Press 1-{portfolioData.experience.length} or click to view details.
          </p>
        </>
      )}
    </div>
  );
};
