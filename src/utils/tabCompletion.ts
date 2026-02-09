import { commands, parseCommandLine, getPathCommands } from '../components/Commands/commandUtils';
import type { LocalFileSystem } from '../types/filesystem';

export interface TabCompletionResult {
  completed: string;
  options: string[];
}

export function getTabCompletion(input: string, fs: LocalFileSystem): TabCompletionResult {
  const trimmed = input.trimStart();

  // No input - nothing to complete
  if (!trimmed) {
    return { completed: input, options: [] };
  }

  const { command } = parseCommandLine(trimmed);
  const hasSpace = trimmed.includes(' ');

  // If no space, complete command names
  if (!hasSpace) {
    const commandNames = Object.keys(commands);
    const matches = commandNames.filter((name) =>
      name.toLowerCase().startsWith(command.toLowerCase())
    );

    if (matches.length === 0) {
      return { completed: input, options: [] };
    }

    if (matches.length === 1) {
      // Single match - complete it with a space
      return { completed: matches[0] + ' ', options: [] };
    }

    // Multiple matches - find common prefix
    const commonPrefix = findCommonPrefix(matches);
    return { completed: commonPrefix, options: matches };
  }

  // Has space - complete paths for commands that support it
  const pathCommands = getPathCommands();
  if (!pathCommands.includes(command)) {
    return { completed: input, options: [] };
  }

  // Get the partial path (last argument or empty)
  const lastSpaceIndex = trimmed.lastIndexOf(' ');
  const partial = trimmed.slice(lastSpaceIndex + 1);
  const prefix = trimmed.slice(0, lastSpaceIndex + 1);

  // Get completions from file system
  const completions = fs.getCompletions(partial);

  if (completions.length === 0) {
    return { completed: input, options: [] };
  }

  if (completions.length === 1) {
    // Single match - complete it
    return { completed: prefix + completions[0], options: [] };
  }

  // Multiple matches - find common prefix
  const commonPrefix = findCommonPrefix(completions);
  return { completed: prefix + commonPrefix, options: completions };
}

function findCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  if (strings.length === 1) return strings[0];

  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].toLowerCase().startsWith(prefix.toLowerCase())) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
    // Use the actual case from the first match
    prefix = prefix.slice(0, Math.min(prefix.length, strings[i].length));
  }
  return prefix;
}
