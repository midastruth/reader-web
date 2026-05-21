import {
  createBookAwareHighlight,
  deleteBookAwareHighlight,
  fetchBookAwareHighlightChanges,
  fetchBookAwareHighlights,
  updateBookAwareHighlight,
  type CreateHighlightPayload,
  type UpdateHighlightPayload,
} from "@/services/bookAwareApi";

export class HighlightRemoteRepository {
  list(bookId: string) {
    return fetchBookAwareHighlights(bookId);
  }

  changes(bookId: string, sinceVersion: number) {
    return fetchBookAwareHighlightChanges(bookId, sinceVersion);
  }

  create(bookId: string, payload: CreateHighlightPayload) {
    return createBookAwareHighlight(bookId, payload);
  }

  update(bookId: string, highlightId: string, payload: UpdateHighlightPayload) {
    return updateBookAwareHighlight(bookId, highlightId, payload);
  }

  delete(bookId: string, highlightId: string) {
    return deleteBookAwareHighlight(bookId, highlightId);
  }
}

export const highlightRemoteRepository = new HighlightRemoteRepository();
