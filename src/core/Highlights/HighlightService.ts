/**
 * Application service for highlight/annotation operations.
 *
 * Highlights and notes are server-backed by book-aware. Redux is the single
 * source of truth for the client; this service is stateless and simply
 * translates between backend payloads and domain Highlight objects.
 */

import { HighlightColor, type Highlight } from '@/lib/types/highlights';
import type { UpdateHighlightPayload } from '@/services/bookAwareApi';
import HighlightAnchors from './HighlightAnchors';
import { buildHighlightSortKey, sortHighlightsByReadingOrder } from './highlightSort';
import {
  fromBackendForCreate,
  fromBackendForSync,
  toCreateHighlightPayload,
} from './HighlightMapper';
import {
  highlightRemoteRepository,
  type HighlightRemoteRepository,
} from './HighlightRemoteRepository';
import { readHighlightSyncCursor, saveHighlightSyncCursor } from './syncCursor';
import type { CreateHighlightInput, HighlightUpdateInput } from './models';

export { buildHighlightSortKey, sortHighlightsByReadingOrder };

const BOOK_AWARE_SHA_RE = /^[0-9a-f]{64}$/i;

function isServerBackedBookId(bookId: string): boolean {
  return BOOK_AWARE_SHA_RE.test(bookId);
}

function normalizeHref(href: string): string {
  return decodeURIComponent(href).split('#')[0].split('?')[0];
}

export interface PullChangesResult {
  added: Highlight[];
  updated: Highlight[];
  deleted: string[];
  serverVersion: number;
}

export class HighlightService {
  constructor(private readonly remote: HighlightRemoteRepository = highlightRemoteRepository) {}

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

    const created = await this.remote.create(input.bookId, toCreateHighlightPayload({
      locator,
      color: optimistic.color,
      note: optimistic.note,
      chapter: input.chapter,
    }));

    const highlight = fromBackendForCreate(created, optimistic);
    if (highlight.syncVersion != null) saveHighlightSyncCursor(input.bookId, highlight.syncVersion);
    return highlight;
  }

  async loadBook(bookId: string): Promise<Highlight[]> {
    if (!isServerBackedBookId(bookId)) return [];

    const highlights = sortHighlightsByReadingOrder(
      (await this.remote.list(bookId)).map((highlight) => fromBackendForSync(highlight))
    );
    const maxSyncVersion = highlights.reduce(
      (max, highlight) => Math.max(max, highlight.syncVersion ?? 0),
      0
    );
    if (maxSyncVersion > 0) saveHighlightSyncCursor(bookId, maxSyncVersion);
    return highlights;
  }

  /**
   * Filter an already-loaded highlight set down to the chapter visible in
   * the given iframe. Pure: takes the current Redux slice as input.
   */
  filterChapter(
    highlights: readonly Highlight[],
    bookId: string,
    href: string,
    readingOrderPosition?: number
  ): Highlight[] {
    if (!isServerBackedBookId(bookId)) return [];

    const normalizedHref = normalizeHref(href);
    return sortHighlightsByReadingOrder(
      highlights.filter((highlight) => {
        if (highlight.bookId !== bookId || highlight.deletedAt) return false;
        const highlightHref = normalizeHref(highlight.locator.href || '');
        if (highlightHref) return highlightHref === normalizedHref;

        // Older book-aware rows may not have href. Only restore them when the
        // backend has a reliable spine index and it matches the loaded frame.
        return (
          readingOrderPosition !== undefined &&
          highlight.locator.locations.position === readingOrderPosition
        );
      })
    );
  }

  async update(existing: Highlight, updates: HighlightUpdateInput): Promise<Highlight> {
    if (!isServerBackedBookId(existing.bookId)) {
      throw new Error('本地高亮/注释已禁用，无法更新非服务器高亮。');
    }

    const merged: Highlight = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };
    merged.sortKey = updates.sortKey ?? buildHighlightSortKey(merged);

    const payload: UpdateHighlightPayload = { updated_by: 'reader-web' };
    if ('note' in updates) payload.note = updates.note ?? '';
    if (updates.color !== undefined) payload.color = updates.color;

    if (payload.note === undefined && payload.color === undefined) return merged;

    const remote = await this.remote.update(
      existing.bookId,
      existing.koreader?.backendId ?? existing.id,
      payload
    );
    const updated = fromBackendForSync(remote, merged);
    if (updated.syncVersion != null) saveHighlightSyncCursor(existing.bookId, updated.syncVersion);
    return updated;
  }

  async delete(existing: Highlight): Promise<void> {
    if (!isServerBackedBookId(existing.bookId)) {
      throw new Error('本地高亮/注释已禁用，无法删除非服务器高亮。');
    }

    const deleted = await this.remote.delete(
      existing.bookId,
      existing.koreader?.backendId ?? existing.id
    );
    const serverVersion = (deleted as { server_version?: number }).server_version;
    if (typeof serverVersion === 'number') saveHighlightSyncCursor(existing.bookId, serverVersion);
  }

  async pullChanges(bookId: string, existing: readonly Highlight[]): Promise<PullChangesResult> {
    if (!isServerBackedBookId(bookId)) {
      return { added: [], updated: [], deleted: [], serverVersion: 0 };
    }

    const sinceVersion = readHighlightSyncCursor(bookId);
    const response = await this.remote.changes(bookId, sinceVersion);

    const existingById = new Map(existing.map((h) => [h.id, h]));
    const added: Highlight[] = [];
    const updated: Highlight[] = [];
    const deleted: string[] = [];

    for (const change of response.changes) {
      const id = change.highlight.id;
      if (change.type === 'delete') {
        if (existingById.has(id)) deleted.push(id);
        continue;
      }
      const prior = existingById.get(id);
      const highlight = fromBackendForSync(change.highlight, prior);
      if (prior) updated.push(highlight);
      else added.push(highlight);
    }

    saveHighlightSyncCursor(bookId, response.server_version);
    return { added, updated, deleted, serverVersion: response.server_version };
  }
}

export const highlightService = new HighlightService();
export default highlightService;
