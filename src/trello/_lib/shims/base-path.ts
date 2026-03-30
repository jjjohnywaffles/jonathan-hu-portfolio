export function withSiteBasePath(href: string): string {
  if (/^(https?:|mailto:|tel:|#|\?)/.test(href)) return href;
  const base = '/trello';
  const normalized = href.startsWith('/') ? href : '/' + href;
  if (normalized === '/') return base;
  if (normalized.startsWith(base + '/') || normalized === base) return normalized;
  return base + normalized;
}
