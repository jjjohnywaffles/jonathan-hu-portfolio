import type { ReactNode } from 'react';
import { Help } from './Help';
import { About } from './About';
import { Experience } from './Experience';
import { Education } from './Education';
import { Skills } from './Skills';
import { Projects } from './Projects';
import { Contact } from './Contact';
import { Socials } from './Socials';
import { Resume } from './Resume';
import { DirectoryListing } from './DirectoryListing';
import type { LocalFileSystem } from '../../types/filesystem';
import { openFile } from '../../utils/fileActions';

export interface CommandContext {
  fs: LocalFileSystem;
  openApp: (appId: string, options?: { title?: string; data?: Record<string, unknown> }) => void;
}

export interface CommandDefinition {
  description: string;
  usage?: string;
  execute: (args: string[], ctx?: CommandContext) => ReactNode;
  supportsPathCompletion?: boolean;
  showInHelp?: boolean;
}

// Single source of truth for all commands
export const commands: Record<string, CommandDefinition> = {
  about: {
    description: 'Learn more about me',
    execute: () => <About />,
  },
  experience: {
    description: 'View my work experience',
    execute: () => <Experience />,
  },
  education: {
    description: 'View my education background',
    execute: () => <Education />,
  },
  skills: {
    description: 'List my technical skills',
    execute: () => <Skills />,
  },
  projects: {
    description: 'Browse my projects',
    execute: () => <Projects />,
  },
  contact: {
    description: 'Get my contact information',
    execute: () => <Contact />,
  },
  socials: {
    description: 'View my social links',
    execute: () => <Socials />,
  },
  resume: {
    description: 'Download my resume',
    execute: () => <Resume />,
  },
  clear: {
    description: 'Clear the terminal',
    execute: () => null,
  },
  help: {
    description: 'Show this help message',
    execute: () => <Help />,
  },
  pwd: {
    description: 'Print current directory',
    showInHelp: false,
    execute: (_args, ctx) => {
      if (!ctx?.fs) return <span className="text-error">File system not available</span>;
      return <span className="text-text-primary">{ctx.fs.currentPath}</span>;
    },
  },
  ls: {
    description: 'List directory contents',
    usage: 'ls [path]',
    showInHelp: false,
    supportsPathCompletion: true,
    execute: (args, ctx) => {
      if (!ctx?.fs) return <span className="text-error">File system not available</span>;

      const path = args[0] || undefined;
      const items = ctx.fs.listDirectory(path);

      if (items === null) {
        const targetPath = path ? ctx.fs.resolvePath(path) : ctx.fs.currentPath;
        return <span className="text-error">ls: {targetPath}: No such file or directory</span>;
      }

      return <DirectoryListing items={items} />;
    },
  },
  cd: {
    description: 'Change directory',
    usage: 'cd <path>',
    showInHelp: false,
    supportsPathCompletion: true,
    execute: (args, ctx) => {
      if (!ctx?.fs) return <span className="text-error">File system not available</span>;

      // cd with no args goes to home
      const path = args[0] || '~';
      const success = ctx.fs.navigate(path);

      if (!success) {
        const targetPath = ctx.fs.resolvePath(path);
        return <span className="text-error">cd: {targetPath}: No such file or directory</span>;
      }

      return null;
    },
  },
  cat: {
    description: 'Display file contents',
    usage: 'cat <file>',
    showInHelp: false,
    supportsPathCompletion: true,
    execute: (args, ctx) => {
      if (!ctx?.fs) return <span className="text-error">File system not available</span>;

      if (!args[0]) {
        return <span className="text-error">cat: missing operand</span>;
      }

      const path = args[0];
      const resolvedPath = ctx.fs.resolvePath(path);
      const node = ctx.fs.getNode(resolvedPath);

      if (!node) {
        return <span className="text-error">cat: {path}: No such file or directory</span>;
      }

      if (node.type === 'folder') {
        return <span className="text-error">cat: {path}: Is a directory</span>;
      }

      if (node.fileType === 'pdf') {
        return (
          <span className="text-text-muted">
            {path} is a PDF file. Use <span className="text-accent">open {path}</span> to view it.
          </span>
        );
      }

      if (node.fileType === 'executable') {
        return (
          <span className="text-text-muted">
            {path} is an application. Use <span className="text-accent">open {path}</span> to launch
            it.
          </span>
        );
      }

      if (!node.content) {
        return <span className="text-text-muted">(empty file)</span>;
      }

      // Render markdown-style content or plain text
      return <pre className="text-text-primary whitespace-pre-wrap">{node.content}</pre>;
    },
  },
  open: {
    description: 'Open a file or application',
    usage: 'open <file|app>',
    showInHelp: false,
    supportsPathCompletion: true,
    execute: (args, ctx) => {
      if (!ctx?.fs) return <span className="text-error">File system not available</span>;

      if (!args[0]) {
        return <span className="text-error">open: missing operand</span>;
      }

      const path = args[0];
      const resolvedPath = ctx.fs.resolvePath(path);
      const node = ctx.fs.getNode(resolvedPath);

      if (!node) {
        return <span className="text-error">open: {path}: No such file or directory</span>;
      }

      if (node.type === 'folder') {
        // Navigate Finder to this folder (or just navigate terminal for now)
        ctx.fs.navigate(path);
        return null;
      }

      const result = openFile(node, ctx.openApp);
      if (result) {
        return <span className="text-text-muted">{result.message}</span>;
      }

      return <span className="text-text-muted">Cannot open {node.name}</span>;
    },
  },
};

// Parse command line input into command and arguments
export const parseCommandLine = (input: string): { command: string; args: string[] } => {
  const trimmed = input.trim();
  if (!trimmed) return { command: '', args: [] };

  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (!inQuote && (char === '"' || char === "'")) {
      inQuote = true;
      quoteChar = char;
    } else if (inQuote && char === quoteChar) {
      inQuote = false;
      quoteChar = '';
    } else if (!inQuote && char === ' ') {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  const [command, ...args] = parts;
  return { command: command?.toLowerCase() || '', args };
};

// Get command names and descriptions for help display
export const getCommandList = () =>
  Object.entries(commands)
    .filter(([, def]) => def.showInHelp !== false)
    .map(([name, { description }]) => ({ name, description }));

// Get commands that support path completion
export const getPathCommands = (): string[] =>
  Object.entries(commands)
    .filter(([, def]) => def.supportsPathCompletion)
    .map(([name]) => name);

export const executeCommand = (input: string, ctx?: CommandContext): ReactNode => {
  const { command, args } = parseCommandLine(input);

  if (!command) {
    return null;
  }

  if (command in commands) {
    return commands[command].execute(args, ctx);
  }

  return (
    <p className="text-error">
      Command not found: <span className="text-accent-secondary">{command}</span>
      <br />
      Type <span className="text-accent">help</span> to see available commands.
    </p>
  );
};
