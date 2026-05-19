/**
 * Fallback renderer: wrap ranges with `<mark>` elements.
 *
 * Used only when the browser does not support the CSS Custom Highlight API.
 * Mutates the EPUB content DOM, so the primary path in cssHighlights.ts is
 * always preferred.
 */

import type { HighlightColor } from '@/lib/types/highlights';
import { HIGHLIGHT_COLORS, NOTE_MARK_BORDER } from './injectStyles';

/** Split a range that crosses text nodes into single-text-node sub-ranges. */
function splitRangeByElements(range: Range): Range[] {
  const ranges: Range[] = [];

  if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
    ranges.push(range.cloneRange());
    return ranges;
  }

  const ownerDocument =
    (range.commonAncestorContainer.nodeType === Node.DOCUMENT_NODE
      ? (range.commonAncestorContainer as Document)
      : range.commonAncestorContainer.ownerDocument) ||
    range.startContainer.ownerDocument ||
    range.endContainer.ownerDocument;

  if (!ownerDocument) return [];

  const root = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
    ? range.commonAncestorContainer.parentNode || range.commonAncestorContainer
    : range.commonAncestorContainer;

  const walker = ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      try {
        if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
      } catch {
        return NodeFilter.FILTER_REJECT;
      }
      if ((node.textContent ?? '').trim().length === 0) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const nodeRange = ownerDocument.createRange();
    nodeRange.selectNodeContents(node);
    if (node === range.startContainer) nodeRange.setStart(node, range.startOffset);
    if (node === range.endContainer) nodeRange.setEnd(node, range.endOffset);
    if (nodeRange.collapsed || nodeRange.toString().trim().length === 0) continue;
    ranges.push(nodeRange);
  }

  return ranges;
}

function getHighlightClassName(color: HighlightColor, id: string): string {
  return `thorium-highlight thorium-highlight-${color} thorium-highlight-${id}`;
}

function getInlineStyles(color: HighlightColor): string {
  const bgColor = HIGHLIGHT_COLORS[color] ?? HIGHLIGHT_COLORS.yellow;
  return `
    background-color: ${bgColor} !important;
    color: inherit !important;
    display: inline !important;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
    cursor: pointer;
    position: relative;
    padding: 0;
    border-radius: 2px;
    transition: background-color 0.2s ease;
  `.trim();
}

function createHighlightMark(
  doc: Document,
  id: string,
  color: HighlightColor,
  hasNote: boolean
): HTMLElement {
  const mark = doc.createElement('mark');
  mark.className = getHighlightClassName(color, id);
  mark.setAttribute('data-highlight-id', id);
  mark.setAttribute('data-highlight-color', color);
  if (hasNote) mark.setAttribute('data-has-note', 'true');
  mark.style.cssText = getInlineStyles(color);
  if (hasNote) mark.style.borderBottom = NOTE_MARK_BORDER;
  return mark;
}

/** Wrap a range with `<mark>` elements. Returns the first inserted mark. */
export function wrapRangeWithHighlight(
  range: Range,
  id: string,
  color: HighlightColor,
  hasNote: boolean = false
): HTMLElement | null {
  const doc = range.startContainer.ownerDocument || range.endContainer.ownerDocument;
  if (!doc) return null;

  const parts = splitRangeByElements(range);
  let firstMark: HTMLElement | null = null;

  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part.collapsed) continue;

    try {
      const mark = createHighlightMark(doc, id, color, hasNote);
      part.surroundContents(mark);
      if (!firstMark) firstMark = mark;
      continue;
    } catch {
      // Fall through to manual wrapping.
    }

    try {
      const fragment = part.extractContents();
      const mark = createHighlightMark(doc, id, color, hasNote);
      mark.appendChild(fragment);
      part.insertNode(mark);
      if (!firstMark) firstMark = mark;
    } catch (innerError) {
      if (process.env.NODE_ENV !== 'production') console.warn('Failed to wrap highlight sub-range:', innerError);
    }
  }

  return firstMark;
}

/** Unwrap previously-rendered `<mark>` elements for a highlight. */
export function removeHighlightMark(highlightId: string, doc: Document): boolean {
  try {
    const marks = doc.querySelectorAll(`.thorium-highlight[data-highlight-id="${highlightId}"]`);

    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
      }
    });

    doc.body?.normalize();
    return marks.length > 0;
  } catch (error) {
    console.error('Failed to unwrap highlight:', error);
    return false;
  }
}

export function updateHighlightColor(
  highlightId: string,
  newColor: HighlightColor,
  doc: Document
): boolean {
  try {
    const marks = doc.querySelectorAll(`.thorium-highlight[data-highlight-id="${highlightId}"]`);

    marks.forEach((mark) => {
      const htmlMark = mark as HTMLElement;
      const oldColor = htmlMark.getAttribute('data-highlight-color');
      if (oldColor) htmlMark.classList.remove(`thorium-highlight-${oldColor}`);
      htmlMark.classList.add(`thorium-highlight-${newColor}`);
      htmlMark.setAttribute('data-highlight-color', newColor);
      htmlMark.style.cssText = getInlineStyles(newColor);
      if (htmlMark.hasAttribute('data-has-note')) htmlMark.style.borderBottom = NOTE_MARK_BORDER;
    });

    return marks.length > 0;
  } catch (error) {
    console.error('Failed to update highlight color:', error);
    return false;
  }
}

export function toggleHighlightNoteIndicator(
  highlightId: string,
  hasNote: boolean,
  doc: Document
): boolean {
  try {
    const marks = doc.querySelectorAll(`.thorium-highlight[data-highlight-id="${highlightId}"]`);

    marks.forEach((mark) => {
      const htmlMark = mark as HTMLElement;
      if (hasNote) {
        htmlMark.setAttribute('data-has-note', 'true');
        htmlMark.style.borderBottom = NOTE_MARK_BORDER;
      } else {
        htmlMark.removeAttribute('data-has-note');
        htmlMark.style.borderBottom = '';
      }
    });

    return marks.length > 0;
  } catch (error) {
    console.error('Failed to update note indicator:', error);
    return false;
  }
}

export function selectHighlightMark(highlightId: string, doc: Document): void {
  const marks = doc.querySelectorAll(`.thorium-highlight[data-highlight-id="${highlightId}"]`);
  marks.forEach((mark) => (mark as HTMLElement).classList.add('selected'));
}

export function deselectAllMarkHighlights(doc: Document): void {
  const selected = doc.querySelectorAll('.thorium-highlight.selected');
  selected.forEach((mark) => (mark as HTMLElement).classList.remove('selected'));
}

/** Strip every `<mark>`-rendered highlight from the document. */
export function clearAllHighlightMarks(doc: Document): void {
  const marks = Array.from(doc.querySelectorAll('.thorium-highlight[data-highlight-id]'));
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
  doc.body?.normalize();
}

export function getHighlightIdFromElement(element: Element): string | null {
  const mark = element.closest('.thorium-highlight');
  return mark ? mark.getAttribute('data-highlight-id') : null;
}
