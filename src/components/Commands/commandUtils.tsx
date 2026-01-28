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

export interface CommandDefinition {
  description: string;
  execute: () => ReactNode;
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
};

// Get command names and descriptions for help display
export const getCommandList = () =>
  Object.entries(commands).map(([name, { description }]) => ({ name, description }));

export const executeCommand = (input: string): ReactNode => {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  if (trimmed in commands) {
    return commands[trimmed].execute();
  }

  return (
    <p className="cmd-error">
      Command not found: <span className="cmd-input">{input}</span>
      <br />
      Type <span className="cmd-highlight">help</span> to see available commands.
    </p>
  );
};
