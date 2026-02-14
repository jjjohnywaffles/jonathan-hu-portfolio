const EPOCH = new Date('2024-01-01').getTime();

let targetWords: string[] = [];
let validGuesses: Set<string> = new Set();
let loaded = false;
let loadPromise: Promise<void> | null = null;

async function fetchWords(url: string): Promise<string[]> {
  const res = await fetch(url);
  const text = await res.text();
  return text
    .split('\n')
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length === 5);
}

export async function loadWords(): Promise<void> {
  if (loaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const [answers, guesses] = await Promise.all([
      fetchWords('/wordle/answers.txt'),
      fetchWords('/wordle/guesses.txt'),
    ]);
    targetWords = answers;
    validGuesses = new Set([...answers, ...guesses]);
    loaded = true;
  })();

  return loadPromise;
}

export function isValidWord(word: string): boolean {
  return validGuesses.has(word.toLowerCase());
}

export function getDailyWord(): { word: string; dayIndex: number } {
  const now = new Date();
  const dayIndex = Math.floor((now.getTime() - EPOCH) / 86_400_000);
  return { word: targetWords[dayIndex % targetWords.length], dayIndex };
}

export function getRandomWord(): string {
  return targetWords[Math.floor(Math.random() * targetWords.length)];
}
