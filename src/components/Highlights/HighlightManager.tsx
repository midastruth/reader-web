/**
 * Main highlight manager component
 * Coordinates all highlight functionality
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { HighlightColor, type Highlight } from '@/lib/types/highlights';
import { loadHighlights, setCurrentBook } from '@/lib/highlightsReducer';
import HighlightsDB from '@/core/Storage/HighlightsDB';
import { useHighlightSelection, type TextSelection } from './hooks/useHighlightSelection';
import { useHighlightRenderer } from './hooks/useHighlightRenderer';
import { HighlightToolbar } from './HighlightToolbar';
import { HighlightContextMenu } from './HighlightContextMenu';
import { HighlightNote } from './HighlightNote';

export interface HighlightManagerProps {
  /** Book/publication ID */
  bookId: string;
  /** Book title (optional, for display) */
  bookTitle?: string;
  /** Reference to the reader iframe */
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

export interface HighlightManagerHandle {

  handleTextSelected: (selection: TextSelection) => void;

  restoreForIframe: (iframe: HTMLIFrameElement, href: string) => Promise<void>;

}


export const HighlightManager = React.forwardRef<HighlightManagerHandle, HighlightManagerProps>(({ bookId, bookTitle, iframeRef }, ref) => {
  const dispatch = useDispatch();

  // Hooks
  const { createHighlight, isValidSelection } = useHighlightSelection(bookId);
  const {
    restoreHighlights,
    renderHighlight,
    removeHighlight,
    updateHighlight: updateHighlightInDOM,
  } = useHighlightRenderer(bookId);

  // State
  const highlights = useSelector((state: RootState) => state.highlights.currentBookHighlights);
  const selectedHighlightId = useSelector((state: RootState) => state.highlights.selectedHighlightId);
  const activeColor = useSelector((state: RootState) => state.highlights.activeColor);

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

  const pendingSelectionRef = useRef<TextSelection | null>(null);

  /**
   * Load highlights from database when book changes
   */
  useEffect(() => {
    const loadBookHighlights = async () => {
      try {
        dispatch(setCurrentBook(bookId));
        const bookHighlights = await HighlightsDB.getHighlightsByBook(bookId);
        dispatch(loadHighlights(bookHighlights));
      } catch (error) {
        console.error('Failed to load highlights:', error);
      }
    };

    loadBookHighlights();
  }, [bookId, dispatch]);

  /**
   * Show highlight toolbar when text is selected
   */
  const handleTextSelected = useCallback((selection: TextSelection) => {
    if (!isValidSelection(selection)) {
      setToolbarState({ visible: false, position: { x: 0, y: 0 }, selection: null });
      return;
    }


    pendingSelectionRef.current = selection;

    // Calculate toolbar position
    const rect = selection.boundingClientRect || selection.range.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10, // Above the selection
    };

    setToolbarState({
      visible: true,
      position,
      selection,
    });
  }, [isValidSelection]);

  const restoreForIframe = useCallback(async (iframe: HTMLIFrameElement, href: string) => {

    await restoreHighlights(iframe, href);

  }, [restoreHighlights]);



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

    const iframeFromSelection = selection.range.startContainer.ownerDocument?.defaultView?.frameElement as HTMLIFrameElement | null;

    const targetIframe = iframeFromSelection || iframeRef?.current || null;



    if (highlight && targetIframe) {

      renderHighlight(highlight, targetIframe);

    }


    // Hide toolbar
    setToolbarState({ visible: false, position: { x: 0, y: 0 }, selection: null });
    pendingSelectionRef.current = null;
  }, [createHighlight, iframeRef, renderHighlight]);

  /**
   * Handle "Add Note" from toolbar
   */
  const handleAddNoteFromToolbar = useCallback(async () => {
    const selection = pendingSelectionRef.current;
    if (!selection) return;

    // Create highlight with default color first
    const highlight = await createHighlight(selection, activeColor);

    const iframeFromSelection = selection.range.startContainer.ownerDocument?.defaultView?.frameElement as HTMLIFrameElement | null;

    const targetIframe = iframeFromSelection || iframeRef?.current || null;



    if (highlight && targetIframe) {

      renderHighlight(highlight, targetIframe);

      dispatch(require('@/lib/highlightsReducer').openNoteEditor(highlight.id));

    }


    // Hide toolbar
    setToolbarState({ visible: false, position: { x: 0, y: 0 }, selection: null });
    pendingSelectionRef.current = null;
  }, [createHighlight, activeColor, iframeRef, renderHighlight, dispatch]);

  /**
   * Show context menu when highlight is clicked
   */
  const showContextMenu = useCallback((highlightId: string, position: { x: number; y: number }) => {
    const highlight = highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    setContextMenuState({
      visible: true,
      position,
      highlight,
    });
  }, [highlights]);

  /**
   * Handle color change from context menu
   */
  const handleColorChangeFromMenu = useCallback((color: HighlightColor) => {
    if (!contextMenuState.highlight || !iframeRef?.current) return;

    const updatedHighlight = {
      ...contextMenuState.highlight,
      color,
    };

    updateHighlightInDOM(updatedHighlight, iframeRef.current);
  }, [contextMenuState.highlight, iframeRef, updateHighlightInDOM]);

  /**
   * Handle highlight deletion from context menu
   */
  const handleDeleteFromMenu = useCallback(() => {
    if (!contextMenuState.highlight || !iframeRef?.current) return;

    removeHighlight(contextMenuState.highlight.id, iframeRef.current);
  }, [contextMenuState.highlight, iframeRef, removeHighlight]);

  /**
   * Hide toolbars/menus
   */
  const hideToolbar = useCallback(() => {
    setToolbarState({ visible: false, position: { x: 0, y: 0 }, selection: null });
    pendingSelectionRef.current = null;
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenuState({ visible: false, position: { x: 0, y: 0 }, highlight: null });
  }, []);

  // Highlight restoration is triggered by the reader when frames are loaded.


  return (
    <>
      {/* Highlight Toolbar */}
      {toolbarState.visible && (
        <HighlightToolbar
          position={toolbarState.position}
          onColorSelect={handleColorSelect}
          onAddNote={handleAddNoteFromToolbar}
          onClose={hideToolbar}
        />
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
      <HighlightNote />
    </>
  );
});



HighlightManager.displayName = 'HighlightManager';



// Export the handler for use in StatefulReader

export type TextSelectedHandler = (selection: TextSelection) => void;

