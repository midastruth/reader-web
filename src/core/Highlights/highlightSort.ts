import type { Highlight } from '@/lib/types/highlights';

function normalizeHref(href: string): string {
  return decodeURIComponent(href).split('#')[0].split('?')[0];
}

function firstRangeOffset(highlight: Highlight): number {
  const range = highlight.range;
  if (range.type === 'block-offset') return range.parts[0]?.startOffset ?? 0;
  if ('startOffset' in range) return range.startOffset ?? 0;
  return 0;
}

export function buildHighlightSortKey(highlight: Pick<Highlight, 'locator' | 'range' | 'createdAt'>): string {
  const href = normalizeHref(highlight.locator.href || '');
  const position = highlight.locator.locations.position ?? Number.MAX_SAFE_INTEGER;
  const progression = highlight.locator.locations.progression ?? highlight.locator.locations.totalProgression ?? 1;
  const offset = firstRangeOffset(highlight as Highlight);
  return [
    String(position).padStart(16, '0'),
    progression.toFixed(8),
    String(offset).padStart(8, '0'),
    href,
    String(highlight.createdAt).padStart(13, '0'),
  ].join('|');
}

export function sortHighlightsByReadingOrder(highlights: Highlight[]): Highlight[] {
  return [...highlights].sort((a, b) => {
    const aKey = a.sortKey ?? buildHighlightSortKey(a);
    const bKey = b.sortKey ?? buildHighlightSortKey(b);
    return aKey.localeCompare(bKey);
  });
}
