/**
 * Repository facade for highlight persistence.
 *
 * This keeps storage concerns out of React components and allows us to swap
 * IndexedDB/Dexie later without touching UI code.
 */

import HighlightsDB from '@/core/Storage/HighlightsDB';
import type { BookHighlights, Highlight } from '@/lib/types/highlights';

export class HighlightRepository {
  async add(highlight: Highlight): Promise<void> {
    await HighlightsDB.addHighlight(highlight);
  }

  async update(
    id: string,
    updates: Partial<Omit<Highlight, 'id' | 'bookId' | 'createdAt'>>
  ): Promise<Highlight> {
    await HighlightsDB.updateHighlight(id, updates);
    const updated = await HighlightsDB.getHighlight(id);
    if (!updated) throw new Error(`Highlight not found after update: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await HighlightsDB.deleteHighlight(id);
  }

  async get(id: string): Promise<Highlight | undefined> {
    return HighlightsDB.getHighlight(id);
  }

  async byBook(bookId: string): Promise<Highlight[]> {
    return HighlightsDB.getHighlightsByBook(bookId);
  }

  async byChapter(bookId: string, href: string): Promise<Highlight[]> {
    return HighlightsDB.getHighlightsByChapter(bookId, href);
  }

  async all(): Promise<BookHighlights[]> {
    return HighlightsDB.getAllHighlights();
  }

  async deleteBook(bookId: string): Promise<void> {
    await HighlightsDB.deleteBookHighlights(bookId);
  }

  async search(bookId: string, query: string): Promise<Highlight[]> {
    return HighlightsDB.searchHighlights(bookId, query);
  }

  async exportAll(): Promise<string> {
    return HighlightsDB.exportAll();
  }

  async importAll(json: string): Promise<void> {
    await HighlightsDB.importAll(json);
  }
}

export const highlightRepository = new HighlightRepository();
export default highlightRepository;
