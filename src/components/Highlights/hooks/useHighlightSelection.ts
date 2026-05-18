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
import { createBookAwareHighlight } from '@/services/bookAwareApi';
import {
  bookAwareSyncErrorMessage,
  finalizeCreatedBookAwareHighlight,
  isBookAwareBookId,
  markBookAwareSyncFailed,
} from '@/components/Highlights/helpers/bookAwareHighlightSync';

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
        const highlight = await highlightService.create({ bookId, selection, color, note });
        if (!highlight) return null;

        // Mark book-aware sync as pending before starting the backend upload so
        // note/color edits can be reconciled when backendId arrives.
        const shouldSyncBookAware = isBookAwareBookId(bookId);
        const highlightWithSync = shouldSyncBookAware
          ? { ...highlight, koreader: { status: 'pending' as const } }
          : highlight;

        if (shouldSyncBookAware) {
          await highlightService.update(highlight.id, { koreader: { status: 'pending' } });
        }
        dispatch(addHighlight(highlightWithSync));

        if (highlightWithSync.koreader) {
          void createBookAwareHighlight(bookId, {
            exact: highlight.locator.text.highlight,
            prefix: highlight.locator.text.before,
            suffix: highlight.locator.text.after,
            href: highlight.locator.href,
            total_progression: highlight.locator.locations.totalProgression,
            chapter,
            color: highlight.color,
            note: highlight.note,
          }).then((result) => finalizeCreatedBookAwareHighlight({
            localHighlightId: highlight.id,
            bookId,
            created: result,
            creationSnapshot: { color: highlight.color, note: highlight.note },
            dispatch,
          })).catch(async (err: unknown) => {
            try {
              await markBookAwareSyncFailed(highlight.id, err, dispatch);
            } catch (markErr) {
              dispatch(setError(`book-aware highlight sync failed: ${bookAwareSyncErrorMessage(markErr)}`));
              console.error('[book-aware] failed to persist sync failure:', markErr);
            }
            console.error('[book-aware] highlight sync failed:', bookAwareSyncErrorMessage(err));
          });
        }

        return highlightWithSync;
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
