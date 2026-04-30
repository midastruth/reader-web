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
  PINK = 'pink',
  ORANGE = 'orange',
  PURPLE = 'purple'
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
}

/**
 * Collection of highlights for a specific book
 */
export interface BookHighlights {
  /** Book identifier */
  bookId: string;
  /** Array of highlights */
  highlights: Highlight[];
  /** Last modification timestamp */
  lastModified: number;
}

/**
 * Export format options
 */
export enum ExportFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  HTML = 'html',
  PDF = 'pdf'
}

/**
 * Sort options for highlight list
 */
export enum HighlightSortBy {
  POSITION = 'position',      // By reading order
  CREATED = 'created',         // By creation date
  UPDATED = 'updated',         // By last update
  COLOR = 'color'              // By color
}

/**
 * Filter options for highlight list
 */
export interface HighlightFilter {
  /** Filter by specific colors */
  colors?: HighlightColor[];
  /** Show only highlights with notes */
  withNotesOnly?: boolean;
  /** Search text in highlights and notes */
  searchText?: string;
}

/**
 * Statistics for highlights
 */
export interface HighlightStats {
  /** Total number of highlights */
  total: number;
  /** Count by color */
  byColor: Record<HighlightColor, number>;
  /** Highlights with notes */
  withNotes: number;
  /** Total characters highlighted */
  totalCharacters: number;
}
