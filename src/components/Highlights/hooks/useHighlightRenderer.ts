/**
 * Hook for rendering highlights in the EPUB reader iframe.
 *
 * Text highlights render through the CSS Custom Highlight API when available,
 * avoiding DOM mutation and pagination drift. A <mark> wrapping fallback is
 * kept for older browsers.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/lib/store';
import type { Highlight } from '@/lib/types/highlights';
import { setSelectedHighlight } from '@/lib/highlightsReducer';
import HighlightsDB from '@/core/Storage/HighlightsDB';
import { locatorToRanges } from '../helpers/locatorToRange';
import {
  injectHighlightStyles,
  wrapRangeWithHighlight,
  removeHighlightMark,
  updateHighlightColor,
  toggleHighlightNoteIndicator,
  selectHighlightMark,
  deselectAllHighlights,
  getHighlightIdFromElement,
  renderCssHighlight,
  removeCssHighlight,
  updateCssHighlightAppearance,
  getCssHighlightIdAtPoint,
  clearRenderedHighlights,
} from '../helpers/highlightSerializer';

export interface HighlightClickPayload {
  highlightId: string;
  element: Element;
  iframe: HTMLIFrameElement;
  position: { x: number; y: number };
}

export interface UseHighlightRendererOptions {
  onHighlightClick?: (payload: HighlightClickPayload) => void;
}

/**
 * Hook return type
 */
export interface UseHighlightRendererReturn {
  restoreHighlights: (iframe: HTMLIFrameElement, href: string) => Promise<void>;
  renderHighlight: (highlight: Highlight, iframe: HTMLIFrameElement) => void;
  removeHighlight: (highlightId: string, iframe: HTMLIFrameElement) => void;
  updateHighlight: (highlight: Highlight, iframe: HTMLIFrameElement) => void;
  clearAllHighlights: (iframe: HTMLIFrameElement) => void;
  handleHighlightClick: (highlightId: string, doc: Document) => void;
}

/**
 * Hook for rendering and managing highlights in the reader
 */
export function useHighlightRenderer(
  bookId: string,
  options: UseHighlightRendererOptions = {}
): UseHighlightRendererReturn {
  const dispatch = useDispatch();
  const selectedHighlightId = useSelector((state: RootState) => state.highlights.selectedHighlightId);
  const renderedHighlightsRef = useRef<Set<string>>(new Set());

  const onHighlightClickRef = useRef<UseHighlightRendererOptions['onHighlightClick']>(options.onHighlightClick);

  useEffect(() => {
    onHighlightClickRef.current = options.onHighlightClick;
  }, [options.onHighlightClick]);

  /**
   * Handle click on a highlight.
   */
  const handleHighlightClick = useCallback((highlightId: string, doc: Document) => {
    selectHighlightMark(highlightId, doc);
    dispatch(setSelectedHighlight(highlightId));
  }, [dispatch]);

  /**
   * Inject styles and setup click handlers for an iframe.
   */
  const setupIframe = useCallback((iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    injectHighlightStyles(doc);

    const existingHandler = (doc as Document & { __thoriumHighlightClickHandler?: (event: MouseEvent) => void })
      .__thoriumHighlightClickHandler;
    if (existingHandler) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const domHighlightId = target ? getHighlightIdFromElement(target) : null;
      const cssHighlightId = getCssHighlightIdAtPoint(doc, event.clientX, event.clientY);
      const highlightId = domHighlightId || cssHighlightId;

      if (!highlightId) return;

      event.preventDefault();
      event.stopPropagation();

      handleHighlightClick(highlightId, doc);

      const iframeRect = iframe.getBoundingClientRect();
      const position = {
        x: iframeRect.left + event.clientX,
        y: iframeRect.top + event.clientY,
      };

      onHighlightClickRef.current?.({
        highlightId,
        element: target || doc.documentElement,
        iframe,
        position,
      });
    };

    (doc as Document & { __thoriumHighlightClickHandler?: (event: MouseEvent) => void })
      .__thoriumHighlightClickHandler = handleClick;

    // Capture phase lets us detect CSS highlights without relying on DOM nodes.
    doc.addEventListener('click', handleClick, true);
  }, [handleHighlightClick]);

  /**
   * Render a single highlight in the iframe.
   */
  const renderHighlight = useCallback((highlight: Highlight, iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    if (!doc) {
      console.warn('Cannot render highlight: iframe document not available');
      return;
    }

    try {
      if (renderedHighlightsRef.current.has(highlight.id)) return;

      const ranges = locatorToRanges(highlight.range, highlight.locator, doc);
      if (ranges.length === 0) {
        console.warn('Could not restore range for highlight:', highlight.id);
        return;
      }

      const renderedWithCss = renderCssHighlight(highlight, ranges, doc);

      if (!renderedWithCss) {
        // Browser fallback: mutate DOM with <mark> only when CSS.highlights is unavailable.
        for (const range of ranges) {
          wrapRangeWithHighlight(range, highlight.id, highlight.color, !!highlight.note);
        }
      }

      renderedHighlightsRef.current.add(highlight.id);
    } catch (error) {
      console.error('Failed to render highlight:', highlight.id, error);
    }
  }, []);

  /**
   * Restore all highlights for a specific chapter.
   */
  const restoreHighlights = useCallback(async (iframe: HTMLIFrameElement, href: string) => {
    const doc = iframe.contentDocument;
    if (!doc) {
      console.warn('Cannot restore highlights: iframe document not available');
      return;
    }

    setupIframe(iframe);

    // Important: remove stale CSS highlights / fallback marks before restoring.
    // This avoids nested <mark> fallback nodes and stale CSS ranges after reflow.
    clearRenderedHighlights(doc);
    renderedHighlightsRef.current.clear();

    try {
      const chapterHighlights = await HighlightsDB.getHighlightsByChapter(bookId, href);

      for (const highlight of chapterHighlights) {
        renderHighlight(highlight, iframe);
      }

      if (selectedHighlightId) selectHighlightMark(selectedHighlightId, doc);
    } catch (error) {
      console.error('Failed to restore highlights:', error);
    }
  }, [bookId, selectedHighlightId, setupIframe, renderHighlight]);

  /**
   * Remove a highlight from the iframe.
   */
  const removeHighlight = useCallback((highlightId: string, iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    removeCssHighlight(highlightId, doc);
    removeHighlightMark(highlightId, doc);
    renderedHighlightsRef.current.delete(highlightId);
  }, []);

  /**
   * Update a highlight's appearance.
   */
  const updateHighlight = useCallback((highlight: Highlight, iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    const updatedCss = updateCssHighlightAppearance(highlight, doc);

    if (!updatedCss) {
      updateHighlightColor(highlight.id, highlight.color, doc);
      toggleHighlightNoteIndicator(highlight.id, !!highlight.note, doc);
    }
  }, []);

  /**
   * Clear all highlights from the iframe.
   */
  const clearAllHighlights = useCallback((iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    clearRenderedHighlights(doc);
    renderedHighlightsRef.current.clear();
    deselectAllHighlights(doc);
  }, []);

  useEffect(() => {
    // Selection styling is applied when restoring/clicking inside a specific iframe.
  }, [selectedHighlightId]);

  return {
    restoreHighlights,
    renderHighlight,
    removeHighlight,
    updateHighlight,
    clearAllHighlights,
    handleHighlightClick,
  };
}
