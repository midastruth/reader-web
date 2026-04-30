/**
 * Hook for rendering highlights in the EPUB reader iframe.
 *
 * React wrapper around core/Highlights/HighlightRenderer. Rendering is kept out
 * of components, mirroring KOReader's separated ReaderView layer.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/lib/store';
import type { Highlight } from '@/lib/types/highlights';
import { setSelectedHighlight } from '@/lib/highlightsReducer';
import { HighlightRenderer, highlightService } from '@/core/Highlights';

export interface HighlightClickPayload {
  highlightId: string;
  highlightIds: string[];
  element: Element;
  iframe: HTMLIFrameElement;
  position: { x: number; y: number };
}

export interface UseHighlightRendererOptions {
  onHighlightClick?: (payload: HighlightClickPayload) => void;
}

export interface UseHighlightRendererReturn {
  restoreHighlights: (iframe: HTMLIFrameElement, href: string) => Promise<void>;
  renderHighlight: (highlight: Highlight, iframe: HTMLIFrameElement) => void;
  removeHighlight: (highlightId: string, iframe: HTMLIFrameElement) => void;
  updateHighlight: (highlight: Highlight, iframe: HTMLIFrameElement) => void;
  clearAllHighlights: (iframe: HTMLIFrameElement) => void;
  handleHighlightClick: (highlightId: string, doc: Document) => void;
}

export function useHighlightRenderer(
  bookId: string,
  options: UseHighlightRendererOptions = {}
): UseHighlightRendererReturn {
  const dispatch = useDispatch();
  const selectedHighlightId = useSelector((state: RootState) => state.highlights.selectedHighlightId);
  const rendererRef = useRef(new HighlightRenderer());
  const onHighlightClickRef = useRef<UseHighlightRendererOptions['onHighlightClick']>(options.onHighlightClick);

  useEffect(() => {
    onHighlightClickRef.current = options.onHighlightClick;
  }, [options.onHighlightClick]);

  const handleHighlightClick = useCallback((highlightId: string, doc: Document) => {
    rendererRef.current.select(highlightId, doc);
    dispatch(setSelectedHighlight(highlightId));
  }, [dispatch]);

  const setupIframe = useCallback((iframe: HTMLIFrameElement) => {
    const doc = rendererRef.current.setup(iframe);
    if (!doc) return;

    const holder = doc as Document & { __thoriumHighlightClickHandler?: (event: MouseEvent) => void };
    if (holder.__thoriumHighlightClickHandler) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const highlightIds = rendererRef.current.getIdsFromClick(doc, target, event.clientX, event.clientY);
      const highlightId = highlightIds[0];
      if (!highlightId) return;

      event.preventDefault();
      event.stopPropagation();

      handleHighlightClick(highlightId, doc);

      const iframeRect = iframe.getBoundingClientRect();
      onHighlightClickRef.current?.({
        highlightId,
        highlightIds,
        element: target || doc.documentElement,
        iframe,
        position: {
          x: iframeRect.left + event.clientX,
          y: iframeRect.top + event.clientY,
        },
      });
    };

    holder.__thoriumHighlightClickHandler = handleClick;
    doc.addEventListener('click', handleClick, true);
  }, [handleHighlightClick]);

  const renderHighlight = useCallback((highlight: Highlight, iframe: HTMLIFrameElement) => {
    try {
      if (!rendererRef.current.render(highlight, iframe)) {
        console.warn('Could not restore range for highlight:', highlight.id);
      }
    } catch (error) {
      console.error('Failed to render highlight:', highlight.id, error);
    }
  }, []);

  const restoreHighlights = useCallback(async (iframe: HTMLIFrameElement, href: string) => {
    const doc = iframe.contentDocument;
    if (!doc) {
      console.warn('Cannot restore highlights: iframe document not available');
      return;
    }

    setupIframe(iframe);

    try {
      const chapterHighlights = await highlightService.loadChapter(bookId, href);
      rendererRef.current.restore(chapterHighlights, iframe);
      if (selectedHighlightId) rendererRef.current.select(selectedHighlightId, doc);
    } catch (error) {
      console.error('Failed to restore highlights:', error);
    }
  }, [bookId, selectedHighlightId, setupIframe]);

  const removeHighlight = useCallback((highlightId: string, iframe: HTMLIFrameElement) => {
    rendererRef.current.remove(highlightId, iframe);
  }, []);

  const updateHighlight = useCallback((highlight: Highlight, iframe: HTMLIFrameElement) => {
    rendererRef.current.update(highlight, iframe);
  }, []);

  const clearAllHighlights = useCallback((iframe: HTMLIFrameElement) => {
    rendererRef.current.clear(iframe);
  }, []);

  return {
    restoreHighlights,
    renderHighlight,
    removeHighlight,
    updateHighlight,
    clearAllHighlights,
    handleHighlightClick,
  };
}
