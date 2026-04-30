/**
 * Application service for highlight/annotation operations.
 *
 * This is the equivalent of KOReader's ReaderAnnotation + the non-UI parts of
 * ReaderHighlight: create, update, delete, stable sorting, and persistence.
 */

import { HighlightColor, type Highlight } from '@/lib/types/highlights';
import HighlightAnchors from './HighlightAnchors';
import highlightRepository, { type HighlightRepository } from './HighlightRepository';
import type { CreateHighlightInput, HighlightUpdateInput } from './models';

const createHighlightId = (): string => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

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

function normalizeStoredHighlight(highlight: Highlight): Highlight {
  const normalized: Highlight = {
    ...highlight,
    anchorVersion: highlight.anchorVersion ?? (highlight.range.type === 'block-offset' ? 2 : 1),
  };
  normalized.sortKey = normalized.sortKey ?? buildHighlightSortKey(normalized);
  return normalized;
}

export class HighlightService {
  constructor(private repository: HighlightRepository = highlightRepository) {}

  async create(input: CreateHighlightInput): Promise<Highlight | null> {
    if (!HighlightAnchors.isValidSelection(input.selection)) return null;

    const normalizedRange = HighlightAnchors.normalize(input.selection.range);
    const now = Date.now();
    const highlight: Highlight = {
      id: createHighlightId(),
      bookId: input.bookId,
      color: input.color ?? HighlightColor.YELLOW,
      createdAt: now,
      updatedAt: now,
      note: input.note,
      locator: HighlightAnchors.toLocator(input.selection, normalizedRange),
      range: HighlightAnchors.serialize(normalizedRange),
      anchorVersion: 2,
    };
    highlight.sortKey = buildHighlightSortKey(highlight);

    await this.repository.add(highlight);
    return highlight;
  }

  async loadBook(bookId: string): Promise<Highlight[]> {
    return sortHighlightsByReadingOrder((await this.repository.byBook(bookId)).map(normalizeStoredHighlight));
  }

  async loadChapter(bookId: string, href: string): Promise<Highlight[]> {
    const normalizedHref = normalizeHref(href);
    const bookHighlights = (await this.repository.byBook(bookId)).map(normalizeStoredHighlight);
    return sortHighlightsByReadingOrder(
      bookHighlights.filter((highlight) => normalizeHref(highlight.locator.href) === normalizedHref)
    );
  }

  async update(id: string, updates: HighlightUpdateInput): Promise<Highlight> {
    const existing = await this.repository.get(id);
    if (!existing) throw new Error(`Highlight not found: ${id}`);

    const next: Highlight = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };
    next.sortKey = updates.sortKey ?? buildHighlightSortKey(next);

    return this.repository.update(id, {
      ...updates,
      sortKey: next.sortKey,
      updatedAt: next.updatedAt,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async get(id: string): Promise<Highlight | undefined> {
    return this.repository.get(id);
  }
}

export const highlightService = new HighlightService();
export default highlightService;
