/**
 * Public surface of the Highlights feature.
 *
 * Only re-exports things that are actually consumed outside this folder:
 * the React entry component, its imperative handle, the selection types,
 * and the shared domain types/actions consumed by the EPUB reader bridge.
 */

// Main component + imperative handle
export { HighlightManager } from './HighlightManager';
export type {
  HighlightManagerProps,
  HighlightManagerHandle,
  TextSelectedHandler,
} from './HighlightManager';

// UI Components (kept exported so they can be reused / customised)
export { HighlightToolbar } from './HighlightToolbar';
export type { HighlightToolbarProps } from './HighlightToolbar';

export { HighlightContextMenu } from './HighlightContextMenu';
export type { HighlightContextMenuProps } from './HighlightContextMenu';

export { HighlightNote } from './HighlightNote';

// Hooks
export { useHighlightSelection } from './hooks/useHighlightSelection';
export type { UseHighlightSelectionReturn, TextSelection } from './hooks/useHighlightSelection';

export { useHighlightRenderer } from './hooks/useHighlightRenderer';
export type { UseHighlightRendererReturn } from './hooks/useHighlightRenderer';

// Core service re-exports (so feature consumers do not need to know the path)
export {
  HighlightService,
  highlightService,
  HighlightRenderer,
  HighlightAnchors,
  buildHighlightSortKey,
  sortHighlightsByReadingOrder,
} from '@/core/Highlights';

// Shared types
export type {
  Highlight,
  HighlightColor,
  HighlightLocator,
  SerializedRange,
} from '@/lib/types/highlights';

// Redux actions used by the EPUB bridge / external code
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
} from '@/lib/highlightsReducer';
