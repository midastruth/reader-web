/**
 * Hook for handling text selection and highlight creation
 * Integrates with Readium Navigator's textSelected callback
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import type { Highlight, HighlightColor } from '@/lib/types/highlights';
import { addHighlight } from '@/lib/highlightsReducer';
import HighlightsDB from '@/core/Storage/HighlightsDB';
import {
  rangeToLocator,
  serializeRange,
  isValidTextRange,
  normalizeRange,
} from '../helpers/rangeToLocator';

/**
 * Text selection data from Readium Navigator
 */
export interface TextSelection {
  range: Range;
  text: string;
  href: string;
  position?: number;
  cleanText?: string;
  rawText?: string;
  boundingClientRect?: DOMRect;
}

/**
 * Hook return type
 */
export interface UseHighlightSelectionReturn {
  createHighlight: (selection: TextSelection, color: HighlightColor, note?: string) => Promise<Highlight | null>;
  isValidSelection: (selection: TextSelection) => boolean;
}

/**
 * Hook for handling text selection and creating highlights
 */
export function useHighlightSelection(bookId: string): UseHighlightSelectionReturn {
  const dispatch = useDispatch();

  /**
   * Validate a text selection
   */
  const isValidSelection = useCallback((selection: TextSelection): boolean => {
    if (!selection || !selection.range) {
      return false;
    }

    return isValidTextRange(selection.range);
  }, []);

  /**
   * Create a new highlight from a text selection
   */
  const createHighlight = useCallback(
    async (
      selection: TextSelection,
      color: HighlightColor,
      note?: string
    ): Promise<Highlight | null> => {
      try {
        // Validate selection
        if (!isValidSelection(selection)) {
          console.warn('Invalid text selection');
          return null;
        }

        // Normalize the range to ensure it starts and ends at text nodes
        const normalizedRange = normalizeRange(selection.range);

        // Create the highlight object
        const highlight: Highlight = {
          id: uuidv4(),
          bookId,
          color,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          note,
          locator: rangeToLocator(normalizedRange, selection.href, selection.position),
          range: serializeRange(normalizedRange),
        };

        // Save to IndexedDB
        await HighlightsDB.addHighlight(highlight);

        // Update Redux state
        dispatch(addHighlight(highlight));

        console.log('Highlight created:', highlight.id);
        return highlight;
      } catch (error) {
        console.error('Failed to create highlight:', error);
        return null;
      }
    },
    [bookId, dispatch, isValidSelection]
  );

  return {
    createHighlight,
    isValidSelection,
  };
}
