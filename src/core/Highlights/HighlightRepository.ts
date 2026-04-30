/**
 * Repository facade for highlight persistence.
 *
 * This keeps storage concerns out of React components and allows us to swap
 * IndexedDB/Dexie later without touching UI code.
 */

import type { BookHighlights, Highlight } from '@/lib/types/highlights';

const getHighlightsDB = async () => {
  if (typeof globalThis.indexedDB === 'undefined') {
    throw new Error('Highlights storage is only available in a browser runtime.');
  }

  const { default: HighlightsDB } = await import('@/core/Storage/HighlightsDB');
  return HighlightsDB;
};

export class HighlightRepository {
  async add(highlight: Highlight): Promise<void> {
    const HighlightsDB = await getHighlightsDB();
    await HighlightsDB.addHighlight(highlight);
  }

  async update(
    id: string,
    updates: Partial<Omit<Highlight, 'id' | 'bookId' | 'createdAt'>>
  ): Promise<Highlight> {
    const HighlightsDB = await getHighlightsDB();
    await HighlightsDB.updateHighlight(id, updates);
    const updated = await HighlightsDB.getHighlight(id);
    if (!updated) throw new Error(`Highlight not found after update: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const HighlightsDB = await getHighlightsDB();
    await HighlightsDB.deleteHighlight(id);
  }

  async get(id: string): Promise<Highlight | undefined> {
    const HighlightsDB = await getHighlightsDB();
    return HighlightsDB.getHighlight(id);
  }

  async byBook(bookId: string): Promise<Highlight[]> {
    const HighlightsDB = await getHighlightsDB();
    return HighlightsDB.getHighlightsByBook(bookId);
  }

  async byChapter(bookId: string, href: string): Promise<Highlight[]> {
    const HighlightsDB = await getHighlightsDB();
    return HighlightsDB.getHighlightsByChapter(bookId, href);
  }

  async all(): Promise<BookHighlights[]> {
    const HighlightsDB = await getHighlightsDB();
    return HighlightsDB.getAllHighlights();
  }

  async deleteBook(bookId: string): Promise<void> {
    const HighlightsDB = await getHighlightsDB();
    await HighlightsDB.deleteBookHighlights(bookId);
  }

  async search(bookId: string, query: string): Promise<Highlight[]> {
    const HighlightsDB = await getHighlightsDB();
    return HighlightsDB.searchHighlights(bookId, query);
  }

  async exportAll(): Promise<string> {
    const HighlightsDB = await getHighlightsDB();
    return HighlightsDB.exportAll();
  }

  async importAll(json: string): Promise<void> {
    const HighlightsDB = await getHighlightsDB();
    await HighlightsDB.importAll(json);
  }
}

export const highlightRepository = new HighlightRepository();
export default highlightRepository;
