/**
 * Watches every reader iframe for pointerup/keyup events and runs a callback
 * once the user clears the active text selection.
 *
 * Also records the screen position of the last pointerup so the consumer can
 * anchor a popup toolbar to it (more reliable than the selection rect when
 * the user releases outside the highlighted text).
 *
 * Returned helpers:
 *  - `register(iframe)`  → start listening on this iframe (idempotent)
 *  - `unregisterAll()`   → tear down everything (called on unmount automatically)
 *  - `getLastPointerUp(iframe)` → last { x, y, timestamp } in *outer page* coords
 *  - `setActive(active)` → toggle whether the selection check should run
 */

import { useCallback, useEffect, useRef } from 'react';

export interface PointerUpPosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface UseIframeSelectionDismissalOptions {
  /** Called once when the iframe's selection becomes empty / collapsed. */
  onSelectionCleared: () => void;
}

export interface UseIframeSelectionDismissalReturn {
  register: (iframe: HTMLIFrameElement) => void;
  unregisterAll: () => void;
  getLastPointerUp: (iframe: HTMLIFrameElement | null) => PointerUpPosition | null;
  setActive: (active: boolean) => void;
}

export function useIframeSelectionDismissal({
  onSelectionCleared,
}: UseIframeSelectionDismissalOptions): UseIframeSelectionDismissalReturn {
  const cleanupsRef = useRef(new Map<HTMLIFrameElement, () => void>());
  const lastPointerUpRef = useRef(new Map<HTMLIFrameElement, PointerUpPosition>());
  const activeRef = useRef(false);
  const onClearedRef = useRef(onSelectionCleared);

  useEffect(() => {
    onClearedRef.current = onSelectionCleared;
  }, [onSelectionCleared]);

  const setActive = useCallback((active: boolean) => {
    activeRef.current = active;
  }, []);

  const register = useCallback((iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return;

    // Replace any existing listener so re-registering after navigation is safe.
    cleanupsRef.current.get(iframe)?.();

    const scheduleSelectionCheck = () => {
      if (!activeRef.current) return;

      win.requestAnimationFrame(() => {
        const selection = win.getSelection();
        const hasActiveSelection =
          !!selection &&
          selection.rangeCount > 0 &&
          !selection.isCollapsed &&
          selection.toString().trim().length > 0;

        if (!hasActiveSelection) onClearedRef.current();
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const iframeRect = iframe.getBoundingClientRect();
      lastPointerUpRef.current.set(iframe, {
        x: iframeRect.left + event.clientX,
        y: iframeRect.top + event.clientY,
        timestamp: Date.now(),
      });
      scheduleSelectionCheck();
    };

    const handleKeyUp = () => scheduleSelectionCheck();

    doc.addEventListener('pointerup', handlePointerUp);
    doc.addEventListener('keyup', handleKeyUp);

    cleanupsRef.current.set(iframe, () => {
      doc.removeEventListener('pointerup', handlePointerUp);
      doc.removeEventListener('keyup', handleKeyUp);
      lastPointerUpRef.current.delete(iframe);
    });
  }, []);

  const unregisterAll = useCallback(() => {
    for (const cleanup of cleanupsRef.current.values()) cleanup();
    cleanupsRef.current.clear();
    lastPointerUpRef.current.clear();
  }, []);

  const getLastPointerUp = useCallback(
    (iframe: HTMLIFrameElement | null) =>
      iframe ? lastPointerUpRef.current.get(iframe) ?? null : null,
    []
  );

  useEffect(() => unregisterAll, [unregisterAll]);

  return { register, unregisterAll, getLastPointerUp, setActive };
}
