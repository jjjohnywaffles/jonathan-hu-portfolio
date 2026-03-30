export function getUserInitials(displayName: string): string {
  const rawParts = displayName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  const sanitizedParts = rawParts
    .map((part) =>
      part
        .split('')
        .filter((char) => /[A-Za-z]/.test(char))
        .join('')
    )
    .filter((part) => part.length > 0);

  if (sanitizedParts.length === 0) {
    return '';
  }

  if (sanitizedParts.length === 1) {
    return sanitizedParts[0]!.charAt(0).toUpperCase();
  }

  const firstPart = sanitizedParts[0]!;
  const lastPart = sanitizedParts[sanitizedParts.length - 1] ?? firstPart;

  const firstInitial = firstPart.charAt(0).toUpperCase();
  const lastInitial = lastPart.charAt(0).toUpperCase();

  return `${firstInitial}${lastInitial}`.slice(0, 2);
}
