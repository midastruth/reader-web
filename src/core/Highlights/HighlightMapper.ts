import { HighlightColor, normalizeHighlightColor, type Highlight, type HighlightLocator, type KoreaderSyncState, type SerializedRange } from "@/lib/types/highlights";
import type { BookAwareHighlight } from "@/services/bookAwareApi";
import { buildHighlightSortKey } from "./highlightSort";

function parseBackendTime(value: string | undefined): number {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function normalizeKoreaderStatus(status: string | undefined): KoreaderSyncState["status"] {
  switch (status) {
    case "pending":
    case "resolved":
    case "conflict":
    case "failed":
      return status;
    default:
      throw new Error(`Unexpected book-aware koreader status: ${status ?? "<missing>"}`);
  }
}

function locatorFromBackend(highlight: BookAwareHighlight): HighlightLocator {
  return {
    href: highlight.href ?? "",
    locations: {
      totalProgression: highlight.total_progression,
      position: highlight.spine_index,
    },
    text: {
      before: highlight.prefix || undefined,
      highlight: highlight.exact,
      after: highlight.suffix || undefined,
    },
  };
}

function emptyRange(): SerializedRange {
  return { type: "block-offset", parts: [] };
}

interface MapOptions {
  /** When true, the fallback's locator/range win over backend fields. Used for optimistic create. */
  preferClientLocator: boolean;
  fallback?: Highlight;
}

function buildHighlight(highlight: BookAwareHighlight, options: MapOptions): Highlight {
  const { preferClientLocator, fallback } = options;

  const locator: HighlightLocator = preferClientLocator && fallback
    ? fallback.locator
    : locatorFromBackend(highlight);

  // Backend never stores the serialized DOM range. Always prefer the existing
  // client-side range if we have one — otherwise emit an empty stub and let
  // the renderer fall back to text-anchor restoration.
  const range: SerializedRange = fallback?.range ?? emptyRange();

  const local: Highlight = {
    id: highlight.id,
    bookId: highlight.book_sha256,
    color: normalizeHighlightColor(highlight.color || ""),
    createdAt: parseBackendTime(highlight.created_at),
    updatedAt: parseBackendTime(highlight.updated_at),
    note: highlight.note || undefined,
    locator,
    range,
    anchorVersion: fallback?.anchorVersion ?? 2,
    koreader: {
      status: normalizeKoreaderStatus(highlight.koreader?.status),
      backendId: highlight.id,
      pos0: highlight.koreader?.pos0,
      pos1: highlight.koreader?.pos1,
      page: highlight.koreader?.page,
      error: highlight.koreader?.error,
    },
    backendVersion: highlight.version,
    syncVersion: highlight.sync_version,
    source: highlight.source,
    deletedAt: parseBackendTime(highlight.deleted_at),
    deletedBy: highlight.deleted_by,
    updatedBy: highlight.updated_by,
  };
  if (!highlight.deleted_at) delete local.deletedAt;
  local.sortKey = buildHighlightSortKey(local);
  return local;
}

/**
 * Map the backend echo of a freshly-created highlight back to a local Highlight.
 *
 * The client already has authoritative locator/range from the user's selection,
 * so we keep those and only adopt backend identifiers and metadata.
 */
export function fromBackendForCreate(highlight: BookAwareHighlight, optimistic: Highlight): Highlight {
  return buildHighlight(highlight, { preferClientLocator: true, fallback: optimistic });
}

/**
 * Map a backend highlight received via load / changes / update into a local
 * Highlight. The backend's locator wins so corrections (spine index, href,
 * prefix/suffix) flow back to the client; the serialized DOM range is taken
 * from the existing local copy when available.
 */
export function fromBackendForSync(highlight: BookAwareHighlight, existing?: Highlight): Highlight {
  return buildHighlight(highlight, { preferClientLocator: false, fallback: existing });
}

export function toCreateHighlightPayload(input: {
  locator: HighlightLocator;
  color?: HighlightColor;
  note?: string;
  chapter?: string;
}) {
  return {
    exact: input.locator.text.highlight,
    prefix: input.locator.text.before,
    suffix: input.locator.text.after,
    href: input.locator.href,
    spine_index: input.locator.locations.position,
    total_progression: input.locator.locations.totalProgression,
    chapter: input.chapter,
    color: input.color,
    note: input.note,
  };
}
