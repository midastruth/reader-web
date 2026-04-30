/**
 * Application service for highlight/annotation operations.
 *
 * This is the equivalent of KOReader's ReaderAnnotation + the non-UI parts of
 * ReaderHighlight: create, update, delete, stable sorting, and persistence.
 */

import { HighlightColor, type Highlight } from '@/lib/types/highlights';
import HighlightAnchors from './HighlightAnchors';
import highlightRepository, { type HighlightRepository } from './HighlightRepository';
import { buildHighlightSortKey, sortHighlightsByReadingOrder } from './highlightSort';
import type { CreateHighlightInput, HighlightUpdateInput } from './models';

export { buildHighlightSortKey, sortHighlightsByReadingOrder };

const createHighlightId = (): string => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function normalizeHref(href: string): string {
  return decodeURIComponent(href).split('#')[0].split('?')[0];
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
