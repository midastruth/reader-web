/**
 * Owns the highlight sync lifecycle: initial load + periodic delta pulls +
 * focus/visibility triggers. Components subscribe to events and never touch
 * timers or the remote API directly.
 *
 * Lifecycle:
 *   const session = highlightSyncService.start(bookId, {
 *     getCurrentHighlights: () => store.getState().highlights.currentBookHighlights,
 *     onInitialLoad: ...,
 *     onPulledChanges: ...,
 *     onError: ...,
 *   });
 *   // later:
 *   session.stop();
 */

import type { Highlight } from "@/lib/types/highlights";
import {
  highlightService,
  type HighlightService,
  type PullChangesResult,
} from "./HighlightService";

export type { PullChangesResult } from "./HighlightService";

export interface HighlightSyncEvents {
  /** Return the latest Redux snapshot of the book's highlights. */
  getCurrentHighlights: () => readonly Highlight[];
  /** Called once after the initial full load completes. */
  onInitialLoad?: (highlights: Highlight[]) => void;
  /** Called after every successful delta pull that produced any change. */
  onPulledChanges?: (result: PullChangesResult) => void;
  /** Called on any error during initial load or pulls. */
  onError?: (error: unknown, phase: "initialLoad" | "pull") => void;
}

export interface HighlightSyncOptions {
  /** Polling interval in ms. Defaults to 20s. */
  intervalMs?: number;
}

export interface HighlightSyncSession {
  /** Force an immediate pull. Resolves when it (or the in-flight one) finishes. */
  pullNow: () => Promise<void>;
  /** Stop the timer + listeners. Safe to call multiple times. */
  stop: () => void;
}

const DEFAULT_INTERVAL_MS = 20_000;

export class HighlightSyncService {
  constructor(private readonly service: HighlightService = highlightService) {}

  start(
    bookId: string,
    events: HighlightSyncEvents,
    options: HighlightSyncOptions = {}
  ): HighlightSyncSession {
    const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    let stopped = false;
    let inflight: Promise<void> | null = null;

    const pullOnce = async () => {
      if (stopped) return;
      try {
        const result = await this.service.pullChanges(bookId, events.getCurrentHighlights());
        if (stopped) return;
        if (result.added.length || result.updated.length || result.deleted.length) {
          events.onPulledChanges?.(result);
        }
      } catch (error) {
        if (!stopped) events.onError?.(error, "pull");
      }
    };

    /** Deduplicates concurrent triggers (interval + focus + visibility). */
    const pullNow = (): Promise<void> => {
      if (inflight) return inflight;
      const promise = pullOnce().finally(() => {
        if (inflight === promise) inflight = null;
      });
      inflight = promise;
      return promise;
    };

    // Kick off the initial full load, then start the periodic poll.
    (async () => {
      try {
        const highlights = await this.service.loadBook(bookId);
        if (stopped) return;
        events.onInitialLoad?.(highlights);
      } catch (error) {
        if (!stopped) events.onError?.(error, "initialLoad");
      }
    })();

    const handleFocus = () => {
      void pullNow();
    };
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void pullNow();
      }
    };

    const interval =
      typeof window !== "undefined"
        ? window.setInterval(() => {
            void pullNow();
          }, intervalMs)
        : 0;

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return {
      pullNow,
      stop: () => {
        if (stopped) return;
        stopped = true;
        if (typeof window !== "undefined") {
          window.clearInterval(interval);
          window.removeEventListener("focus", handleFocus);
        }
        if (typeof document !== "undefined") {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
        }
      },
    };
  }
}

export const highlightSyncService = new HighlightSyncService();
