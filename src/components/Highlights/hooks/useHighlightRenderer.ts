/**
 * Hook for rendering highlights in the EPUB reader iframe
 * Handles highlight restoration, updates, and removal
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/lib/store';
import type { Highlight } from '@/lib/types/highlights';
import { setSelectedHighlight } from '@/lib/highlightsReducer';
import HighlightsDB from '@/core/Storage/HighlightsDB';
import { locatorToRange } from '../helpers/locatorToRange';
import {
  injectHighlightStyles,
  wrapRangeWithHighlight,
  removeHighlightMark,
  updateHighlightColor,
  toggleHighlightNoteIndicator,
  selectHighlightMark,
  deselectAllHighlights,
  getHighlightIdFromElement,
} from '../helpers/highlightSerializer';

/**
 * Hook return type
 */
export interface UseHighlightRendererReturn {
  restoreHighlights: (iframe: HTMLIFrameElement, href: string) => Promise<void>;
  renderHighlight: (highlight: Highlight, iframe: HTMLIFrameElement) => void;
  removeHighlight: (highlightId: string, iframe: HTMLIFrameElement) => void;
  updateHighlight: (highlight: Highlight, iframe: HTMLIFrameElement) => void;
  clearAllHighlights: (iframe: HTMLIFrameElement) => void;
  handleHighlightClick: (element: Element) => void;
}

/**
 * Hook for rendering and managing highlights in the reader
 */
export function useHighlightRenderer(bookId: string): UseHighlightRendererReturn {
  const dispatch = useDispatch();
  const highlights = useSelector((state: RootState) => state.highlights.currentBookHighlights);
  const selectedHighlightId = useSelector((state: RootState) => state.highlights.selectedHighlightId);
  const renderedHighlightsRef = useRef<Set<string>>(new Set());

  /**
   * Inject styles and setup click handlers for an iframe
   */
  const setupIframe = useCallback((iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Inject highlight styles
    injectHighlightStyles(doc);

    const existingHandler = (doc as any).__thoriumHighlightClickHandler as ((event: MouseEvent) => void) | undefined;

    if (existingHandler) {

      return;

    }



    const handleClick = (event: MouseEvent) => {

      const target = event.target as Element;

      const highlightId = getHighlightIdFromElement(target);



      if (highlightId) {

        event.preventDefault();

        event.stopPropagation();

        handleHighlightClick(target);

      }

    };



    (doc as any).__thoriumHighlightClickHandler = handleClick;

    doc.addEventListener('click', handleClick);

  }, []);

  /**
   * Handle click on a highlight
   */
  const handleHighlightClick = useCallback((element: Element) => {
    const highlightId = getHighlightIdFromElement(element);
    if (!highlightId) return;

    const doc = element.ownerDocument;
    if (!doc) return;

    // Select the highlight
    selectHighlightMark(highlightId, doc);
    dispatch(setSelectedHighlight(highlightId));


  }, [dispatch]);

  /**
   * Render a single highlight in the iframe
   */
  const renderHighlight = useCallback((highlight: Highlight, iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    if (!doc) {
      console.warn('Cannot render highlight: iframe document not available');
      return;
    }

    try {
      // Skip if already rendered
      if (renderedHighlightsRef.current.has(highlight.id)) {
        return;
      }

      // Restore the range from the serialized data

      const range = locatorToRange(highlight.range, highlight.locator, doc);


      if (!range) {
        console.warn('Could not restore range for highlight:', highlight.id);
        return;
      }

      // Wrap the range with highlight mark

      const mark = wrapRangeWithHighlight(range, highlight.id, highlight.color, !!highlight.note);


      if (mark) {
        renderedHighlightsRef.current.add(highlight.id);

      }
    } catch (error) {
      console.error('Failed to render highlight:', highlight.id, error);
    }
  }, []);

  /**
   * Restore all highlights for a specific chapter
   */
  const restoreHighlights = useCallback(async (iframe: HTMLIFrameElement, href: string) => {
    const doc = iframe.contentDocument;
    if (!doc) {
      console.warn('Cannot restore highlights: iframe document not available');
      return;
    }

    // Setup iframe (inject styles, event handlers)
    setupIframe(iframe);

    // Clear rendered highlights tracking
    renderedHighlightsRef.current.clear();

    try {
      // Get highlights for this chapter from IndexedDB
      const chapterHighlights = await HighlightsDB.getHighlightsByChapter(bookId, href);



      // Render each highlight
      for (const highlight of chapterHighlights) {
        renderHighlight(highlight, iframe);
      }

      // Restore selection state if any
      if (selectedHighlightId) {
        selectHighlightMark(selectedHighlightId, doc);
      }
    } catch (error) {
      console.error('Failed to restore highlights:', error);
    }
  }, [bookId, selectedHighlightId, setupIframe, renderHighlight]);

  /**
   * Remove a highlight from the iframe
   */
  const removeHighlight = useCallback((highlightId: string, iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    removeHighlightMark(highlightId, doc);
    renderedHighlightsRef.current.delete(highlightId);

  }, []);

  /**
   * Update a highlight's appearance
   */
  const updateHighlight = useCallback((highlight: Highlight, iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Update color
    updateHighlightColor(highlight.id, highlight.color, doc);

    // Update note indicator
    toggleHighlightNoteIndicator(highlight.id, !!highlight.note, doc);

  }, []);

  /**
   * Clear all highlights from the iframe
   */
  const clearAllHighlights = useCallback((iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    for (const highlightId of renderedHighlightsRef.current) {
      removeHighlightMark(highlightId, doc);
    }

    renderedHighlightsRef.current.clear();
    deselectAllHighlights(doc);
  }, []);

  /**
   * Update selection state when selectedHighlightId changes
   */
  useEffect(() => {
    // This will be handled by the iframe-specific logic
    // The actual DOM update happens in restoreHighlights and handleHighlightClick
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
