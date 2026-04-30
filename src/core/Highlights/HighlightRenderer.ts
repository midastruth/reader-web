/**
 * DOM/CSS rendering facade for highlights.
 *
 * Primary rendering uses the CSS Custom Highlight API. The underlying helper
 * still contains the browser fallback, but React code no longer needs to know
 * about those details.
 */

import type { Highlight } from '@/lib/types/highlights';
import HighlightAnchors from './HighlightAnchors';
import {
  clearRenderedHighlights,
  deselectAllHighlights,
  getCssHighlightIdsAtPoint,
  getHighlightIdFromElement,
  injectHighlightStyles,
  removeCssHighlight,
  removeHighlightMark,
  renderCssHighlight,
  selectHighlightMark,
  toggleHighlightNoteIndicator,
  updateCssHighlightAppearance,
  updateHighlightColor,
  wrapRangeWithHighlight,
} from '@/components/Highlights/helpers/highlightSerializer';

export class HighlightRenderer {
  private rendered = new WeakMap<Document, Set<string>>();

  setup(iframe: HTMLIFrameElement): Document | null {
    const doc = iframe.contentDocument;
    if (!doc) return null;
    injectHighlightStyles(doc);
    if (!this.rendered.has(doc)) this.rendered.set(doc, new Set());
    return doc;
  }

  render(highlight: Highlight, iframe: HTMLIFrameElement): boolean {
    const doc = this.setup(iframe);
    if (!doc) return false;

    const renderedIds = this.rendered.get(doc)!;
    if (renderedIds.has(highlight.id)) return true;

    const ranges = HighlightAnchors.restoreAll(highlight.range, highlight.locator, doc);
    if (ranges.length === 0) return false;

    const renderedWithCss = renderCssHighlight(highlight, ranges, doc);
    if (!renderedWithCss) {
      for (const range of ranges) {
        wrapRangeWithHighlight(range, highlight.id, highlight.color, !!highlight.note);
      }
    }

    renderedIds.add(highlight.id);
    return true;
  }

  restore(highlights: Highlight[], iframe: HTMLIFrameElement): void {
    const doc = this.setup(iframe);
    if (!doc) return;
    this.clear(iframe);
    for (const highlight of highlights) this.render(highlight, iframe);
  }

  remove(highlightId: string, iframe: HTMLIFrameElement): void {
    const doc = iframe.contentDocument;
    if (!doc) return;
    removeCssHighlight(highlightId, doc);
    removeHighlightMark(highlightId, doc);
    this.rendered.get(doc)?.delete(highlightId);
  }

  update(highlight: Highlight, iframe: HTMLIFrameElement): void {
    const doc = iframe.contentDocument;
    if (!doc) return;
    const updatedCss = updateCssHighlightAppearance(highlight, doc);
    if (!updatedCss) {
      updateHighlightColor(highlight.id, highlight.color, doc);
      toggleHighlightNoteIndicator(highlight.id, !!highlight.note, doc);
    }
  }

  clear(iframe: HTMLIFrameElement): void {
    const doc = iframe.contentDocument;
    if (!doc) return;
    clearRenderedHighlights(doc);
    this.rendered.get(doc)?.clear();
    deselectAllHighlights(doc);
  }

  select(highlightId: string, doc: Document): void {
    selectHighlightMark(highlightId, doc);
  }

  deselect(doc: Document): void {
    deselectAllHighlights(doc);
  }

  getIdsFromClick(doc: Document, target: Element | null, x: number, y: number): string[] {
    const ids: string[] = [];
    const domId = target ? getHighlightIdFromElement(target) : null;
    if (domId) ids.push(domId);
    for (const id of getCssHighlightIdsAtPoint(doc, x, y)) {
      if (!ids.includes(id)) ids.push(id);
    }
    return ids;
  }
}

export default HighlightRenderer;
