/**
 * Coordinator component for the highlight feature.
 *
 * Owns no business logic of its own — it wires together:
 *  - the selection / renderer hooks (data + iframe DOM)
 *  - the popup-state hook (toolbar / context menu / overlap chooser / AI panel)
 *  - the iframe-selection-dismissal hook (auto-hide toolbar on deselection)
 *
 * Exposes an imperative handle so the EPUB navigator bridge can push text
 * selections and trigger per-chapter highlight restoration.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState } from '@/lib/store';
import { HighlightColor, type Highlight } from '@/lib/types/highlights';
import {
  addHighlight,
  deleteHighlight,
  loadHighlights,
  openNoteEditor,
  setCurrentBook,
  setSelectedHighlight,
  updateHighlight,
} from '@/lib/highlightsReducer';
import {
  highlightSyncService,
  resolveHitHighlights,
  type PullChangesResult,
} from '@/core/Highlights';

import { useHighlightSelection, type TextSelection } from './hooks/useHighlightSelection';
import { useHighlightRenderer, type HighlightClickPayload } from './hooks/useHighlightRenderer';
import { useHighlightInteractions } from './hooks/useHighlightInteractions';
import { useIframeSelectionDismissal } from './hooks/useIframeSelectionDismissal';

import { HighlightToolbar } from './HighlightToolbar';
import { HighlightContextMenu } from './HighlightContextMenu';
import { HighlightNote } from './HighlightNote';
import { OverlapChooser } from './ui/OverlapChooser';
import { AiChatPanel, type AiAction } from '@/components/AI/AiChatPanel';

export interface HighlightManagerProps {
  /** Book/publication ID */
  bookId: string;
  /** Book title (optional, for display) */
  bookTitle?: string;
  /** Book author (optional, for AI queries) */
  bookAuthor?: string;
  /** Current chapter title (optional, for AI queries) */
  currentChapter?: string;
  /** Reading progress 0–1 (optional, for AI queries) */
  readingProgress?: number;
  /** Reference to the reader iframe */
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

export interface HighlightManagerHandle {
  handleTextSelected: (selection: TextSelection) => void;
  restoreForIframe: (
    iframe: HTMLIFrameElement,
    href: string,
    readingOrderPosition?: number
  ) => Promise<void>;
}

/** Window (ms) during which we trust the last pointerup position over the selection rect. */
const POINTER_UP_WINDOW_MS = 1000;

function normalizeHref(href: string): string {
  return decodeURIComponent(href).split('#')[0].split('?')[0];
}

