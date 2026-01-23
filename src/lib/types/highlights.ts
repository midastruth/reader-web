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
 * Serialized DOM Range information for rendering highlights
 * Uses XPath to locate nodes in the DOM tree
 */
export interface SerializedRange {
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
  /** Serialized DOM range for rendering */
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
