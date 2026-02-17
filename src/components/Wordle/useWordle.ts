import { useState, useCallback, useEffect } from 'react';
import { loadWords, getDailyWord, getRandomWord, isValidWord } from './words';

export type TileState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';
export type GameStatus = 'playing' | 'won' | 'lost';
export type GameMode = 'daily' | 'free';

interface GameState {
  targetWord: string;
  dayIndex: number;
  guesses: string[];
  gameStatus: GameStatus;
  mode: GameMode;
}

interface WordleStats {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
}

const GAME_STATE_KEY = 'wordle-game-state';
const STATS_KEY = 'wordle-stats';
const DAILY_COMPLETED_KEY = 'wordle-daily-completed';
const MAX_GUESSES = 6;

function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function saveGameState(state: GameState) {
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
}

function loadStats(): WordleStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) throw new Error();
    return JSON.parse(raw) as WordleStats;
  } catch {
    return {
      gamesPlayed: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: [0, 0, 0, 0, 0, 0],
    };
  }
}

function saveStats(stats: WordleStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function getDailyCompleted(): number | null {
  try {
    const raw = localStorage.getItem(DAILY_COMPLETED_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as number;
  } catch {
    return null;
  }
}

function saveDailyCompleted(dayIndex: number) {
  localStorage.setItem(DAILY_COMPLETED_KEY, JSON.stringify(dayIndex));
}

export function evaluateGuess(guess: string, target: string): TileState[] {
  const result: TileState[] = Array(5).fill('absent');
  const targetCounts: Record<string, number> = {};

  for (const ch of target) {
    targetCounts[ch] = (targetCounts[ch] || 0) + 1;
  }

  // First pass: correct positions
  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'correct';
      targetCounts[guess[i]]--;
    }
  }

  // Second pass: present letters
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    if (targetCounts[guess[i]] > 0) {
      result[i] = 'present';
      targetCounts[guess[i]]--;
    }
  }

  return result;
}

