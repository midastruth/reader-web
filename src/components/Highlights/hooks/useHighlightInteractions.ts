/**
 * Tracks the four mutually-related popup UI states owned by HighlightManager:
 * the new-selection toolbar, the existing-highlight context menu, the
 * overlap chooser, and the AI side panel.
 *
 * Centralising them in one hook lets us enforce the invariant that at most
 * one popup is visible at a time without scattering setState calls across
 * many handlers.
 */

import { useCallback, useState } from 'react';
import type { Highlight } from '@/lib/types/highlights';
import type { TextSelection } from './useHighlightSelection';
import type { AiAction } from '@/components/AI/AiChatPanel';

export interface PopupPosition {
  x: number;
  y: number;
}

export interface ToolbarState {
  visible: boolean;
  position: PopupPosition;
  selection: TextSelection | null;
}

export interface ContextMenuState {
  visible: boolean;
  position: PopupPosition;
  highlight: Highlight | null;
}

export interface OverlapChooserState {
  visible: boolean;
  position: PopupPosition;
  highlights: Highlight[];
}

export interface AiPanelState {
  visible: boolean;
  selectedText: string;
  initialAction: AiAction;
}

const HIDDEN_POSITION: PopupPosition = { x: 0, y: 0 };

const initialToolbar: ToolbarState = {
  visible: false,
  position: HIDDEN_POSITION,
  selection: null,
};
const initialContextMenu: ContextMenuState = {
  visible: false,
  position: HIDDEN_POSITION,
  highlight: null,
};
const initialOverlap: OverlapChooserState = {
  visible: false,
  position: HIDDEN_POSITION,
  highlights: [],
};
const initialAi: AiPanelState = {
  visible: false,
  selectedText: '',
  initialAction: 'ask',
};

export interface UseHighlightInteractionsReturn {
  toolbar: ToolbarState;
  contextMenu: ContextMenuState;
  overlap: OverlapChooserState;
  aiPanel: AiPanelState;

  showToolbar: (position: PopupPosition, selection: TextSelection) => void;
  hideToolbar: () => void;

  showContextMenu: (position: PopupPosition, highlight: Highlight) => void;
  /** Update only the highlight on the currently-visible context menu (no-op otherwise). */
  patchContextMenu: (highlight: Highlight) => void;
  hideContextMenu: () => void;

  showOverlapChooser: (position: PopupPosition, highlights: Highlight[]) => void;
  hideOverlapChooser: () => void;

  showAiPanel: (selectedText: string, initialAction: AiAction) => void;
  hideAiPanel: () => void;

  /** Hide every popup. */
  hideAll: () => void;
}

export function useHighlightInteractions(): UseHighlightInteractionsReturn {
  const [toolbar, setToolbar] = useState<ToolbarState>(initialToolbar);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(initialContextMenu);
  const [overlap, setOverlap] = useState<OverlapChooserState>(initialOverlap);
  const [aiPanel, setAiPanel] = useState<AiPanelState>(initialAi);

  const hideToolbar = useCallback(() => setToolbar(initialToolbar), []);
  const hideContextMenu = useCallback(() => {
    setContextMenu(initialContextMenu);
    setOverlap(initialOverlap);
  }, []);
  const hideOverlapChooser = useCallback(() => setOverlap(initialOverlap), []);
  const hideAiPanel = useCallback(() => setAiPanel(initialAi), []);

  const showToolbar = useCallback(
    (position: PopupPosition, selection: TextSelection) => {
      setContextMenu(initialContextMenu);
      setOverlap(initialOverlap);
      setToolbar({ visible: true, position, selection });
    },
    []
  );

  const showContextMenu = useCallback(
    (position: PopupPosition, highlight: Highlight) => {
      setToolbar(initialToolbar);
      setOverlap(initialOverlap);
      setContextMenu({ visible: true, position, highlight });
    },
    []
  );

  const patchContextMenu = useCallback((highlight: Highlight) => {
    setContextMenu((state) => {
      if (!state.highlight || state.highlight.id !== highlight.id) return state;
      return { ...state, highlight };
    });
  }, []);

  const showOverlapChooser = useCallback(
    (position: PopupPosition, highlights: Highlight[]) => {
      setToolbar(initialToolbar);
      setContextMenu(initialContextMenu);
      setOverlap({ visible: true, position, highlights });
    },
    []
  );

  const showAiPanel = useCallback((selectedText: string, initialAction: AiAction) => {
    setAiPanel({ visible: true, selectedText, initialAction });
  }, []);

  const hideAll = useCallback(() => {
    setToolbar(initialToolbar);
    setContextMenu(initialContextMenu);
    setOverlap(initialOverlap);
    setAiPanel(initialAi);
  }, []);

  return {
    toolbar,
    contextMenu,
    overlap,
    aiPanel,
    showToolbar,
    hideToolbar,
    showContextMenu,
    patchContextMenu,
    hideContextMenu,
    showOverlapChooser,
    hideOverlapChooser,
    showAiPanel,
    hideAiPanel,
    hideAll,
  };
}
