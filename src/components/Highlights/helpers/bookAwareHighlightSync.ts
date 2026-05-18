import { deleteBookAwareHighlight, updateBookAwareHighlight, type BookAwareHighlight, type UpdateHighlightPayload } from '@/services/bookAwareApi';
import { highlightService } from '@/core/Highlights';
import type { Highlight, KoreaderSyncState } from '@/lib/types/highlights';
import { setError, updateHighlight } from '@/lib/highlightsReducer';
import type { AppDispatch } from '@/lib/store';

const BOOK_AWARE_SHA_RE = /^[0-9a-f]{64}$/i;

export function isBookAwareBookId(bookId: string): boolean {
  return BOOK_AWARE_SHA_RE.test(bookId);
}

export function bookAwareSyncErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function normalizeKoreaderStatus(status: string | undefined): KoreaderSyncState['status'] {
  switch (status) {
    case 'pending':
    case 'resolved':
    case 'conflict':
    case 'failed':
      return status;
    default:
      throw new Error(`Unexpected book-aware koreader status: ${status ?? '<missing>'}`);
  }
}

function localKoreaderStateFromBackend(highlight: BookAwareHighlight): KoreaderSyncState {
  return {
    status: normalizeKoreaderStatus(highlight.koreader?.status),
    backendId: highlight.id,
    pos0: highlight.koreader?.pos0,
    pos1: highlight.koreader?.pos1,
    page: highlight.koreader?.page,
    error: highlight.koreader?.error,
  };
}

export async function markBookAwareSyncFailed(
  localHighlightId: string,
  err: unknown,
  dispatch: AppDispatch,
  backendId?: string,
): Promise<void> {
  const message = bookAwareSyncErrorMessage(err);
  const latest = await highlightService.get(localHighlightId);

  if (latest) {
    const koreader: KoreaderSyncState = {
      ...latest.koreader,
      status: 'failed',
      backendId: backendId ?? latest.koreader?.backendId,
      error: message,
    };
    const updated = await highlightService.update(localHighlightId, { koreader });
    dispatch(updateHighlight({ id: localHighlightId, updates: { koreader: updated.koreader } }));
  }

  dispatch(setError(`book-aware highlight sync failed: ${message}`));
}

export async function syncBookAwareHighlightUpdate(
  highlight: Highlight,
  payload: UpdateHighlightPayload,
  dispatch: AppDispatch,
): Promise<void> {
  if (!isBookAwareBookId(highlight.bookId)) return;

  const backendId = highlight.koreader?.backendId;
  if (!backendId) {
    // Creation is still pending. finalizeCreatedBookAwareHighlight() reads the
    // latest local highlight and reconciles note/color changes once backendId exists.
    return;
  }

  try {
    const synced = await updateBookAwareHighlight(highlight.bookId, backendId, payload);
    const koreader = localKoreaderStateFromBackend(synced);
    const updated = await highlightService.update(highlight.id, { koreader });
    dispatch(updateHighlight({ id: highlight.id, updates: { koreader: updated.koreader } }));
  } catch (err) {
    await markBookAwareSyncFailed(highlight.id, err, dispatch, backendId);
    throw new Error(`Failed to sync book-aware highlight update for ${highlight.id}: ${bookAwareSyncErrorMessage(err)}`);
  }
}

export async function deleteSyncedBookAwareHighlight(
  highlight: Highlight,
  dispatch: AppDispatch,
): Promise<void> {
  if (!isBookAwareBookId(highlight.bookId)) return;

  const backendId = highlight.koreader?.backendId;
  if (!backendId) {
    // Backend creation has not completed yet. If it later succeeds, the creation
    // finalizer observes that the local highlight was deleted and tombstones it.
    return;
  }

  try {
    await deleteBookAwareHighlight(highlight.bookId, backendId);
  } catch (err) {
    await markBookAwareSyncFailed(highlight.id, err, dispatch, backendId);
    throw new Error(`Failed to tombstone book-aware highlight ${highlight.id}: ${bookAwareSyncErrorMessage(err)}`);
  }
}

export async function finalizeCreatedBookAwareHighlight(
  params: {
    localHighlightId: string;
    bookId: string;
    created: BookAwareHighlight;
    creationSnapshot: Pick<Highlight, 'color' | 'note'>;
    dispatch: AppDispatch;
  },
): Promise<void> {
  const { localHighlightId, bookId, created, creationSnapshot, dispatch } = params;
  const latest = await highlightService.get(localHighlightId);

  if (!latest) {
    // User deleted the local highlight while POST /highlights was in flight.
    // Tombstone the just-created backend record immediately so KOReader does not
    // receive an orphaned annotation.
    try {
      await deleteBookAwareHighlight(bookId, created.id);
    } catch (err) {
      dispatch(setError(`book-aware highlight tombstone failed: ${bookAwareSyncErrorMessage(err)}`));
      throw new Error(`Failed to tombstone orphaned book-aware highlight ${created.id}: ${bookAwareSyncErrorMessage(err)}`);
    }
    return;
  }

  let koreader: KoreaderSyncState;
  try {
    koreader = localKoreaderStateFromBackend(created);
  } catch (err) {
    await markBookAwareSyncFailed(localHighlightId, err, dispatch, created.id);
    throw err;
  }

  const updatedWithBackendId = await highlightService.update(localHighlightId, { koreader });
  dispatch(updateHighlight({ id: localHighlightId, updates: { koreader: updatedWithBackendId.koreader } }));

  const patch: UpdateHighlightPayload = { updated_by: 'reader-web' };
  if ((latest.note ?? '') !== (creationSnapshot.note ?? '')) patch.note = latest.note ?? '';
  if (latest.color !== creationSnapshot.color) patch.color = latest.color;

  if (patch.note === undefined && patch.color === undefined) return;

  await syncBookAwareHighlightUpdate(
    { ...latest, koreader: updatedWithBackendId.koreader },
    patch,
    dispatch,
  );
}
