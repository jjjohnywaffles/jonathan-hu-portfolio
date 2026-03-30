import { useState, useEffect, useRef } from 'react';
import type { AppComponentProps } from '../../types/window';

const MIN_PROGRESSIVE_WPM = 200;
const MAX_PROGRESSIVE_WPM = 900;

function getProgressiveWpm(index: number, total: number): number {
  const t = total > 1 ? index / (total - 1) : 0;
  return Math.round(MIN_PROGRESSIVE_WPM + t * (MAX_PROGRESSIVE_WPM - MIN_PROGRESSIVE_WPM));
}

export const SpeedReadReaderApp = ({ data }: AppComponentProps) => {
  const text = (data?.text as string) || '';
  const initialWpm = (data?.wpm as number) || 300;
  const progressive = (data?.progressive as boolean) || false;

  const words = text.split(/\s+/).filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(initialWpm);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalWords = words.length;
  const effectiveWpm = progressive ? getProgressiveWpm(currentIndex, totalWords) : wpm;
  const msPerWord = 60000 / effectiveWpm;

  const clearTimer = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const play = () => {
    if (isFinished) return;
    setIsPlaying(true);
    if (!hasStarted) setHasStarted(true);
  };

  const pause = () => {
    setIsPlaying(false);
    clearTimer();
  };

  const reset = () => {
    pause();
    setCurrentIndex(0);
    setIsFinished(false);
    setHasStarted(false);
  };

  const skipForward = () => {
    setCurrentIndex((i) => {
      const next = Math.min(i + 10, totalWords - 1);
      if (next >= totalWords - 1) {
        setIsFinished(true);
        setIsPlaying(false);
      }
      return next;
    });
  };

  const skipBackward = () => {
    setCurrentIndex((i) => {
      const next = Math.max(i - 10, 0);
      if (isFinished) setIsFinished(false);
      return next;
    });
  };

  // Playback timer — uses setTimeout so delay can change per word in progressive mode
  useEffect(() => {
    clearTimer();
    if (!isPlaying || isFinished) return;

    intervalRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= totalWords) {
          setIsPlaying(false);
          setIsFinished(true);
          return prev;
        }
        return next;
      });
    }, msPerWord);

    return clearTimer;
  }, [isPlaying, isFinished, msPerWord, totalWords, currentIndex]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        if (isPlaying) {
          pause();
        } else {
          play();
        }
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        skipForward();
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        skipBackward();
      } else if (e.key === 'r') {
        reset();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const progress = totalWords > 0 ? ((currentIndex + 1) / totalWords) * 100 : 0;
  const currentWord = words[currentIndex] || '';

  // Pivot: prefer the vowel closest to the center; fall back to ORP (1/3 position)
  const vowels = 'aeiouAEIOU';
  const center = (currentWord.length - 1) / 2;
  const orpIndex =
    currentWord.length <= 3
      ? Math.floor(currentWord.length / 2)
      : Math.floor(currentWord.length / 3);
  let pivotIndex = orpIndex;
  let bestDist = Infinity;
  for (let i = 0; i < currentWord.length; i++) {
    if (vowels.includes(currentWord[i]) && Math.abs(i - center) < bestDist) {
      bestDist = Math.abs(i - center);
      pivotIndex = i;
    }
  }
  const before = currentWord.slice(0, pivotIndex);
  const pivot = currentWord[pivotIndex] || '';
  const after = currentWord.slice(pivotIndex + 1);

  if (!text) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg-primary">
        <p className="font-mono text-sm text-text-muted">No text provided.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-bg-primary">
      {/* Word Display */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        {!hasStarted ? (
          <div className="flex flex-col items-center gap-4">
            <p className="font-mono text-sm text-text-secondary">
              {totalWords} words {progressive ? '(200 → 900 WPM)' : `at ${wpm} WPM`}
            </p>
            <button
              onClick={play}
              className="rounded-lg bg-accent px-8 py-3 font-mono text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/80"
            >
              Start Reading
            </button>
            <p className="font-mono text-xs text-text-muted">Press Space to start</p>
          </div>
        ) : isFinished ? (
          <div className="flex flex-col items-center gap-4">
            <p className="font-mono text-lg text-text-primary">Done!</p>
            <p className="font-mono text-sm text-text-secondary">{totalWords} words read</p>
            <button
              onClick={reset}
              className="rounded-lg border border-border px-6 py-2.5 font-mono text-sm text-text-secondary transition-colors hover:bg-bg-terminal hover:text-text-primary"
            >
              Read Again
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-2">
            {/* Top pivot indicator */}
            <div className="mb-1 h-1.5 w-0.5 bg-accent/60" />

            {/* Three-column layout: before (right-aligned) | pivot (fixed center) | after (left-aligned) */}
            <div className="flex w-full items-baseline font-mono text-4xl font-bold">
              <span className="flex-1 overflow-hidden text-right text-text-secondary whitespace-nowrap">
                {before}
              </span>
              <span className="shrink-0 text-accent">{pivot}</span>
              <span className="flex-1 overflow-hidden text-left text-text-secondary whitespace-nowrap">
                {after}
              </span>
            </div>

            {/* Bottom pivot indicator */}
            <div className="mt-1 h-1.5 w-0.5 bg-accent/60" />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-4">
        <div
          className="h-1 w-full cursor-pointer rounded-full bg-bg-terminal"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const idx = Math.round(pct * (totalWords - 1));
            setCurrentIndex(Math.max(0, Math.min(idx, totalWords - 1)));
            if (isFinished) setIsFinished(false);
          }}
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 border-t border-border p-4">
        <div className="flex items-center justify-between">
          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={skipBackward}
              className="rounded-md p-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-terminal hover:text-text-primary"
              title="Back 10 words (←)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>

            <button
              onClick={isPlaying ? pause : play}
              disabled={isFinished}
              className="rounded-lg bg-accent p-2.5 text-bg-primary transition-colors hover:bg-accent/80 disabled:opacity-30"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button
              onClick={skipForward}
              className="rounded-md p-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-terminal hover:text-text-primary"
              title="Forward 10 words (→)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>

            <button
              onClick={reset}
              className="ml-1 rounded-md p-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-terminal hover:text-text-primary"
              title="Reset (R)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
          </div>

          {/* Word counter */}
          <span className="font-mono text-xs text-text-muted">
            {currentIndex + 1} / {totalWords}
          </span>

          {/* WPM control */}
          {progressive ? (
            <span className="font-mono text-xs text-accent">{effectiveWpm} WPM</span>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={wpm}
                onChange={(e) => {
                  const v = Math.max(100, Math.min(1000, Number(e.target.value) || 100));
                  setWpm(v);
                }}
                className="w-14 rounded border border-border bg-bg-terminal px-1.5 py-1 text-center font-mono text-xs text-accent focus:border-accent focus:outline-none"
                min={100}
                max={1000}
                step={25}
              />
              <span className="font-mono text-xs text-text-muted">WPM</span>
            </div>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="flex justify-center gap-4 font-mono text-[10px] text-text-muted">
          <span>Space: play/pause</span>
          <span>←→: skip 10</span>
          <span>R: reset</span>
        </div>
      </div>
    </div>
  );
};