export function useWordle() {
  const [wordsReady, setWordsReady] = useState(false);
  const [targetWord, setTargetWord] = useState('');
  const [dayIndex, setDayIndex] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [currentGuess, setCurrentGuess] = useState('');
  const [shakeRow, setShakeRow] = useState(false);
  const [revealRow, setRevealRow] = useState<number | null>(null);
  const [bounceRow, setBounceRow] = useState<number | null>(null);
  const [stats, setStats] = useState<WordleStats>(loadStats);

  // Check if a new daily puzzle is available (not yet completed)
  const checkDailyAvailable = useCallback(() => {
    if (!wordsReady) return;
    const { dayIndex: currentDi } = getDailyWord();
    const dailyCompleted = getDailyCompleted();
    setDayIndex(currentDi);
    setDailyAvailable(dailyCompleted !== currentDi);
  }, [wordsReady]);

  // Load word lists, then initialize game state
  useEffect(() => {
    loadWords().then(() => {
      const { word: dailyWord, dayIndex: di } = getDailyWord();
      const saved = loadGameState();
      const dailyCompleted = getDailyCompleted();

      const isDailyDone = dailyCompleted === di;

      if (saved && saved.dayIndex === di && saved.mode === 'daily') {
        // Restore in-progress or completed daily game
        setTargetWord(saved.targetWord);
        setDayIndex(di);
        setGuesses(saved.guesses);
        setGameStatus(saved.gameStatus);
        setGameMode('daily');
      } else if (saved && saved.mode === 'free' && saved.gameStatus === 'playing') {
        // Restore in-progress free play game
        setTargetWord(saved.targetWord);
        setDayIndex(di);
        setGuesses(saved.guesses);
        setGameStatus(saved.gameStatus);
        setGameMode('free');
        // If the daily hasn't been completed, show the button
        setDailyAvailable(!isDailyDone);
      } else if (isDailyDone) {
        // Daily already completed, start free play
        setTargetWord(getRandomWord());
        setDayIndex(di);
        setGameMode('free');
      } else {
        // Fresh daily game
        setTargetWord(dailyWord);
        setDayIndex(di);
        setGameMode('daily');
      }

      setWordsReady(true);
    });
  }, []);

  // Poll for new daily puzzle every 60 seconds
  useEffect(() => {
    if (!wordsReady) return;
    const interval = setInterval(checkDailyAvailable, 60_000);
    return () => clearInterval(interval);
  }, [wordsReady, checkDailyAvailable]);

  // Persist game state on change
  useEffect(() => {
    if (!wordsReady) return;
    saveGameState({ targetWord, dayIndex, guesses, gameStatus, mode: gameMode });
  }, [wordsReady, targetWord, dayIndex, guesses, gameStatus, gameMode]);

  // Persist stats on change
  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const addLetter = useCallback(
    (letter: string) => {
      if (gameStatus !== 'playing') return;
      if (currentGuess.length >= 5) return;
      setCurrentGuess((prev) => prev + letter.toLowerCase());
    },
    [gameStatus, currentGuess.length]
  );

  const removeLetter = useCallback(() => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [gameStatus]);

  const submitGuess = useCallback(() => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length !== 5) return;

    if (!isValidWord(currentGuess)) {
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    const rowIndex = guesses.length;

    setRevealRow(rowIndex);

    // After reveal animation completes, update game status
    const revealDuration = 5 * 150 + 500; // 5 tiles * 150ms delay + 500ms flip
    setTimeout(() => {
      setRevealRow(null);

      if (currentGuess === targetWord) {
        setGameStatus('won');
        setBounceRow(rowIndex);
        setTimeout(() => setBounceRow(null), 1500);
        if (gameMode === 'daily') {
          saveDailyCompleted(dayIndex);
          setDailyAvailable(false);
        }
        setStats((prev) => {
          const newStreak = prev.currentStreak + 1;
          const newDist = [...prev.guessDistribution];
          newDist[rowIndex] = (newDist[rowIndex] || 0) + 1;
          return {
            gamesPlayed: prev.gamesPlayed + 1,
            wins: prev.wins + 1,
            currentStreak: newStreak,
            maxStreak: Math.max(prev.maxStreak, newStreak),
            guessDistribution: newDist,
          };
        });
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameStatus('lost');
        if (gameMode === 'daily') {
          saveDailyCompleted(dayIndex);
          setDailyAvailable(false);
        }
        setStats((prev) => ({
          ...prev,
          gamesPlayed: prev.gamesPlayed + 1,
          currentStreak: 0,
        }));
      }
    }, revealDuration);

    setGuesses(newGuesses);
    setCurrentGuess('');
  }, [gameStatus, currentGuess, guesses, targetWord, gameMode, dayIndex]);

  const getTileState = useCallback(
    (rowIndex: number, colIndex: number): TileState => {
      if (rowIndex >= guesses.length) {
        // Current or future row
        if (rowIndex === guesses.length) {
          return currentGuess[colIndex] ? 'tbd' : 'empty';
        }
        return 'empty';
      }

      // Past guess — always return real evaluated state
      // (Tile component handles reveal timing via its own animation)
      const guess = guesses[rowIndex];
      return evaluateGuess(guess, targetWord)[colIndex];
    },
    [guesses, currentGuess, targetWord]
  );

  const getLetterStates = useCallback((): Map<string, TileState> => {
    const map = new Map<string, TileState>();

    for (const guess of guesses) {
      const states = evaluateGuess(guess, targetWord);
      for (let i = 0; i < 5; i++) {
        const letter = guess[i];
        const state = states[i];
        const existing = map.get(letter);

        // Priority: correct > present > absent
        if (state === 'correct') {
          map.set(letter, 'correct');
        } else if (state === 'present' && existing !== 'correct') {
          map.set(letter, 'present');
        } else if (!existing) {
          map.set(letter, 'absent');
        }
      }
    }

    return map;
  }, [guesses, targetWord]);

  const newGame = useCallback(() => {
    setTargetWord(getRandomWord());
    setGuesses([]);
    setGameStatus('playing');
    setGameMode('free');
    setCurrentGuess('');
    setRevealRow(null);
    setBounceRow(null);
    setShakeRow(false);
    // Check if a new daily became available while playing
    checkDailyAvailable();
  }, [checkDailyAvailable]);

  const playDaily = useCallback(() => {
    const { word: dailyWord, dayIndex: di } = getDailyWord();
    setTargetWord(dailyWord);
    setDayIndex(di);
    setGuesses([]);
    setGameStatus('playing');
    setGameMode('daily');
    setDailyAvailable(false);
    setCurrentGuess('');
    setRevealRow(null);
    setBounceRow(null);
    setShakeRow(false);
  }, []);

  return {
    wordsReady,
    targetWord,
    dayIndex,
    guesses,
    currentGuess,
    gameStatus,
    gameMode,
    dailyAvailable,
    shakeRow,
    revealRow,
    bounceRow,
    stats,
    addLetter,
    removeLetter,
    submitGuess,
    newGame,
    playDaily,
    getTileState,
    getLetterStates,
  };
}
