import { useEffect, useCallback, useState, useRef } from 'react';
import type { AppComponentProps } from '../../types/window';
import { useWordle } from './useWordle';
import type { TileState, GameStatus } from './useWordle';

// --- Tile colors ---
function tileColorClass(state: TileState): string {
  switch (state) {
    case 'correct':
      return 'bg-emerald-600 border-emerald-600';
    case 'present':
      return 'bg-amber-600 border-amber-600';
    case 'absent':
      return 'bg-neutral-700 border-neutral-700';
    case 'tbd':
      return 'bg-transparent border-text-muted border-2';
    case 'empty':
    default:
      return 'bg-transparent border-border';
  }
}

function keyColorClass(state: TileState | undefined): string {
  switch (state) {
    case 'correct':
      return 'bg-emerald-600 text-white';
    case 'present':
      return 'bg-amber-600 text-white';
    case 'absent':
      return 'bg-neutral-800 text-text-muted';
    default:
      return 'bg-bg-header text-text-primary';
  }
}

// --- Tile ---
const Tile = ({
  letter,
  state,
  isRevealing,
  delay,
  isBouncing,
  bounceDelay,
}: {
  letter: string;
  state: TileState;
  isRevealing: boolean;
  delay: number;
  isBouncing: boolean;
  bounceDelay: number;
}) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isRevealing) return;
    const timer = setTimeout(() => setRevealed(true), delay + 250);
    return () => {
      clearTimeout(timer);
      setRevealed(false);
    };
  }, [isRevealing, delay]);

  const displayState = isRevealing ? (revealed ? state : 'tbd') : state;

  return (
    <div
      className={`w-[52px] h-[52px] flex items-center justify-center text-xl font-bold uppercase border rounded select-none ${tileColorClass(displayState)} ${
        isRevealing ? 'animate-flip-tile' : ''
      } ${isBouncing ? 'animate-bounce-tile' : ''} ${letter && !isRevealing && state === 'tbd' ? 'scale-105' : ''} transition-transform duration-100`}
      style={{
        animationDelay: isRevealing ? `${delay}ms` : isBouncing ? `${bounceDelay}ms` : undefined,
        animationFillMode: 'both',
      }}
    >
      <span className="text-white">{letter}</span>
    </div>
  );
};

// --- Board Row ---
const Row = ({
  guess,
  currentGuess,
  isCurrentRow,
  tileStates,
  isRevealing,
  isShaking,
  isBouncing,
}: {
  guess?: string;
  currentGuess?: string;
  isCurrentRow: boolean;
  tileStates: TileState[];
  isRevealing: boolean;
  isShaking: boolean;
  isBouncing: boolean;
}) => {
  const letters = isCurrentRow
    ? (currentGuess || '').padEnd(5, ' ').split('')
    : (guess || '').padEnd(5, ' ').split('');

  return (
    <div className={`flex gap-1 ${isShaking ? 'animate-shake' : ''}`}>
      {letters.map((letter, i) => (
        <Tile
          key={i}
          letter={letter.trim()}
          state={tileStates[i]}
          isRevealing={isRevealing}
          delay={i * 150}
          isBouncing={isBouncing}
          bounceDelay={i * 100}
        />
      ))}
    </div>
  );
};

// --- Keyboard ---
const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
];

