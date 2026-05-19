/** Utilities for choosing/highlighting overlapping annotations. */

import type { Highlight } from '@/lib/types/highlights';

export function uniqueHighlightIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

export function resolveHitHighlights(ids: string[], highlights: Highlight[]): Highlight[] {
  const byId = new Map(highlights.map((highlight) => [highlight.id, highlight]));
  return uniqueHighlightIds(ids)
    .map((id) => byId.get(id))
    .filter((highlight): highlight is Highlight => !!highlight);
}

export function getPrimaryHit(ids: string[], highlights: Highlight[]): Highlight | null {
  return resolveHitHighlights(ids, highlights)[0] ?? null;
}
