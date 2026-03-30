import type { ParsedSearch, SearchFilter, SearchOperator } from '@trello/_lib/types';

/**
 * Parse Trello search query with support for all operators
 * Examples:
 * - "@john #urgent due:week"
 * - "has:attachments board:project"
 * - "comment:\"fix it\" -label:done"
 */
export function parseSearchQuery(query: string): ParsedSearch {
  console.log('=== parseSearchQuery START ===', query);

  // Allow shorter queries if they contain operators (like "due:1")
  if (!query || (query.length < 2 && !query.includes(':'))) {
    return {
      rawQuery: query,
      freeText: '',
      filters: [],
    };
  }

  const filters: SearchFilter[] = [];
  let freeText = '';
  let sortBy: 'created' | 'edited' | 'due' | undefined;
  const sortDirection: 'asc' | 'desc' = 'desc';

  // Split query into tokens, preserving quoted strings
  const tokens = tokenizeQuery(query);
  console.log('Tokens:', tokens);

  for (const token of tokens) {
    const filterMatch = parseToken(token);
    console.log('Processing token:', token, 'filterMatch:', filterMatch);

    if (filterMatch) {
      if (filterMatch.operator === 'sort') {
        // Handle sort operators specially
        const sortValue = filterMatch.value.toLowerCase();
        console.log('Found sort operator with value:', sortValue);
        if (sortValue === 'created' || sortValue === 'edited' || sortValue === 'due') {
          sortBy = sortValue;
          console.log('Set sortBy to:', sortBy);
        }
      } else {
        filters.push(filterMatch);
      }
    } else {
      // Add to free text if not an operator
      if (freeText) freeText += ' ';
      freeText += token;
    }
  }

  const result = {
    rawQuery: query,
    freeText: freeText.trim(),
    filters,
    sortBy,
    sortDirection,
  };

  console.log('=== parseSearchQuery END ===', result);
  return result;
}

/**
 * Tokenize search query, preserving quoted strings
 */
function tokenizeQuery(query: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < query.length; i++) {
    const char = query[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      current += char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      current += char;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

/**
 * Parse individual token for operator patterns
 */
function parseToken(token: string): SearchFilter | null {
  console.log('Parsing token:', token);

  // Handle negation (-operator:value)
  const negated = token.startsWith('-');
  const cleanToken = negated ? token.slice(1) : token;

  // Handle @ shorthand for members
  if (cleanToken.startsWith('@')) {
    return {
      operator: '@',
      value: cleanToken.slice(1),
      negated,
    };
  }

  // Handle # shorthand for labels
  if (cleanToken.startsWith('#')) {
    return {
      operator: '#',
      value: cleanToken.slice(1),
      negated,
    };
  }

  // Handle operator:value patterns
  const operatorMatch = cleanToken.match(
    /^(member|members|label|board|list|has|due|edited|description|checklist|comment|name|is|sort):(.+)$/
  );
  if (operatorMatch) {
    const operator = operatorMatch[1];
    const value = operatorMatch[2];
    console.log('Found operator match:', { operator, value });

    if (!operator || !value) return null;

    return {
      operator: operator as SearchOperator,
      value: removeQuotes(value),
      negated,
    };
  }

  // Handle incomplete sort operators (just "sort:" without value)
  if (cleanToken === 'sort:' || cleanToken.startsWith('sort:')) {
    console.log('Found incomplete sort operator:', cleanToken);
    // Try to extract any partial value
    if (cleanToken.length > 5) {
      // More than just "sort:"
      const partialValue = cleanToken.slice(5);
      if (partialValue.length > 0) {
        return {
          operator: 'sort',
          value: partialValue,
          negated,
        };
      }
    }
  }

  console.log('No operator match for token:', token);
  return null;
}

/**
 * Remove surrounding quotes from a value
 */
function removeQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Check if a search query is valid (has meaningful content)
 */
export function isValidSearchQuery(query: string): boolean {
  if (!query) return false;

  // Remove operators and check if there's meaningful content
  const parsed = parseSearchQuery(query);
  const totalContent = parsed.freeText + parsed.filters.map((f) => f.value).join('');

  // Also consider sort operators as valid queries
  const hasSortOperator = parsed.sortBy !== undefined;

  // Consider queries with any filters as valid (even if short values like "due:1")
  const hasFilters = parsed.filters.length > 0;

  return totalContent.length >= 2 || hasSortOperator || hasFilters;
}

/**
 * Get search suggestions based on partial input
 */
export function getSearchSuggestions(query: string): string[] {
  const suggestions: string[] = [];

  if (query.length === 0) {
    return [
      '@me',
      'has:attachments',
      'has:description',
      'has:members',
      'due:day',
      'due:week',
      'due:overdue',
      'is:open',
      'is:complete',
      'sort:created',
      'sort:edited',
      'sort:due',
    ];
  }

  // Suggest completions based on partial input
  const lowerQuery = query.toLowerCase();

  const operatorSuggestions = [
    'member:',
    '@',
    'label:',
    '#',
    'board:',
    'list:',
    'has:attachments',
    'has:description',
    'has:cover',
    'has:members',
    'has:stickers',
    'due:day',
    'due:week',
    'due:month',
    'due:overdue',
    'edited:day',
    'edited:week',
    'edited:month',
    'description:',
    'checklist:',
    'comment:',
    'name:',
    'is:open',
    'is:complete',
    'is:incomplete',
    'is:starred',
    'sort:created',
    'sort:edited',
    'sort:due',
  ];

  for (const suggestion of operatorSuggestions) {
    if (suggestion.toLowerCase().startsWith(lowerQuery)) {
      suggestions.push(suggestion);
    }
  }

  return suggestions.slice(0, 10); // Limit to 10 suggestions
}