export const HighlightManager = React.forwardRef<HighlightManagerHandle, HighlightManagerProps>(
  function HighlightManager(
    { bookId, bookTitle, bookAuthor, currentChapter, readingProgress, iframeRef },
    ref
  ) {
    const dispatch = useDispatch<AppDispatch>();
    const store = useStore<RootState>();

    const highlights = useSelector((state: RootState) => state.highlights.currentBookHighlights);
    const activeColor = useSelector((state: RootState) => state.highlights.activeColor);

    const interactions = useHighlightInteractions();
    const pendingSelectionRef = useRef<TextSelection | null>(null);
    const loadedFramesRef = useRef(new Map<string, { iframe: HTMLIFrameElement; readingOrderPosition?: number }>());

    // Track which iframe the user last interacted with (important for FXL spreads).
    const activeIframeRef = useRef<HTMLIFrameElement | null>(null);

    const hideToolbar = useCallback(() => {
      interactions.hideToolbar();
      pendingSelectionRef.current = null;
    }, [interactions]);

    const iframeSelection = useIframeSelectionDismissal({ onSelectionCleared: hideToolbar });

    // Resolve which iframe a given selection belongs to. Selections from FXL
    // spreads may live in a different iframe than the "current" one.
    const getIframeForSelection = useCallback(
      (selection: TextSelection | null) => {
        const iframeFromSelection =
          selection?.range.startContainer.ownerDocument?.defaultView
            ?.frameElement as HTMLIFrameElement | null;
        return iframeFromSelection || activeIframeRef.current || iframeRef?.current || null;
      },
      [iframeRef]
    );

    const handleHighlightClick = useCallback(
      ({ highlightId, highlightIds, position, iframe }: HighlightClickPayload) => {
        activeIframeRef.current = iframe;

        const hit = resolveHitHighlights(highlightIds, highlights);
        if (hit.length > 1) {
          interactions.showOverlapChooser(position, hit);
          return;
        }

        const highlight = hit[0] ?? highlights.find((h) => h.id === highlightId);
        if (highlight) interactions.showContextMenu(position, highlight);
      },
      [highlights, interactions]
    );

    const { createHighlight, isValidSelection } = useHighlightSelection(bookId, currentChapter);
    const {
      restoreHighlights,
      renderHighlight,
      removeHighlight,
      updateHighlight: updateHighlightInDOM,
      handleHighlightClick: selectRenderedHighlight,
    } = useHighlightRenderer(bookId, { onHighlightClick: handleHighlightClick });

    // Keep handler refs current so the sync session callbacks (registered once)
    // always see the latest renderer functions.
    const renderHighlightRef = useRef(renderHighlight);
    const removeHighlightRef = useRef(removeHighlight);
    const updateHighlightInDOMRef = useRef(updateHighlightInDOM);
    useEffect(() => { renderHighlightRef.current = renderHighlight; }, [renderHighlight]);
    useEffect(() => { removeHighlightRef.current = removeHighlight; }, [removeHighlight]);
    useEffect(() => { updateHighlightInDOMRef.current = updateHighlightInDOM; }, [updateHighlightInDOM]);

    const applyPulledChanges = useCallback(
      (result: PullChangesResult) => {
        for (const id of result.deleted) {
          dispatch(deleteHighlight(id));
          for (const { iframe } of loadedFramesRef.current.values()) {
            removeHighlightRef.current(id, iframe);
          }
        }

        for (const highlight of result.added) {
          dispatch(addHighlight(highlight));
          const href = normalizeHref(highlight.locator.href || '');
          const frame = href ? loadedFramesRef.current.get(href) : undefined;
          if (frame) renderHighlightRef.current(highlight, frame.iframe);
        }

        for (const highlight of result.updated) {
          dispatch(updateHighlight({ id: highlight.id, updates: highlight }));
          const href = normalizeHref(highlight.locator.href || '');
          const frame = href ? loadedFramesRef.current.get(href) : undefined;
          if (frame) updateHighlightInDOMRef.current(highlight, frame.iframe);
        }
      },
      [dispatch]
    );

    // Single effect: own the sync session for the current book.
    useEffect(() => {
      dispatch(setCurrentBook(bookId));
      loadedFramesRef.current.clear();

      const session = highlightSyncService.start(bookId, {
        getCurrentHighlights: () => store.getState().highlights.currentBookHighlights,
        onInitialLoad: (bookHighlights) => dispatch(loadHighlights(bookHighlights)),
        onPulledChanges: applyPulledChanges,
        onError: (error, phase) => {
          console.error(`Highlight sync failed during ${phase}:`, error);
        },
      });

      return () => session.stop();
    }, [applyPulledChanges, bookId, dispatch, store]);

    // Dismiss the toolbar when clicking outside it (outer document only — iframe
    // clicks are handled by useIframeSelectionDismissal).
    useEffect(() => {
      const handlePointerDown = (event: PointerEvent) => {
        if (!pendingSelectionRef.current) return;
        const target = event.target;
        if (!(target instanceof Element) || !target.closest('.highlight-toolbar')) {
          hideToolbar();
        }
      };
      document.addEventListener('pointerdown', handlePointerDown, true);
      return () => document.removeEventListener('pointerdown', handlePointerDown, true);
    }, [hideToolbar]);

    /** Position the toolbar at the last pointerup if recent, otherwise the selection rect. */
    const computeToolbarPosition = useCallback(
      (selection: TextSelection, targetIframe: HTMLIFrameElement | null) => {
        const iframeRect = targetIframe?.getBoundingClientRect();
        const lastPointerUp = iframeSelection.getLastPointerUp(targetIframe);
        if (lastPointerUp && Date.now() - lastPointerUp.timestamp < POINTER_UP_WINDOW_MS) {
          return { x: lastPointerUp.x, y: lastPointerUp.y };
        }
        const rect = selection.boundingClientRect || selection.range.getBoundingClientRect();
        return {
          x: (iframeRect?.left || 0) + rect.left + rect.width / 2,
          y: (iframeRect?.top || 0) + rect.top - 10,
        };
      },
      [iframeSelection]
    );

    const handleTextSelected = useCallback(
      (selection: TextSelection) => {
        interactions.hideContextMenu();

        if (!isValidSelection(selection)) {
          hideToolbar();
          return;
        }

        pendingSelectionRef.current = selection;
        iframeSelection.setActive(true);

        const targetIframe = getIframeForSelection(selection);
        if (targetIframe) activeIframeRef.current = targetIframe;

        interactions.showToolbar(computeToolbarPosition(selection, targetIframe), selection);
      },
      [
        computeToolbarPosition,
        getIframeForSelection,
        hideToolbar,
        iframeSelection,
        interactions,
        isValidSelection,
      ]
    );

    const restoreForIframe = useCallback(
      async (iframe: HTMLIFrameElement, href: string, readingOrderPosition?: number) => {
        iframeSelection.register(iframe);
        loadedFramesRef.current.set(normalizeHref(href), { iframe, readingOrderPosition });
        await restoreHighlights(iframe, href, readingOrderPosition);
      },
      [iframeSelection, restoreHighlights]
    );

    React.useImperativeHandle(ref, () => ({ handleTextSelected, restoreForIframe }));

    /** Shared helper: create a highlight from the pending selection. */
    const persistPendingSelection = useCallback(
      async (color: HighlightColor): Promise<Highlight | null> => {
        const selection = pendingSelectionRef.current;
        if (!selection) return null;

        const highlight = await createHighlight(selection, color);
        const targetIframe = getIframeForSelection(selection);
        if (highlight && targetIframe) {
          activeIframeRef.current = targetIframe;
          renderHighlight(highlight, targetIframe);
        }
        return highlight;
      },
      [createHighlight, getIframeForSelection, renderHighlight]
    );

    const handleColorSelect = useCallback(
      async (color: HighlightColor) => {
        await persistPendingSelection(color);
        hideToolbar();
      },
      [hideToolbar, persistPendingSelection]
    );

    const handleAddNoteFromToolbar = useCallback(async () => {
      const highlight = await persistPendingSelection(activeColor);
      if (highlight) dispatch(openNoteEditor(highlight.id));
      hideToolbar();
    }, [activeColor, dispatch, hideToolbar, persistPendingSelection]);

    const handleAiQuery = useCallback(
      (action: AiAction) => {
        const selection = pendingSelectionRef.current;
        if (!selection) return;
        interactions.showAiPanel(selection.text, action);
        hideToolbar();
      },
      [hideToolbar, interactions]
    );

    /** Resolve the iframe used by context-menu-driven actions. */
    const getActionIframe = useCallback(
      () => activeIframeRef.current || iframeRef?.current || null,
      [iframeRef]
    );

    const handleColorChangeFromMenu = useCallback(
      (color: HighlightColor) => {
        const target = interactions.contextMenu.highlight;
        const targetIframe = getActionIframe();
        if (!target || !targetIframe) return;
        updateHighlightInDOM({ ...target, color }, targetIframe);
      },
      [getActionIframe, interactions.contextMenu.highlight, updateHighlightInDOM]
    );

    const handleDeleteFromMenu = useCallback(() => {
      const target = interactions.contextMenu.highlight;
      const targetIframe = getActionIframe();
      if (!target || !targetIframe) return;
      removeHighlight(target.id, targetIframe);
    }, [getActionIframe, interactions.contextMenu.highlight, removeHighlight]);

    const handleHighlightUpdated = useCallback(
      (highlight: Highlight) => {
        const targetIframe = getActionIframe();
        if (!targetIframe) return;
        updateHighlightInDOM(highlight, targetIframe);
        interactions.patchContextMenu(highlight);
      },
      [getActionIframe, interactions, updateHighlightInDOM]
    );

    const handleChooseOverlap = useCallback(
      (highlight: Highlight) => {
        const targetIframe = getActionIframe();
        const doc = targetIframe?.contentDocument;
        if (doc) selectRenderedHighlight(highlight.id, doc);
        dispatch(setSelectedHighlight(highlight.id));
        interactions.showContextMenu(interactions.overlap.position, highlight);
      },
      [dispatch, getActionIframe, interactions, selectRenderedHighlight]
    );

    return (
      <>
        {interactions.toolbar.visible && (
          <HighlightToolbar
            position={interactions.toolbar.position}
            onColorSelect={handleColorSelect}
            onAddNote={handleAddNoteFromToolbar}
            onAiQuery={handleAiQuery}
            onClose={hideToolbar}
          />
        )}

        {interactions.overlap.visible && interactions.overlap.highlights.length > 1 && (
          <OverlapChooser
            highlights={interactions.overlap.highlights}
            position={interactions.overlap.position}
            onChoose={handleChooseOverlap}
          />
        )}

        {interactions.contextMenu.visible && interactions.contextMenu.highlight && (
          <HighlightContextMenu
            highlight={interactions.contextMenu.highlight}
            position={interactions.contextMenu.position}
            onColorChange={handleColorChangeFromMenu}
            onDelete={handleDeleteFromMenu}
            onClose={interactions.hideContextMenu}
          />
        )}

        <HighlightNote onHighlightUpdated={handleHighlightUpdated} />

        {interactions.aiPanel.visible && (
          <AiChatPanel
            selectedText={interactions.aiPanel.selectedText}
            initialAction={interactions.aiPanel.initialAction}
            bookId={bookId}
            bookTitle={bookTitle}
            bookAuthor={bookAuthor}
            chapter={currentChapter}
            progress={readingProgress}
            onClose={interactions.hideAiPanel}
          />
        )}
      </>
    );
  }
);

// Re-exported alongside HighlightManagerHandle for the EPUB bridge.
export type TextSelectedHandler = (selection: TextSelection) => void;
