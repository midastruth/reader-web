/**
 * Core highlight domain models.
 *
 * React components should depend on these models/services instead of talking
 * directly to IndexedDB or DOM serializers. This mirrors KOReader's split
 * between ReaderHighlight (interaction), ReaderAnnotation (data), and
 * ReaderView (rendering).
 */

import type { Highlight, HighlightColor } from '@/lib/types/highlights';

export type {
  Highlight,
  HighlightColor,
  HighlightLocator,
  SerializedRange,
  BlockSerializedRange,
  BlockRangePart,
  LegacySerializedRange,
  BookHighlights,
  HighlightFilter,
  HighlightStats,
} from '@/lib/types/highlights';

/** DOM selection captured by the reader/navigator layer. */
export interface TextSelection {
  range: Range;
  text: string;
  href: string;
  /** Resource progression, 0–1. Kept for backwards compatibility. */
  position?: number;
  /** Reading-order position when available. */
  readingOrderPosition?: number;
  /** Resource progression, 0–1. */
  progression?: number;
  /** Total publication progression, 0–1. */
  totalProgression?: number;
  cleanText?: string;
  rawText?: string;
  boundingClientRect?: DOMRect;
}

export interface CreateHighlightInput {
  bookId: string;
  selection: TextSelection;
  color: HighlightColor;
  note?: string;
}

export interface HighlightUpdateInput {
  color?: Highlight['color'];
  note?: string;
  locator?: Highlight['locator'];
  range?: Highlight['range'];
  sortKey?: string;
}

export interface HighlightRenderTarget {
  iframe: HTMLIFrameElement;
  href: string;
}

export interface HighlightHit {
  highlightId: string;
  rect?: DOMRect;
}
