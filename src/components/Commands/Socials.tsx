import { useState, useEffect, useCallback } from 'react';
import { portfolioData } from '../../data/portfolio';
import { useTerminalContext } from '../../context/TerminalContext';
import { CommandHeader, ListItemButton, InlineConfirm, ListHint } from './CommandList';

export const Socials = () => {
  const { isActive } = useTerminalContext();
  const socials = portfolioData.socialLinks;

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
    const social = socials[selectedIndex];
    window.open(social.url, '_blank', 'noopener,noreferrer');
    setSelectedIndex(null);
  }, [isActive, selectedIndex, socials]);

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
        if (num >= 1 && num <= socials.length) {
          e.preventDefault();
          handleSelect(num - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, selectedIndex, socials.length, handleSelect, handleBack, handleConfirmOpen]);

  return (
    <div className="text-text-primary">
      <CommandHeader>Social Links</CommandHeader>
      <br />
      <div className="flex flex-col gap-2">
        {socials.map((social, index) => (
          <div key={social.id}>
            <ListItemButton
              index={index + 1}
              title={social.name}
              subtitle={social.url}
              isActive={isActive}
              selected={selectedIndex === index}
              onSelect={() => handleSelect(index)}
            />
            {selectedIndex === index && (
              <InlineConfirm
                label={`Open ${social.name}?`}
                url={social.url}
                onConfirm={handleConfirmOpen}
                onCancel={handleBack}
              />
            )}
          </div>
        ))}
      </div>
      {isActive && <ListHint>Press 1-{socials.length} or click to open a link.</ListHint>}
    </div>
  );
};
