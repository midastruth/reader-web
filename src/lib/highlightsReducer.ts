/**
 * Redux reducer for text highlights and annotations
 * Manages highlight state and synchronizes with IndexedDB
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Highlight } from './types/highlights';
import { HighlightColor } from './types/highlights';
import { sortHighlightsByReadingOrder } from '@/core/Highlights/highlightSort';

/**
 * Highlights state interface
 */
export interface HighlightsState {
  /** Highlights for the currently open book */
  currentBookHighlights: Highlight[];
  /** Currently selected highlight ID (for editing/context menu) */
  selectedHighlightId: string | null;
  /** Active color for new highlights */
  activeColor: HighlightColor;
  /** Whether the note editor modal is open */
  isNoteEditorOpen: boolean;
  /** ID of highlight being edited in note editor */
  editingNoteId: string | null;
  /** Whether the highlights list panel is visible */
  isListVisible: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Current book ID */
  currentBookId: string | null;
}

/**
 * Initial state
 */
const initialState: HighlightsState = {
  currentBookHighlights: [],
  selectedHighlightId: null,
  activeColor: HighlightColor.YELLOW,
  isNoteEditorOpen: false,
  editingNoteId: null,
  isListVisible: false,
  isLoading: false,
  error: null,
  currentBookId: null,
};

/**
 * Highlights slice
 */
const highlightsSlice = createSlice({
  name: 'highlights',
  initialState,
  reducers: {
    /**
     * Set the current book ID
     */
    setCurrentBook(state, action: PayloadAction<string | null>) {
      state.currentBookId = action.payload;
      if (!action.payload) {
        state.currentBookHighlights = [];
      }
    },

    /**
     * Load highlights for the current book
     */
    loadHighlights(state, action: PayloadAction<Highlight[]>) {
      state.currentBookHighlights = sortHighlightsByReadingOrder(action.payload);
      state.isLoading = false;
      state.error = null;
    },

    /**
     * Add a new highlight
     */
    addHighlight(state, action: PayloadAction<Highlight>) {
      state.currentBookHighlights.push(action.payload);
      state.currentBookHighlights = sortHighlightsByReadingOrder(state.currentBookHighlights);
    },

    /**
     * Update an existing highlight
     */
    updateHighlight(
      state,
      action: PayloadAction<{ id: string; updates: Partial<Highlight> }>
    ) {
      const index = state.currentBookHighlights.findIndex(
        h => h.id === action.payload.id
      );
      if (index !== -1) {
        state.currentBookHighlights[index] = {
          ...state.currentBookHighlights[index],
          ...action.payload.updates,
          updatedAt: action.payload.updates.updatedAt ?? Date.now(),
        };
        state.currentBookHighlights = sortHighlightsByReadingOrder(state.currentBookHighlights);
      }
    },

    /**
     * Delete a highlight
     */
    deleteHighlight(state, action: PayloadAction<string>) {
      state.currentBookHighlights = state.currentBookHighlights.filter(
        h => h.id !== action.payload
      );
      if (state.selectedHighlightId === action.payload) {
        state.selectedHighlightId = null;
      }
      if (state.editingNoteId === action.payload) {
        state.editingNoteId = null;
        state.isNoteEditorOpen = false;
      }
    },

    /**
     * Set the selected highlight
     */
    setSelectedHighlight(state, action: PayloadAction<string | null>) {
      state.selectedHighlightId = action.payload;
    },

    /**
     * Set the active color for new highlights
     */
    setActiveColor(state, action: PayloadAction<HighlightColor>) {
      state.activeColor = action.payload;
    },

    /**
     * Open the note editor
     */
    openNoteEditor(state, action: PayloadAction<string>) {
      state.isNoteEditorOpen = true;
      state.editingNoteId = action.payload;
    },

    /**
     * Close the note editor
     */
    closeNoteEditor(state) {
      state.isNoteEditorOpen = false;
      state.editingNoteId = null;
    },

    /**
     * Toggle the highlights list panel
     */
    toggleHighlightsList(state) {
      state.isListVisible = !state.isListVisible;
    },

    /**
     * Set highlights list visibility
     */
    setHighlightsListVisible(state, action: PayloadAction<boolean>) {
      state.isListVisible = action.payload;
    },

    /**
     * Set loading state
     */
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    /**
     * Set error state
     */
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Clear all highlights (for current book)
     */
    clearHighlights(state) {
      state.currentBookHighlights = [];
      state.selectedHighlightId = null;
      state.editingNoteId = null;
      state.isNoteEditorOpen = false;
    },

    /**
     * Reset state
     */
    resetHighlightsState(state) {
      Object.assign(state, initialState);
    },
  },
});

// Export actions
export const {
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
  setLoading,
  setError,
  clearHighlights,
  resetHighlightsState,
} = highlightsSlice.actions;

// Export reducer
export default highlightsSlice.reducer;
