const PREFIX = "bookaware.highlight.cursor.";

function key(bookId: string): string {
  return `${PREFIX}${bookId}`;
}

export function readHighlightSyncCursor(bookId: string): number {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(key(bookId)) ?? "0");
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
}

export function saveHighlightSyncCursor(bookId: string, serverVersion: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(serverVersion) || serverVersion < 0) return;
  window.localStorage.setItem(key(bookId), String(Math.trunc(serverVersion)));
}

export function clearHighlightSyncCursor(bookId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(bookId));
}