const Keyboard = ({
  letterStates,
  onKey,
}: {
  letterStates: Map<string, TileState>;
  onKey: (key: string) => void;
}) => {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((key) => {
            const isWide = key === 'enter' || key === 'backspace';
            const label = key === 'backspace' ? '⌫' : key.toUpperCase();
            const state = letterStates.get(key);

            return (
              <button
                key={key}
                className={`${isWide ? 'px-3 min-w-[58px]' : 'min-w-[32px]'} h-[46px] rounded font-mono text-xs font-bold uppercase flex items-center justify-center cursor-pointer transition-colors ${keyColorClass(state)}`}
                onClick={() => onKey(key)}
              >
                {label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// --- Stats Modal ---
const StatsModal = ({
  stats,
  gameStatus,
  targetWord,
  guesses,
  onClose,
  onNewGame,
  animate,
}: {
  stats: {
    gamesPlayed: number;
    wins: number;
    currentStreak: number;
    maxStreak: number;
    guessDistribution: number[];
  };
  gameStatus: GameStatus;
  targetWord: string;
  guesses: string[];
  onClose: () => void;
  onNewGame: () => void;
  animate: boolean;
}) => {
  const winPct = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  const maxDist = Math.max(...stats.guessDistribution, 1);

  return (
    <div
      className={`absolute inset-0 z-50 flex items-start justify-center pt-16 ${animate ? 'animate-fade-in' : ''} bg-black/70`}
      onClick={onClose}
    >
      <div
        className={`bg-bg-terminal border border-border rounded-lg p-6 w-[340px] max-h-[90%] overflow-auto ${animate ? 'animate-slide-down' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-text-primary text-center text-lg font-bold mb-4">Statistics</h2>

        {/* Stat numbers */}
        <div className="flex justify-around mb-6">
          {[
            { value: stats.gamesPlayed, label: 'Played' },
            { value: winPct, label: 'Win %' },
            { value: stats.currentStreak, label: 'Current\nStreak' },
            { value: stats.maxStreak, label: 'Max\nStreak' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-2xl font-bold text-text-primary">{value}</span>
              <span className="text-[10px] text-text-muted whitespace-pre-line text-center">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Guess distribution */}
        <h3 className="text-text-secondary text-sm font-semibold mb-2">Guess Distribution</h3>
        <div className="flex flex-col gap-1 mb-4">
          {stats.guessDistribution.map((count, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-text-muted text-xs w-3">{i + 1}</span>
              <div
                className={`h-5 rounded-sm flex items-center justify-end px-1.5 text-xs font-bold text-white ${
                  gameStatus === 'won' && guesses.length === i + 1
                    ? 'bg-emerald-600'
                    : 'bg-neutral-600'
                }`}
                style={{ width: `${Math.max((count / maxDist) * 100, 8)}%` }}
              >
                {count}
              </div>
            </div>
          ))}
        </div>

        {/* Game over message */}
        {gameStatus !== 'playing' && (
          <div className="text-center mb-4">
            {gameStatus === 'lost' && (
              <p className="text-text-secondary text-sm">
                The word was <span className="text-accent font-bold uppercase">{targetWord}</span>
              </p>
            )}
            <button
              className="mt-3 px-6 py-2 bg-emerald-600 text-white rounded font-mono text-sm font-bold cursor-pointer hover:bg-emerald-500 transition-colors"
              onClick={() => {
                onNewGame();
                onClose();
              }}
            >
              New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---
export const WordleApp = ({ isFocused }: AppComponentProps) => {
  const {
    wordsReady,
    dayIndex,
    targetWord,
    guesses,
    currentGuess,
    gameStatus,
    shakeRow,
    revealRow,
    bounceRow,
    stats,
    addLetter,
    removeLetter,
    submitGuess,
    newGame,
    getTileState,
    getLetterStates,
  } = useWordle();

  const [showStats, setShowStats] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const prevGameStatusRef = useRef(gameStatus);

  // Auto-show stats when gameStatus transitions to won/lost
  // (gameStatus changes after the last tile finishes flipping in useWordle)
  useEffect(() => {
    const prev = prevGameStatusRef.current;
    prevGameStatusRef.current = gameStatus;

    if (prev === 'playing' && (gameStatus === 'won' || gameStatus === 'lost')) {
      const delay = gameStatus === 'won' ? 1200 : 200;
      const timer = setTimeout(() => {
        setAnimateStats(true);
        setShowStats(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [gameStatus]);

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'enter') {
        submitGuess();
      } else if (key === 'backspace') {
        removeLetter();
      } else if (key.length === 1 && key >= 'a' && key <= 'z') {
        addLetter(key);
      }
    },
    [submitGuess, removeLetter, addLetter]
  );

  // Physical keyboard input — only when focused
  useEffect(() => {
    if (!isFocused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'enter') {
        e.preventDefault();
        e.stopPropagation();
        handleKey('enter');
      } else if (key === 'backspace') {
        e.preventDefault();
        handleKey('backspace');
      } else if (key.length === 1 && key >= 'a' && key <= 'z') {
        e.preventDefault();
        handleKey(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isFocused, handleKey]);

  const letterStates = getLetterStates();

  // Build rows
  const rows = Array.from({ length: 6 }, (_, i) => {
    const guess = guesses[i];
    const isCurrentRow = i === guesses.length && gameStatus === 'playing';
    const tileStates: TileState[] = Array.from({ length: 5 }, (_, j) => getTileState(i, j));

    return (
      <Row
        key={i}
        guess={guess}
        currentGuess={isCurrentRow ? currentGuess : undefined}
        isCurrentRow={isCurrentRow}
        tileStates={tileStates}
        isRevealing={revealRow === i}
        isShaking={shakeRow && isCurrentRow}
        isBouncing={bounceRow === i}
      />
    );
  });

  if (!wordsReady) {
    return (
      <div className="w-full h-full bg-bg-secondary flex items-center justify-center">
        <span className="text-text-muted text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-bg-secondary flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-text-muted text-xs">#{dayIndex}</span>
        <span className="absolute left-1/2 -translate-x-1/2 text-text-primary font-bold text-sm tracking-widest uppercase pointer-events-none">
          Wordle
        </span>
        <div className="flex items-center gap-2">
          {gameStatus !== 'playing' && (
            <button
              className="px-2 py-0.5 bg-emerald-600 text-white rounded text-xs font-mono font-bold cursor-pointer hover:bg-emerald-500 transition-colors"
              onClick={newGame}
            >
              New Game
            </button>
          )}
          <button
            className="text-text-muted hover:text-text-primary text-xs cursor-pointer transition-colors"
            onClick={() => {
              setAnimateStats(false);
              setShowStats(true);
            }}
          >
            Stats
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1 p-4">{rows}</div>

      {/* Keyboard */}
      <div className="pb-3 px-2">
        <Keyboard letterStates={letterStates} onKey={handleKey} />
      </div>

      {/* Stats modal */}
      {showStats && (
        <StatsModal
          stats={stats}
          gameStatus={gameStatus}
          targetWord={targetWord}
          guesses={guesses}
          onClose={() => {
            setShowStats(false);
            setAnimateStats(false);
          }}
          onNewGame={newGame}
          animate={animateStats}
        />
      )}
    </div>
  );
};
