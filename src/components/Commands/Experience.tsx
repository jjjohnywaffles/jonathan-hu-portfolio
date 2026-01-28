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
      <div className="terminal-experience">
        <p className="section-label">// Experience &gt; {exp.company}</p>
        <br />
        <div className="exp-detail">
          <div className="exp-header">
            <span className="exp-title">{exp.title}</span>
            <span className="exp-period">{exp.period}</span>
          </div>
          <div className="exp-subheader">
            <span className="exp-company">{exp.company}</span>
            <span className="exp-location">{exp.location}</span>
          </div>
          {exp.summary && <p className="exp-summary">{exp.summary}</p>}
          {exp.sections ? (
            <div className="exp-sections">
              {exp.sections.map((section, sIdx) => (
                <div key={sIdx} className="exp-section">
                  {section.header && <p className="exp-section-header">{section.header}</p>}
                  <ul className="exp-points">
                    {section.points.map((point, pIdx) => (
                      <li key={pIdx}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            exp.points && (
              <ul className="exp-points">
                {exp.points.map((point, pIdx) => (
                  <li key={pIdx}>{point}</li>
                ))}
              </ul>
            )
          )}
        </div>
        {isActive && (
          <>
            <br />
            <button className="exp-back-btn" onClick={handleBack}>
              <span className="option-key">[ESC]</span>
              <span className="option-text">Back to list</span>
            </button>
          </>
        )}
      </div>
    );
  }

  // Show list view
  return (
    <div className="terminal-experience">
      <p className="section-label">// Work Experience</p>
      <br />
      <div className={`exp-list ${!isActive ? 'disabled' : ''}`}>
        {portfolioData.experience.map((exp, index) => (
          <button
            key={exp.id}
            className="exp-list-item"
            onClick={() => handleSelect(index)}
            disabled={!isActive}
          >
            <span className="exp-list-key">[{index + 1}]</span>
            <div className="exp-list-info">
              <span className="exp-list-title">{exp.title}</span>
              <span className="exp-list-company">{exp.company}</span>
            </div>
            <span className="exp-list-period">{exp.period}</span>
          </button>
        ))}
      </div>
      {isActive && (
        <>
          <br />
          <p className="exp-hint">
            Press 1-{portfolioData.experience.length} or click to view details.
          </p>
        </>
      )}
    </div>
  );
};
