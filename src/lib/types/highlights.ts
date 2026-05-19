/**
 * Text highlighting and annotation system types
 * Supports multi-color highlights with notes, similar to Kindle
 */

/**
 * Available highlight colors
 */
export enum HighlightColor {
  YELLOW = 'yellow',
  GREEN = 'green',
  BLUE = 'blue',
  RED = 'red',
  PURPLE = 'purple',
  GRAY = 'gray',
}

const LEGACY_COLOR_MAP: Partial<Record<string, HighlightColor>> = {
  pink: HighlightColor.RED,
  orange: HighlightColor.YELLOW,
};

/** Normalize any stored color string to the current HighlightColor enum. */
export function normalizeHighlightColor(color: string): HighlightColor {
  if ((Object.values(HighlightColor) as string[]).includes(color)) return color as HighlightColor;
  return LEGACY_COLOR_MAP[color] ?? HighlightColor.YELLOW;
}

/**
 * Legacy DOM Range serialization.
 *
 * Kept for backwards compatibility with highlights created by the older
 * implementation. New highlights use the block-offset model below.
 */
export interface LegacySerializedRange {
  type?: 'dom-xpath';
  /** XPath to the start container node */
  startContainerPath: string;
  /** Offset within the start container */
  startOffset: number;
  /** XPath to the end container node */
  endContainerPath: string;
  /** Offset within the end container */
  endOffset: number;
}

/**
 * One text highlight segment anchored to a stable block element.
 *
 * This is inspired by Obsidian Web Clipper's model: store the XPath of a
 * paragraph/list-item/heading/etc. and character offsets within that block,
 * instead of storing fragile text-node XPaths.
 */
export interface BlockRangePart {
  /** XPath to the block element that contains this text segment */
  blockPath: string;
  /** Start character offset in the block's concatenated text */
  startOffset: number;
  /** End character offset in the block's concatenated text */
  endOffset: number;
  /** Text captured for this segment, useful for fallback/debugging */
  text?: string;
}

/**
 * New Obsidian-style block-offset range serialization.
 * A single user selection may cross multiple blocks; each block becomes one
 * part, while the Highlight remains one logical annotation.
 */
export interface BlockSerializedRange {
  type: 'block-offset';
  parts: BlockRangePart[];
}

/**
 * Serialized highlight range.
 */
export type SerializedRange = LegacySerializedRange | BlockSerializedRange;

/**
 * Readium Locator for precise content positioning
 */
export interface HighlightLocator {
  /** Chapter/resource href (e.g., "chapter1.xhtml") */
  href: string;
  /** Location information */
  locations: {
    /** Progression within the resource (0-1) */
    progression?: number;
    /** Position in reading order */
    position?: number;
    /** Total progression in publication (0-1) */
    totalProgression?: number;
  };
  /** Text context for fallback matching */
  text: {
    /** Text before the highlight */
    before?: string;
    /** The highlighted text content */
    highlight: string;
    /** Text after the highlight */
    after?: string;
  };
}

/**
 * KOReader sync state for a highlight.
 * Tracks whether this highlight has been uploaded to book-aware and resolved
 * to a native KOReader XPointer annotation.
 */
export interface KoreaderSyncState {
  /** Sync lifecycle: pending (uploaded, awaiting KOReader), resolved, conflict, or failed. */
  status: 'pending' | 'resolved' | 'conflict' | 'failed';
  /** ID of the corresponding highlight in the book-aware backend. */
  backendId?: string;
  /** KOReader XPointer for start of annotation (set after KOReader resolves it). */
  pos0?: string;
  /** KOReader XPointer for end of annotation (set after KOReader resolves it). */
  pos1?: string;
  /** KOReader display page (set after KOReader resolves it). */
  page?: string;
  /** Last sync error, set when status is failed. */
  error?: string;
}

/**
 * A single highlight/annotation
 */
export interface Highlight {
  /** Unique identifier (UUID) */
  id: string;
  /** Book/publication identifier */
  bookId: string;
  /** Highlight color */
  color: HighlightColor;
  /** Creation timestamp (ms since epoch) */
  createdAt: number;
  /** Last update timestamp (ms since epoch) */
  updatedAt: number;
  /** Optional user note/annotation */
  note?: string;
  /** Readium locator for cross-platform positioning */
  locator: HighlightLocator;
  /** Serialized range for rendering */
  range: SerializedRange;
  /** Anchor schema version. Missing means legacy pre-service data. */
  anchorVersion?: number;
  /** Stable reading-order key used by list sorting and conflict resolution. */
  sortKey?: string;
  /** KOReader sync state. Present only when the highlight has been uploaded to book-aware. */
  koreader?: KoreaderSyncState;
}

