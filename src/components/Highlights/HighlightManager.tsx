/**
 * Main highlight manager component
 * Coordinates all highlight functionality
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { HighlightColor, type Highlight } from '@/lib/types/highlights';
import { loadHighlights, openNoteEditor, setCurrentBook, setSelectedHighlight } from '@/lib/highlightsReducer';
import { highlightService, resolveHitHighlights } from '@/core/Highlights';
import { useHighlightSelection, type TextSelection } from './hooks/useHighlightSelection';
import { useHighlightRenderer, type HighlightClickPayload } from './hooks/useHighlightRenderer';
import { HighlightToolbar } from './HighlightToolbar';
import { HighlightContextMenu } from './HighlightContextMenu';
import { HighlightNote } from './HighlightNote';
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

  restoreForIframe: (iframe: HTMLIFrameElement, href: string) => Promise<void>;

}


export const HighlightManager = React.forwardRef<HighlightManagerHandle, HighlightManagerProps>(({ bookId, bookTitle, bookAuthor, currentChapter, readingProgress, iframeRef }, ref) => {
  const dispatch = useDispatch();

  // Redux state
  const highlights = useSelector((state: RootState) => state.highlights.currentBookHighlights);
  const selectedHighlightId = useSelector((state: RootState) => state.highlights.selectedHighlightId);
  const activeColor = useSelector((state: RootState) => state.highlights.activeColor);

  // Local state
  const [toolbarState, setToolbarState] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    selection: TextSelection | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    selection: null,
  });

  const [contextMenuState, setContextMenuState] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    highlight: Highlight | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    highlight: null,
  });

  const [chooseMenuState, setChooseMenuState] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    highlights: Highlight[];
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    highlights: [],
  });

  const [aiPanelState, setAiPanelState] = useState<{
    visible: boolean;
    selectedText: string;
    initialAction: AiAction;
  }>({ visible: false, selectedText: '', initialAction: 'ask' });

  const pendingSelectionRef = useRef<TextSelection | null>(null);

  // Keep track of the last iframe the user interacted with.
  // (Important when FXL spreads have multiple iframes.)
  const activeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeSelectionCleanupRef = useRef(new Map<HTMLIFrameElement, () => void>());
  const lastPointerUpPositionRef = useRef(
    new Map<HTMLIFrameElement, { x: number; y: number; timestamp: number }>()
  );

  /**
   * Hide toolbars/menus
   */
  const hideToolbar = useCallback(() => {
    setToolbarState({ visible: false, position: { x: 0, y: 0 }, selection: null });
    pendingSelectionRef.current = null;
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenuState({ visible: false, position: { x: 0, y: 0 }, highlight: null });
    setChooseMenuState({ visible: false, position: { x: 0, y: 0 }, highlights: [] });
  }, []);

  const hideAiPanel = useCallback(() => {
    setAiPanelState({ visible: false, selectedText: '', initialAction: 'ask' });
  }, []);

  const handleAiQuery = useCallback((action: AiAction) => {
    const selection = pendingSelectionRef.current;
    if (!selection) return;
    setAiPanelState({ visible: true, selectedText: selection.text, initialAction: action });
    hideToolbar();
  }, [hideToolbar]);

  /**
   * Show context menu when highlight is clicked
   */
  const showContextMenu = useCallback((highlightId: string, position: { x: number; y: number }) => {
    const highlight = highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    // Avoid overlapping UI
    hideToolbar();
    setChooseMenuState({ visible: false, position: { x: 0, y: 0 }, highlights: [] });

    setContextMenuState({
      visible: true,
      position,
      highlight,
    });
  }, [highlights, hideToolbar]);

  const handleHighlightClick = useCallback(({ highlightId, highlightIds, position, iframe }: HighlightClickPayload) => {
    activeIframeRef.current = iframe;

    const hitHighlights = resolveHitHighlights(highlightIds, highlights);
    if (hitHighlights.length > 1) {
      hideToolbar();
      setContextMenuState({ visible: false, position: { x: 0, y: 0 }, highlight: null });
      setChooseMenuState({ visible: true, position, highlights: hitHighlights });
      return;
    }

    showContextMenu(hitHighlights[0]?.id ?? highlightId, position);
  }, [highlights, hideToolbar, showContextMenu]);

  const getIframeForSelection = useCallback((selection: TextSelection | null) => {
    const iframeFromSelection =
      selection?.range.startContainer.ownerDocument?.defaultView?.frameElement as HTMLIFrameElement | null;

    return iframeFromSelection || activeIframeRef.current || iframeRef?.current || null;
  }, [iframeRef]);

  const setupIframeSelectionDismissal = useCallback((iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return;

    iframeSelectionCleanupRef.current.get(iframe)?.();

    const scheduleSelectionCheck = () => {
      if (!pendingSelectionRef.current) return;

      win.requestAnimationFrame(() => {
        const selection = win.getSelection();
        const hasActiveSelection = !!selection &&
          selection.rangeCount > 0 &&
          !selection.isCollapsed &&
          selection.toString().trim().length > 0;

        if (!hasActiveSelection) {
          hideToolbar();
        }
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const iframeRect = iframe.getBoundingClientRect();

      lastPointerUpPositionRef.current.set(iframe, {
        x: iframeRect.left + event.clientX,
        y: iframeRect.top + event.clientY,
        timestamp: Date.now(),
      });

      scheduleSelectionCheck();
    };

    const handleKeyUp = () => {
      scheduleSelectionCheck();
    };

    doc.addEventListener('pointerup', handlePointerUp);
    doc.addEventListener('keyup', handleKeyUp);

    iframeSelectionCleanupRef.current.set(iframe, () => {
      doc.removeEventListener('pointerup', handlePointerUp);
      doc.removeEventListener('keyup', handleKeyUp);
      lastPointerUpPositionRef.current.delete(iframe);
    });
  }, [hideToolbar]);

  // Hooks
  const { createHighlight, isValidSelection } = useHighlightSelection(bookId);
  const {
    restoreHighlights,
    renderHighlight,
    removeHighlight,
    updateHighlight: updateHighlightInDOM,
    handleHighlightClick: selectRenderedHighlight,
  } = useHighlightRenderer(bookId, {
    onHighlightClick: handleHighlightClick,
  });

  /**
   * Load highlights from database when book changes
   */
  useEffect(() => {
    const loadBookHighlights = async () => {
      try {
        dispatch(setCurrentBook(bookId));
        const bookHighlights = await highlightService.loadBook(bookId);
        dispatch(loadHighlights(bookHighlights));
      } catch (error) {
        console.error('Failed to load highlights:', error);
      }
    };

    loadBookHighlights();
  }, [bookId, dispatch]);

  useEffect(() => {
    const cleanupMap = iframeSelectionCleanupRef.current;
    const pointerMap = lastPointerUpPositionRef.current;

    return () => {
      for (const cleanup of cleanupMap.values()) {
        cleanup();
      }
      cleanupMap.clear();
      pointerMap.clear();
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!pendingSelectionRef.current) return;

      const target = event.target;

      if (!(target instanceof Element)) {
        hideToolbar();
        return;
      }

      if (!target.closest('.highlight-toolbar')) {
        hideToolbar();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [hideToolbar]);

  /**
   * Show highlight toolbar when text is selected
   */
  const handleTextSelected = useCallback((selection: TextSelection) => {
    hideContextMenu();

    if (!isValidSelection(selection)) {
      hideToolbar();
      return;
    }


    pendingSelectionRef.current = selection;

    const targetIframe = getIframeForSelection(selection);
    const iframeRect = targetIframe?.getBoundingClientRect();
    const lastPointerUp = targetIframe ? lastPointerUpPositionRef.current.get(targetIframe) : null;
    const rect = selection.boundingClientRect || selection.range.getBoundingClientRect();
    const shouldUsePointerUpPosition = !!lastPointerUp && Date.now() - lastPointerUp.timestamp < 1000;
    const position = shouldUsePointerUpPosition
      ? {
          x: lastPointerUp.x,
          y: lastPointerUp.y,
        }
      : {
          x: (iframeRect?.left || 0) + rect.left + rect.width / 2,
          y: (iframeRect?.top || 0) + rect.top - 10,
        };

    if (targetIframe) {
      activeIframeRef.current = targetIframe;
    }

    setToolbarState({
      visible: true,
      position,
      selection,
    });
  }, [getIframeForSelection, hideContextMenu, hideToolbar, isValidSelection]);

  const restoreForIframe = useCallback(async (iframe: HTMLIFrameElement, href: string) => {
    setupIframeSelectionDismissal(iframe);

    await restoreHighlights(iframe, href);

  }, [restoreHighlights, setupIframeSelectionDismissal]);



  // Expose methods to parent

  React.useImperativeHandle(ref, () => ({

    handleTextSelected,

    restoreForIframe,

  }));


  /**
   * Handle color selection from toolbar
   */
  const handleColorSelect = useCallback(async (color: HighlightColor) => {
    const selection = pendingSelectionRef.current;
    if (!selection) return;

    const highlight = await createHighlight(selection, color);
    const targetIframe = getIframeForSelection(selection);



    if (highlight && targetIframe) {

      activeIframeRef.current = targetIframe;

      renderHighlight(highlight, targetIframe);

    }


    // Hide toolbar
    hideToolbar();
  }, [createHighlight, getIframeForSelection, renderHighlight, hideToolbar]);

  /**
   * Handle "Add Note" from toolbar
   */
  const handleAddNoteFromToolbar = useCallback(async () => {
    const selection = pendingSelectionRef.current;
    if (!selection) return;

    // Create highlight with default color first
    const highlight = await createHighlight(selection, activeColor);
    const targetIframe = getIframeForSelection(selection);



    if (highlight && targetIframe) {

      activeIframeRef.current = targetIframe;

      renderHighlight(highlight, targetIframe);

      dispatch(openNoteEditor(highlight.id));

    }


    // Hide toolbar
    hideToolbar();
  }, [createHighlight, activeColor, getIframeForSelection, renderHighlight, dispatch, hideToolbar]);

  /**
   * Handle color change from context menu
   */
  const handleColorChangeFromMenu = useCallback((color: HighlightColor) => {
    if (!contextMenuState.highlight) return;

    const targetIframe = activeIframeRef.current || iframeRef?.current || null;

    if (!targetIframe) return;

    const updatedHighlight = {
      ...contextMenuState.highlight,
      color,
    };

    updateHighlightInDOM(updatedHighlight, targetIframe);
  }, [contextMenuState.highlight, iframeRef, updateHighlightInDOM]);

  /**
   * Handle highlight deletion from context menu
   */
  const handleDeleteFromMenu = useCallback(() => {
    if (!contextMenuState.highlight) return;

    const targetIframe = activeIframeRef.current || iframeRef?.current || null;

    if (!targetIframe) return;

    removeHighlight(contextMenuState.highlight.id, targetIframe);
  }, [contextMenuState.highlight, iframeRef, removeHighlight]);

  const handleHighlightUpdated = useCallback((highlight: Highlight) => {
    const targetIframe = activeIframeRef.current || iframeRef?.current || null;

    if (!targetIframe) return;

    updateHighlightInDOM(highlight, targetIframe);

    setContextMenuState((currentState) => {
      if (!currentState.highlight || currentState.highlight.id !== highlight.id) {
        return currentState;
      }

      return {
        ...currentState,
        highlight,
      };
    });
  }, [iframeRef, updateHighlightInDOM]);

  const handleChooseHighlight = useCallback((highlight: Highlight) => {
    const targetIframe = activeIframeRef.current || iframeRef?.current || null;
    const doc = targetIframe?.contentDocument;
    if (doc) selectRenderedHighlight(highlight.id, doc);
    dispatch(setSelectedHighlight(highlight.id));

    setChooseMenuState({ visible: false, position: { x: 0, y: 0 }, highlights: [] });
    setContextMenuState({
      visible: true,
      position: chooseMenuState.position,
      highlight,
    });
  }, [chooseMenuState.position, dispatch, iframeRef, selectRenderedHighlight]);

  // Highlight restoration is triggered by the reader when frames are loaded.


  return (
    <>
      {/* Highlight Toolbar */}
      {toolbarState.visible && (
        <HighlightToolbar
          position={toolbarState.position}
          onColorSelect={handleColorSelect}
          onAddNote={handleAddNoteFromToolbar}
          onAiQuery={handleAiQuery}
          onClose={hideToolbar}
        />
      )}

      {/* Overlapping highlights chooser */}
      {chooseMenuState.visible && chooseMenuState.highlights.length > 1 && (
        <div
          className="highlight-overlap-menu"
          style={{
            position: 'absolute',
            left: chooseMenuState.position.x,
            top: chooseMenuState.position.y,
            zIndex: 10000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="highlight-overlap-menu-content">
            <div className="highlight-overlap-menu-label">选择高亮</div>
            {chooseMenuState.highlights.map((highlight) => (
              <button
                key={highlight.id}
                className="highlight-overlap-menu-item"
                onClick={() => handleChooseHighlight(highlight)}
              >
                <span className={`highlight-overlap-menu-color highlight-${highlight.color}`} />
                <span className="highlight-overlap-menu-text">
                  {highlight.locator.text.highlight.slice(0, 80)}
                  {highlight.locator.text.highlight.length > 80 ? '…' : ''}
                </span>
              </button>
            ))}
          </div>
          <style jsx>{`
            .highlight-overlap-menu-content {
              width: 260px;
              max-height: 320px;
              overflow: auto;
              padding: 8px;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              background: #fff;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .highlight-overlap-menu-label {
              padding: 6px 8px 8px;
              font-size: 12px;
              font-weight: 600;
              color: #666;
              text-transform: uppercase;
            }
            .highlight-overlap-menu-item {
              width: 100%;
              display: flex;
              gap: 8px;
              align-items: flex-start;
              border: 0;
              border-radius: 6px;
              background: transparent;
              padding: 8px;
              cursor: pointer;
              text-align: left;
            }
            .highlight-overlap-menu-item:hover { background: #f5f5f5; }
            .highlight-overlap-menu-color {
              flex: 0 0 12px;
              width: 12px;
              height: 12px;
              margin-top: 3px;
              border-radius: 999px;
            }
            .highlight-overlap-menu-text {
              font-size: 13px;
              line-height: 1.35;
              color: #222;
            }
            .highlight-yellow { background: rgba(255, 235, 0, 0.65); }
            .highlight-green { background: rgba(165, 214, 167, 0.65); }
            .highlight-blue { background: rgba(144, 202, 249, 0.65); }
            .highlight-pink { background: rgba(244, 143, 177, 0.65); }
            .highlight-orange { background: rgba(255, 204, 128, 0.65); }
            .highlight-purple { background: rgba(206, 147, 216, 0.65); }
          `}</style>
        </div>
      )}

      {/* Context Menu */}
      {contextMenuState.visible && contextMenuState.highlight && (
        <HighlightContextMenu
          highlight={contextMenuState.highlight}
          position={contextMenuState.position}
          onColorChange={handleColorChangeFromMenu}
          onDelete={handleDeleteFromMenu}
          onClose={hideContextMenu}
        />
      )}

      {/* Note Editor */}
      <HighlightNote onHighlightUpdated={handleHighlightUpdated} />

      {/* AI Chat Panel */}
      {aiPanelState.visible && (
        <AiChatPanel
          selectedText={aiPanelState.selectedText}
          initialAction={aiPanelState.initialAction}
          bookId={bookId}
          bookTitle={bookTitle}
          bookAuthor={bookAuthor}
          chapter={currentChapter}
          progress={readingProgress}
          onClose={hideAiPanel}
        />
      )}
    </>
  );
});



HighlightManager.displayName = 'HighlightManager';



// Export the handler for use in StatefulReader

export type TextSelectedHandler = (selection: TextSelection) => void;
