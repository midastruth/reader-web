/**
 * IndexedDB storage for text highlights and annotations
 * Uses Dexie.js for a modern, promise-based API
 */

import Dexie, { Table } from 'dexie';
import type { Highlight, BookHighlights } from '@/lib/types/highlights';

/**
 * Highlights database schema
 */
class HighlightsDatabase extends Dexie {
  /** Individual highlights table */
  highlights!: Table<Highlight, string>;

  /** Book-level metadata table */
  bookMetadata!: Table<{ bookId: string; lastModified: number }, string>;

  constructor() {
    super('ThoriumHighlights');

    // Schema version 1
    this.version(1).stores({
      highlights: 'id, bookId, createdAt, updatedAt, [bookId+locator.href]',
      bookMetadata: 'bookId, lastModified'
    });
  }
}

// Singleton instance
const db = new HighlightsDatabase();

/**
 * Storage layer for highlights
 * Provides CRUD operations with IndexedDB persistence
 */
export class HighlightsDB {
  /**
   * Add a new highlight
   */
  static async addHighlight(highlight: Highlight): Promise<void> {
    await db.transaction('rw', [db.highlights, db.bookMetadata], async () => {
      await db.highlights.add(highlight);
      await db.bookMetadata.put({
        bookId: highlight.bookId,
        lastModified: Date.now()
      });
    });
  }

  /**
   * Update an existing highlight
   */
  static async updateHighlight(
    id: string,
    updates: Partial<Omit<Highlight, 'id' | 'bookId' | 'createdAt'>>
  ): Promise<void> {
    const existing = await db.highlights.get(id);
    if (!existing) {
      throw new Error(`Highlight not found: ${id}`);
    }

    const updated: Highlight = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };

    await db.transaction('rw', [db.highlights, db.bookMetadata], async () => {
      await db.highlights.put(updated);
      await db.bookMetadata.put({
        bookId: existing.bookId,
        lastModified: Date.now()
      });
    });
  }

  /**
   * Delete a highlight
   */
  static async deleteHighlight(id: string): Promise<void> {
    const existing = await db.highlights.get(id);
    if (!existing) {
      throw new Error(`Highlight not found: ${id}`);
    }

    await db.transaction('rw', [db.highlights, db.bookMetadata], async () => {
      await db.highlights.delete(id);
      await db.bookMetadata.put({
        bookId: existing.bookId,
        lastModified: Date.now()
      });
    });
  }

  /**
   * Get all highlights for a specific book
   * Sorted by creation time by default
   */
  static async getHighlightsByBook(bookId: string): Promise<Highlight[]> {
    return await db.highlights
      .where('bookId')
      .equals(bookId)
      .sortBy('createdAt');
  }

  /**
   * Get highlights for a specific chapter/resource
   */
  static async getHighlightsByChapter(
    bookId: string,
    href: string
  ): Promise<Highlight[]> {
    const allHighlights = await this.getHighlightsByBook(bookId);
    return allHighlights.filter(h => h.locator.href === href);
  }

  /**
   * Get a single highlight by ID
   */
  static async getHighlight(id: string): Promise<Highlight | undefined> {
    return await db.highlights.get(id);
  }

  /**
   * Get all highlights across all books
   */
  static async getAllHighlights(): Promise<BookHighlights[]> {
    const allHighlights = await db.highlights.toArray();

    // Group by book
    const byBook = new Map<string, Highlight[]>();
    for (const highlight of allHighlights) {
      const existing = byBook.get(highlight.bookId) || [];
      existing.push(highlight);
      byBook.set(highlight.bookId, existing);
    }

    // Get metadata
    const metadata = await db.bookMetadata.toArray();
    const metadataMap = new Map(
      metadata.map(m => [m.bookId, m.lastModified])
    );

    // Build result
    return Array.from(byBook.entries()).map(([bookId, highlights]) => ({
      bookId,
      highlights,
      lastModified: metadataMap.get(bookId) || Date.now()
    }));
  }

  /**
   * Delete all highlights for a specific book
   */
  static async deleteBookHighlights(bookId: string): Promise<void> {
    await db.transaction('rw', [db.highlights, db.bookMetadata], async () => {
      await db.highlights.where('bookId').equals(bookId).delete();
      await db.bookMetadata.delete(bookId);
    });
  }

  /**
   * Get count of highlights for a book
   */
  static async getHighlightCount(bookId: string): Promise<number> {
    return await db.highlights.where('bookId').equals(bookId).count();
  }

  /**
   * Search highlights by text content
   */
  static async searchHighlights(
    bookId: string,
    searchText: string
  ): Promise<Highlight[]> {
    const allHighlights = await this.getHighlightsByBook(bookId);
    const searchLower = searchText.toLowerCase();

    return allHighlights.filter(h => {
      const textMatch = h.locator.text.highlight.toLowerCase().includes(searchLower);
      const noteMatch = h.note?.toLowerCase().includes(searchLower);
      return textMatch || noteMatch;
    });
  }

  /**
   * Export all data (for backup)
   */
  static async exportAll(): Promise<string> {
    const allData = await this.getAllHighlights();
    return JSON.stringify(allData, null, 2);
  }

  /**
   * Import data (from backup)
   */
  static async importAll(jsonData: string): Promise<void> {
    const data: BookHighlights[] = JSON.parse(jsonData);

    await db.transaction('rw', [db.highlights, db.bookMetadata], async () => {
      for (const bookData of data) {
        await db.highlights.bulkPut(bookData.highlights);
        await db.bookMetadata.put({
          bookId: bookData.bookId,
          lastModified: bookData.lastModified
        });
      }
    });
  }

  /**
   * Clear all data (for testing/reset)
   */
  static async clearAll(): Promise<void> {
    await db.transaction('rw', [db.highlights, db.bookMetadata], async () => {
      await db.highlights.clear();
      await db.bookMetadata.clear();
    });
  }

  /**
   * Check if IndexedDB is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      await db.open();
      return true;
    } catch (error) {
      console.error('IndexedDB not available:', error);
      return false;
    }
  }
}

export default HighlightsDB;
