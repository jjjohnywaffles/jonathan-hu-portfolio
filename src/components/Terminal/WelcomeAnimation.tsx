import { useState, useEffect, useCallback } from 'react';
import { ASCII_LINES, MAX_ASCII_LENGTH, WELCOME_TEXT_LINES, TYPING_TIMING } from './constants';

interface WelcomeAnimationProps {
  onComplete: () => void;
}

export const WelcomeAnimation = ({ onComplete }: WelcomeAnimationProps) => {
  const [asciiCharIndex, setAsciiCharIndex] = useState(0);
  const [isAsciiDone, setIsAsciiDone] = useState(false);
  const [textLineIndex, setTextLineIndex] = useState(0);
  const [textCharIndex, setTextCharIndex] = useState(0);
  const [displayedTextLines, setDisplayedTextLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Skip animation on key press
  const skipAnimation = useCallback(() => {
    setAsciiCharIndex(MAX_ASCII_LENGTH);
    setIsAsciiDone(true);
    setDisplayedTextLines(WELCOME_TEXT_LINES);
    setTextLineIndex(WELCOME_TEXT_LINES.length);
    setIsComplete(true);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const handleKeyPress = () => skipAnimation();
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [skipAnimation]);

  // Type ASCII art
  useEffect(() => {
    if (isComplete || isAsciiDone) return;

    if (asciiCharIndex >= MAX_ASCII_LENGTH) {
      const timer = setTimeout(() => {
        setIsAsciiDone(true);
        setDisplayedTextLines(['']);
      }, TYPING_TIMING.LINE_TRANSITION_DELAY);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setAsciiCharIndex((prev) => prev + 1);
    }, TYPING_TIMING.ASCII_CHAR_DELAY);

    return () => clearTimeout(timer);
  }, [isComplete, isAsciiDone, asciiCharIndex]);

  // Type text lines after ASCII is done
  useEffect(() => {
    if (isComplete || !isAsciiDone) return;

    // Check if all done
    if (textLineIndex >= WELCOME_TEXT_LINES.length) {
      const timer = setTimeout(() => {
        setIsComplete(true);
        onComplete();
      }, TYPING_TIMING.WELCOME_COMPLETE_DELAY);
      return () => clearTimeout(timer);
    }

    const currentLine = WELCOME_TEXT_LINES[textLineIndex];

    // If current line is fully typed, move to next
    if (textCharIndex >= currentLine.length) {
      const timer = setTimeout(() => {
        setDisplayedTextLines((prev) => [...prev.slice(0, -1), currentLine]);
        setTextLineIndex((prev) => prev + 1);
        setTextCharIndex(0);
        if (textLineIndex + 1 < WELCOME_TEXT_LINES.length) {
          setDisplayedTextLines((prev) => [...prev, '']);
        }
      }, TYPING_TIMING.LINE_TRANSITION_DELAY);
      return () => clearTimeout(timer);
    }

    // Type next character
    const timer = setTimeout(() => {
      const partialLine = currentLine.slice(0, textCharIndex + 1);
      setDisplayedTextLines((prev) => {
        if (prev.length === 0) return [partialLine];
        return [...prev.slice(0, -1), partialLine];
      });
      setTextCharIndex((prev) => prev + 1);
    }, TYPING_TIMING.TEXT_CHAR_DELAY);

    return () => clearTimeout(timer);
  }, [isComplete, isAsciiDone, textLineIndex, textCharIndex, onComplete]);

  const renderTextLine = (line: string, index: number) => {
    const isTitle = index === 1;
    const isTagline = index === 2;
    const isHint = index === 4;

    if (isTitle) {
      return (
        <p key={`text-${index}`} className="welcome-title">
          {line}
        </p>
      );
    }
    if (isTagline) {
      return (
        <p key={`text-${index}`} className="welcome-tagline">
          {line}
        </p>
      );
    }
    if (isHint) {
      return (
        <p key={`text-${index}`} className="welcome-hint">
          {line.includes('help') ? (
            <>
              Type <span className="cmd-highlight">help</span> to see available commands.
            </>
          ) : (
            line
          )}
        </p>
      );
    }
    return (
      <p key={`text-${index}`} className="welcome-spacer">
        {line || '\u00A0'}
      </p>
    );
  };

  return (
    <div className="terminal-welcome typing">
      {/* ASCII art - all lines typing simultaneously */}
      {ASCII_LINES.map((line, index) => (
        <pre key={index} className="ascii-art-line">
          {line.slice(0, asciiCharIndex)}
        </pre>
      ))}
      {/* Text lines after ASCII */}
      {displayedTextLines.map(renderTextLine)}
      {!isComplete && <span className="terminal-cursor typing-cursor" />}
    </div>
  );
};
