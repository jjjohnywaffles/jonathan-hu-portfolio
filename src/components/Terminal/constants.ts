import { portfolioData } from '../../data/portfolio';

// ASCII Art for the terminal welcome screen
export const ASCII_ART = `     _                   _   _                   _   _       
    | | ___  _ __   __ _| |_| |__   __ _ _ __   | | | |_   _ 
 _  | |/ _ \\| '_ \\ / _\` | __| '_ \\ / _\` | '_ \\  | |_| | | | |
| |_| | (_) | | | | (_| | |_| | | | (_| | | | | |  _  | |_| |
 \\___/ \\___/|_| |_|\\__,_|\\__|_| |_|\\__,_|_| |_| |_| |_|\\__,_|`;

export const ASCII_LINES = ASCII_ART.split('\n');
export const MAX_ASCII_LENGTH = Math.max(...ASCII_LINES.map((l) => l.length));

// Welcome screen text lines
export const WELCOME_TEXT_LINES = [
  '',
  'Full-stack Software Engineer @Matrices',
  portfolioData.tagline,
  '',
  'Type `help` to see available commands.',
];

// Boot sequence timing (in milliseconds)
export const BOOT_TIMING = {
  CONNECTION_START: 0,
  CONNECTION_DONE: 800,
  LOADING_START: 1200,
  LOADING_DONE: 2400,
  INIT_START: 3000,
  INIT_DONE: 3600,
  COMPLETE: 4600,
  FADE_DELAY: 500,
} as const;

// Typing animation timing (in milliseconds)
export const TYPING_TIMING = {
  ASCII_CHAR_DELAY: 3,
  TEXT_CHAR_DELAY: 5,
  LINE_TRANSITION_DELAY: 20,
  WELCOME_COMPLETE_DELAY: 300,
} as const;
