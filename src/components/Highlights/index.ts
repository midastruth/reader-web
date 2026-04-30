/**
 * Index file for Highlights components
 * Exports all highlight-related components and utilities
 */

// Main component
export { HighlightManager } from './HighlightManager';
export type { HighlightManagerProps, TextSelectedHandler } from './HighlightManager';

// UI Components
export { HighlightToolbar } from './HighlightToolbar';
export type { HighlightToolbarProps } from './HighlightToolbar';

export { HighlightContextMenu } from './HighlightContextMenu';
export type { HighlightContextMenuProps } from './HighlightContextMenu';

export { HighlightNote } from './HighlightNote';

export { HighlightsList } from './HighlightsList';
export type { HighlightsListProps } from './HighlightsList';

export { HighlightExporter } from './HighlightExporter';
export type { HighlightExporterProps } from './HighlightExporter';

// Hooks
export { useHighlightSelection } from './hooks/useHighlightSelection';
export type { UseHighlightSelectionReturn, TextSelection } from './hooks/useHighlightSelection';

export { useHighlightRenderer } from './hooks/useHighlightRenderer';
export type { UseHighlightRendererReturn } from './hooks/useHighlightRenderer';

// Core service/storage
export { default as HighlightsDB } from '@/core/Storage/HighlightsDB';
export {
  HighlightService,
  highlightService,
  HighlightRepository,
  highlightRepository,
  HighlightRenderer,
  HighlightAnchors,
  buildHighlightSortKey,
  sortHighlightsByReadingOrder,
} from '@/core/Highlights';

// Types
export type {
  Highlight,
  HighlightColor,
  HighlightLocator,
  SerializedRange,
  BookHighlights,
  ExportFormat,
  HighlightSortBy,
  HighlightFilter,
  HighlightStats,
} from '@/lib/types/highlights';

// Redux actions
export {
  setCurrentBook,
  loadHighlights,
  addHighlight,
  updateHighlight,
  deleteHighlight,
  setSelectedHighlight,
  setActiveColor,
  openNoteEditor,
  closeNoteEditor,
  toggleHighlightsList,
  setHighlightsListVisible,
} from '@/lib/highlightsReducer';
