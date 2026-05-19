/**
 * DOM-layer barrel for the highlight system.
 *
 * Anchor serialization lives in rangeToAnchor / anchorToRange. Rendering is
 * split between cssHighlights (primary) and markFallback (legacy). The two
 * unified helpers below combine both renderers for callers that don't care
 * which one rendered a given highlight.
 */

import {
  deselectAllCssHighlights,
  removeAllCssHighlights,
  selectCssHighlight,
} from './cssHighlights';
import {
  clearAllHighlightMarks,
  deselectAllMarkHighlights,
  selectHighlightMark as selectMarkHighlight,
} from './markFallback';

// Anchor (serialize / restore)
export {
  rangeToLocator,
  serializeRange,
  normalizeRange,
  isValidTextRange,
  canRestoreRange,
} from './rangeToAnchor';

export {
  locatorToRange,
  locatorToRanges,
} from './anchorToRange';

// Base CSS injection + shared color tokens
export {
  injectHighlightStyles,
  HIGHLIGHT_COLORS,
  SELECTED_HIGHLIGHT_COLORS,
  NOTE_MARK_BORDER,
} from './injectStyles';

// Primary renderer (CSS Custom Highlight API)
export {
  renderCssHighlight,
  removeCssHighlight,
  updateCssHighlightAppearance,
  getCssHighlightIdsAtPoint,
} from './cssHighlights';

// Fallback renderer (<mark> wrapping)
export {
  wrapRangeWithHighlight,
  removeHighlightMark,
  updateHighlightColor,
  toggleHighlightNoteIndicator,
  getHighlightIdFromElement,
} from './markFallback';

/** Select a highlight in whichever renderer is active. */
export function selectHighlightMark(highlightId: string, doc: Document): void {
  deselectAllHighlights(doc);
  selectCssHighlight(highlightId, doc);
  selectMarkHighlight(highlightId, doc);
}

/** Deselect every rendered highlight in both renderers. */
export function deselectAllHighlights(doc: Document): void {
  deselectAllCssHighlights(doc);
  deselectAllMarkHighlights(doc);
}

/** Remove every rendered highlight in both renderers. */
export function clearRenderedHighlights(doc: Document): void {
  removeAllCssHighlights(doc);
  clearAllHighlightMarks(doc);
}
