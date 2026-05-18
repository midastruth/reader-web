/**
 * Application service for highlight/annotation operations.
 *
 * Highlights and notes are server-backed by book-aware. Browser storage is not
 * used as a source of truth; Redux only keeps the current UI session state.
 */

import { HighlightColor, normalizeHighlightColor, type Highlight, type HighlightLocator, type KoreaderSyncState, type SerializedRange } from '@/lib/types/highlights';
import {
  createBookAwareHighlight,
  deleteBookAwareHighlight,
  fetchBookAwareHighlights,
  updateBookAwareHighlight,
  type BookAwareHighlight,
  type UpdateHighlightPayload,
} from '@/services/bookAwareApi';
import HighlightAnchors from './HighlightAnchors';
import { buildHighlightSortKey, sortHighlightsByReadingOrder } from './highlightSort';
import type { CreateHighlightInput, HighlightUpdateInput } from './models';

export { buildHighlightSortKey, sortHighlightsByReadingOrder };

const BOOK_AWARE_SHA_RE = /^[0-9a-f]{64}$/i;

function isServerBackedBookId(bookId: string): boolean {
  return BOOK_AWARE_SHA_RE.test(bookId);
}

function normalizeHref(href: string): string {
  return decodeURIComponent(href).split('#')[0].split('?')[0];
}

function parseBackendTime(value: string | undefined): number {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function normalizeKoreaderStatus(status: string | undefined): KoreaderSyncState['status'] {
  switch (status) {
    case 'pending':
    case 'resolved':
    case 'conflict':
    case 'failed':
      return status;
    default:
      throw new Error(`Unexpected book-aware koreader status: ${status ?? '<missing>'}`);
  }
}

function locatorFromBackend(highlight: BookAwareHighlight, fallback?: Highlight): HighlightLocator {
  return fallback?.locator ?? {
    href: highlight.href ?? '',
    locations: {
      totalProgression: highlight.total_progression,
      position: highlight.spine_index,
    },
    text: {
      before: highlight.prefix || undefined,
      highlight: highlight.exact,
      after: highlight.suffix || undefined,
    },
  };
}

function rangeFromBackend(fallback?: Highlight): SerializedRange {
  // book-aware stores semantic text context, not the browser's DOM XPath/block
  // offsets. Rendering therefore uses locatorToRange()'s text-context fallback.
  return fallback?.range ?? { type: 'block-offset', parts: [] };
}

function fromBackendHighlight(highlight: BookAwareHighlight, fallback?: Highlight): Highlight {
  const local: Highlight = {
    id: highlight.id,
    bookId: highlight.book_sha256,
    color: normalizeHighlightColor(highlight.color || ''),
    createdAt: parseBackendTime(highlight.created_at),
    updatedAt: parseBackendTime(highlight.updated_at),
    note: highlight.note || undefined,
    locator: locatorFromBackend(highlight, fallback),
    range: rangeFromBackend(fallback),
    anchorVersion: fallback?.anchorVersion ?? 2,
    koreader: {
      status: normalizeKoreaderStatus(highlight.koreader?.status),
      backendId: highlight.id,
      pos0: highlight.koreader?.pos0,
      pos1: highlight.koreader?.pos1,
      page: highlight.koreader?.page,
      error: highlight.koreader?.error,
    },
  };
  local.sortKey = fallback?.sortKey ?? buildHighlightSortKey(local);
  return local;
}

export class HighlightService {
  private readonly cache = new Map<string, Highlight>();

  private remember(highlights: Highlight[]): Highlight[] {
    for (const highlight of highlights) this.cache.set(highlight.id, highlight);
    return highlights;
  }

  async create(input: CreateHighlightInput): Promise<Highlight | null> {
    if (!isServerBackedBookId(input.bookId)) {
      throw new Error('当前书籍没有可信的服务器 sha256，已禁用本地高亮/注释。');
    }

    if (!HighlightAnchors.isValidSelection(input.selection)) return null;

    const normalizedRange = HighlightAnchors.normalize(input.selection.range);
    const serializedRange = HighlightAnchors.serialize(normalizedRange);
    const locator = HighlightAnchors.toLocator(input.selection, normalizedRange);
    const now = Date.now();

    const optimistic: Highlight = {
      id: `pending-${now}`,
      bookId: input.bookId,
      color: input.color ?? HighlightColor.GRAY,
      createdAt: now,
      updatedAt: now,
      note: input.note,
      locator,
      range: serializedRange,
      anchorVersion: 2,
      koreader: { status: 'pending' },
    };
    optimistic.sortKey = buildHighlightSortKey(optimistic);

    const created = await createBookAwareHighlight(input.bookId, {
      exact: locator.text.highlight,
      prefix: locator.text.before,
      suffix: locator.text.after,
      href: locator.href,
      total_progression: locator.locations.totalProgression,
      chapter: input.chapter,
      color: optimistic.color,
      note: optimistic.note,
    });

    const highlight = fromBackendHighlight(created, optimistic);
    this.cache.set(highlight.id, highlight);
    return highlight;
  }

  async loadBook(bookId: string): Promise<Highlight[]> {
    if (!isServerBackedBookId(bookId)) return [];

    const highlights = sortHighlightsByReadingOrder(
      (await fetchBookAwareHighlights(bookId)).map((highlight) => fromBackendHighlight(highlight))
    );
    return this.remember(highlights);
  }

  async loadChapter(bookId: string, href: string): Promise<Highlight[]> {
    if (!isServerBackedBookId(bookId)) return [];

    const normalizedHref = normalizeHref(href);
    const bookHighlights = await this.loadBook(bookId);
    return sortHighlightsByReadingOrder(
      bookHighlights.filter((highlight) => {
        const highlightHref = normalizeHref(highlight.locator.href || '');
        return highlightHref === normalizedHref;
      })
    );
  }

  async update(id: string, updates: HighlightUpdateInput): Promise<Highlight> {
    const existing = this.cache.get(id);
    if (!existing) throw new Error(`Highlight not loaded from server: ${id}`);
    if (!isServerBackedBookId(existing.bookId)) {
      throw new Error('本地高亮/注释已禁用，无法更新非服务器高亮。');
    }

    const fallback: Highlight = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };
    fallback.sortKey = updates.sortKey ?? buildHighlightSortKey(fallback);

    const payload: UpdateHighlightPayload = { updated_by: 'reader-web' };
    if ('note' in updates) payload.note = updates.note ?? '';
    if (updates.color !== undefined) payload.color = updates.color;

    let updated = fallback;
    if (payload.note !== undefined || payload.color !== undefined) {
      updated = fromBackendHighlight(
        await updateBookAwareHighlight(existing.bookId, existing.koreader?.backendId ?? existing.id, payload),
        fallback
      );
    }

    this.cache.set(updated.id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = this.cache.get(id);
    if (!existing) throw new Error(`Highlight not loaded from server: ${id}`);
    if (!isServerBackedBookId(existing.bookId)) {
      throw new Error('本地高亮/注释已禁用，无法删除非服务器高亮。');
    }

    await deleteBookAwareHighlight(existing.bookId, existing.koreader?.backendId ?? existing.id);
    this.cache.delete(id);
  }

  async get(id: string): Promise<Highlight | undefined> {
    return this.cache.get(id);
  }

  async exportAll(): Promise<string> {
    return JSON.stringify(Array.from(this.cache.values()), null, 2);
  }

  async importAll(): Promise<void> {
    throw new Error('本地导入已禁用：高亮和注释完全由服务器管理。');
  }
}

export const highlightService = new HighlightService();
export default highlightService;
