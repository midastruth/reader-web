import { RefObject, useCallback, useEffect, useRef } from "react";

import { BasicTextSelection } from "@readium/navigator-html-injectables";
import { FrameManager, FXLFrameManager } from "@readium/navigator";
import { Locator, Publication } from "@readium/shared";

import type { HighlightManagerHandle } from "@/components/Highlights/HighlightManager";
import type { TextSelection } from "@/components/Highlights/hooks/useHighlightSelection";

type NavigatorFrameManager = FrameManager | FXLFrameManager | undefined;

interface UseEpubHighlightBridgeOptions {
  container: RefObject<HTMLDivElement | null>;
  publication: Publication;
  getCframes: () => NavigatorFrameManager[] | undefined;
  currentLocator: () => Locator | undefined;
}

const normalizeHrefForReadingOrder = (href: string): string =>
  decodeURIComponent(href).split("#")[0].split("?")[0];

const getFrameHref = (
  frameManager: FrameManager | FXLFrameManager,
  fallbackHref?: string
): string | undefined => {
  const iframe = frameManager.iframe;
  const debugHref = "debugHref" in frameManager
    ? (frameManager as FXLFrameManager).debugHref
    : undefined;

  return debugHref || iframe.dataset.originalHref || fallbackHref;
};

export const useEpubHighlightBridge = ({
  container,
  publication,
  getCframes,
  currentLocator
}: UseEpubHighlightBridgeOptions) => {
  const highlightManagerRef = useRef<HighlightManagerHandle | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pendingHighlightRestoresRef = useRef<Array<{ iframe: HTMLIFrameElement; href: string }>>([]);

  const getReadingOrderPosition = useCallback((href: string): number | undefined => {
    const normalizedHref = normalizeHrefForReadingOrder(href);
    const index = publication.readingOrder?.items?.findIndex(
      item => normalizeHrefForReadingOrder(item.href) === normalizedHref
    );
    return index !== undefined && index >= 0 ? index : undefined;
  }, [publication]);

  const setHighlightManagerHandle = useCallback((handle: HighlightManagerHandle | null) => {
    highlightManagerRef.current = handle;
    if (!handle) return;

    const pending = pendingHighlightRestoresRef.current;
    pendingHighlightRestoresRef.current = [];
    pending.forEach(({ iframe, href }) => {
      void handle.restoreForIframe(iframe, href);
    });
  }, []);

  const restoreHighlightsForLoadedFrames = useCallback(async (wnd: Window): Promise<void> => {
    try {
      const loadedIframe = (wnd.frameElement as HTMLIFrameElement | null) || null;
      if (loadedIframe) {
        iframeRef.current = loadedIframe;
      }

      const locatorHref = currentLocator()?.href;

      getCframes()?.forEach((frameManager: NavigatorFrameManager) => {
        if (!frameManager) return;

        const iframe = frameManager.iframe;
        const href = getFrameHref(frameManager, locatorHref);

        if (!href) return;

        iframe.dataset.originalHref = href;
        const handle = highlightManagerRef.current;
        if (handle) {
          void handle.restoreForIframe(iframe, href);
          return;
        }

        const pending = pendingHighlightRestoresRef.current;
        if (!pending.some((item) => item.iframe === iframe && item.href === href)) {
          pending.push({ iframe, href });
        }
      });
    } catch (error) {
      console.warn("StatefulReader: failed to restore highlights for loaded frame", error);
    }
  }, [currentLocator, getCframes]);

  const handleTextSelected = (selection: BasicTextSelection): void => {
    if (!selection) {
      console.warn("StatefulReader: selection is null");
      return;
    }

    if (!iframeRef.current && container.current) {
      const iframe = container.current.querySelector("iframe");
      if (iframe) {
        iframeRef.current = iframe;
      }
    }

    const frames = selection.targetFrameSrc ? getCframes() : undefined;
    const matchingFrame = selection.targetFrameSrc
      ? frames?.find((frame) => frame && frame.source === selection.targetFrameSrc)
      : undefined;

    if (matchingFrame) {
      iframeRef.current = matchingFrame.iframe;
    }

    const selectionHref = matchingFrame
      ? getFrameHref(matchingFrame, currentLocator()?.href)
      : currentLocator()?.href;

    if (!selectionHref) {
      console.warn("StatefulReader: could not resolve resource href for selection");
      return;
    }

    if (iframeRef.current) {
      iframeRef.current.dataset.originalHref = selectionHref;
    }

    const isIframeReady = !!iframeRef.current;
    const isManagerReady = !!highlightManagerRef.current;

    const getSelectionFromIframe = (iframe: HTMLIFrameElement, targetSrc?: string, searchText?: string) => {
      if (targetSrc && iframe.src && iframe.src !== targetSrc) {
        console.warn("StatefulReader: Mismatch in iframe src", { found: iframe.src, target: targetSrc });
      }

      const win = iframe.contentWindow;
      if (win) {
        let sel = win.getSelection();
        if (sel && sel.rangeCount > 0) return sel;

        if (searchText) {
          sel?.removeAllRanges();
          const found = (win as any).find(searchText, false, false, true, false, true, false);
          if (found) {
            sel = win.getSelection();
            if (sel && sel.rangeCount > 0) return sel;
          }
        }
      }

      return null;
    };

    const toTextSelection = (domSelection: Selection, href: string): TextSelection => {
      const range = domSelection.getRangeAt(0);
      return {
        range,
        text: domSelection.toString(),
        href,
        readingOrderPosition: getReadingOrderPosition(href),
        boundingClientRect: range.getBoundingClientRect()
      };
    };

    const handleSelectionProcessing = (iframe: HTMLIFrameElement) => {
      const domSelection = getSelectionFromIframe(iframe, selection.targetFrameSrc);

      if (domSelection && domSelection.rangeCount > 0) {
        highlightManagerRef.current!.handleTextSelected(toTextSelection(domSelection, selectionHref));
        return;
      }

      console.warn("StatefulReader: No DOM selection found (immediate check)");

      setTimeout(() => {
        const delayedSel = getSelectionFromIframe(iframe, selection.targetFrameSrc, selection.text);
        if (delayedSel && delayedSel.rangeCount > 0) {
          highlightManagerRef.current?.handleTextSelected(toTextSelection(delayedSel, selectionHref));
        } else {
          console.warn("StatefulReader: Still no selection after retry/fallback");
        }
      }, 50);
    };

    if (isIframeReady && isManagerReady) {
      handleSelectionProcessing(iframeRef.current!);
    } else {
      console.error("StatefulReader: Refs missing when handling text selection", {
        iframeRef: isIframeReady,
        highlightManagerRef: isManagerReady,
        publicationLoaded: !!publication
      });
    }
  };

  useEffect(() => {
    if (!container.current) return;

    const observer = new MutationObserver(() => {
      const iframe = container.current?.querySelector("iframe");
      if (iframe) {
        iframeRef.current = iframe;
      }
    });

    observer.observe(container.current, { childList: true, subtree: true });

    const iframe = container.current?.querySelector("iframe");
    if (iframe) {
      iframeRef.current = iframe;
    }

    return () => observer.disconnect();
  }, [container]);

  return {
    iframeRef,
    setHighlightManagerHandle,
    restoreHighlightsForLoadedFrames,
    handleTextSelected
  };
};
