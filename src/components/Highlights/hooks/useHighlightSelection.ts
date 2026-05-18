/**
 * Hook for handling text selection and highlight creation.
 *
 * UI-facing wrapper around the core HighlightService. Components dispatch Redux
 * updates here, but persistence and anchor creation live in core/Highlights.
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/lib/store';
import type { Highlight, HighlightColor } from '@/lib/types/highlights';
import { addHighlight, setError } from '@/lib/highlightsReducer';
import { HighlightAnchors, highlightService } from '@/core/Highlights';
import type { TextSelection } from '@/core/Highlights';

export type { TextSelection } from '@/core/Highlights';

/** Hook return type */
export interface UseHighlightSelectionReturn {
  createHighlight: (selection: TextSelection, color: HighlightColor, note?: string) => Promise<Highlight | null>;
  isValidSelection: (selection: TextSelection) => boolean;
}

/** Hook for handling text selection and creating highlights. */
export function useHighlightSelection(bookId: string, chapter?: string): UseHighlightSelectionReturn {
  const dispatch = useDispatch<AppDispatch>();

  const isValidSelection = useCallback((selection: TextSelection): boolean => {
    const valid = HighlightAnchors.isValidSelection(selection);
    if (!valid) console.warn('useHighlightSelection: invalid text selection', selection);
    return valid;
  }, []);

  const createHighlight = useCallback(
    async (selection: TextSelection, color: HighlightColor, note?: string): Promise<Highlight | null> => {
      try {
        const highlight = await highlightService.create({ bookId, selection, color, note, chapter });
        if (!highlight) return null;

        dispatch(addHighlight(highlight));
        return highlight;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        dispatch(setError(`Failed to create highlight: ${message}`));
        console.error('Failed to create highlight:', error);
        return null;
      }
    },
    [bookId, chapter, dispatch]
  );

  return { createHighlight, isValidSelection };
}
