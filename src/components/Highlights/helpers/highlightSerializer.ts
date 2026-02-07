/**
 * Serialization utilities for highlights
 */

import type { Highlight, HighlightColor } from '@/lib/types/highlights';

/**
 * Color to CSS class mapping
 */
export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: '#fff59d',
  green: '#a5d6a7',
  blue: '#90caf9',
  pink: '#f48fb1',
  orange: '#ffcc80',
  purple: '#ce93d8',
};

/**
 * Generate CSS class name for a highlight
 */
export function getHighlightClassName(color: HighlightColor, id: string): string {
  return `thorium-highlight thorium-highlight-${color} thorium-highlight-${id}`;
}

/**
 * Generate inline styles for a highlight mark element
 */
export function getHighlightStyles(color: HighlightColor): string {
  const bgColor = HIGHLIGHT_COLORS[color];
  return `
    background-color: ${bgColor};
    cursor: pointer;
    position: relative;
    padding: 2px 0;
    border-radius: 2px;
    transition: background-color 0.2s ease;
  `.trim();
}

/**
 * Create a highlight mark element
 */
export function createHighlightMark(

  doc: Document,

  id: string,

  color: HighlightColor,

  hasNote: boolean = false

): HTMLElement {

  const mark = doc.createElement('mark');

  mark.className = getHighlightClassName(color, id);

  mark.setAttribute('data-highlight-id', id);

  mark.setAttribute('data-highlight-color', color);

  if (hasNote) {

    mark.setAttribute('data-has-note', 'true');

  }

  mark.style.cssText = getHighlightStyles(color);



  // Add note indicator if has note

  if (hasNote) {

    mark.style.borderBottom = '2px solid rgba(0, 0, 0, 0.3)';

  }



  return mark;

}


/**
 * Wrap a range with a highlight mark
 */
export function wrapRangeWithHighlight(
  range: Range,
  id: string,
  color: HighlightColor,
  hasNote: boolean = false
): HTMLElement | null {

  const doc = range.startContainer.ownerDocument || range.endContainer.ownerDocument;
  if (!doc) return null;

  try {

    const mark = createHighlightMark(doc, id, color, hasNote);

    range.surroundContents(mark);
    return mark;
  } catch (error) {
    // If surroundContents fails (e.g., range crosses element boundaries),
    // we need to manually wrap the contents
    console.warn('surroundContents failed, using manual wrapping:', error);

    try {
      const fragment = range.extractContents();

      const mark = createHighlightMark(doc, id, color, hasNote);

      mark.appendChild(fragment);
      range.insertNode(mark);
      return mark;
    } catch (innerError) {
      console.error('Failed to wrap range:', innerError);
      return null;
    }
  }
}

/**
 * Remove highlight mark from a range
 */
export function unwrapHighlight(highlightId: string, doc: Document): boolean {
  try {
    const marks = doc.querySelectorAll(`[data-highlight-id="${highlightId}"]`);

    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        // Move all children out of the mark
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
      }
    });

    // Normalize to merge adjacent text nodes
    doc.body.normalize();

    return marks.length > 0;
  } catch (error) {
    console.error('Failed to unwrap highlight:', error);
    return false;
  }
}

/**
 * Update highlight color
 */
export function updateHighlightColor(
  highlightId: string,
  newColor: HighlightColor,
  doc: Document
): boolean {
  try {
    const marks = doc.querySelectorAll(`[data-highlight-id="${highlightId}"]`);

    marks.forEach(mark => {
      const htmlMark = mark as HTMLElement;
      const oldColor = htmlMark.getAttribute('data-highlight-color');

      // Update class
      if (oldColor) {
        htmlMark.classList.remove(`thorium-highlight-${oldColor}`);
      }
      htmlMark.classList.add(`thorium-highlight-${newColor}`);

      // Update attribute
      htmlMark.setAttribute('data-highlight-color', newColor);

      // Update styles
      htmlMark.style.cssText = getHighlightStyles(newColor);

      // Preserve note indicator if exists
      if (htmlMark.hasAttribute('data-has-note')) {
        htmlMark.style.borderBottom = '2px solid rgba(0, 0, 0, 0.3)';
      }
    });

    return marks.length > 0;
  } catch (error) {
    console.error('Failed to update highlight color:', error);
    return false;
  }
}

/**
 * Update highlight note indicator
 */
export function updateHighlightNoteIndicator(
  highlightId: string,
  hasNote: boolean,
  doc: Document
): boolean {
  try {
    const marks = doc.querySelectorAll(`[data-highlight-id="${highlightId}"]`);

    marks.forEach(mark => {
      const htmlMark = mark as HTMLElement;

      if (hasNote) {
        htmlMark.setAttribute('data-has-note', 'true');
        htmlMark.style.borderBottom = '2px solid rgba(0, 0, 0, 0.3)';
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

/**
 * Inject CSS styles for highlights into iframe
 */
export function injectHighlightStyles(doc: Document): void {
  // Check if styles already injected
  if (doc.getElementById('thorium-highlight-styles')) {
    return;
  }

  const style = doc.createElement('style');
  style.id = 'thorium-highlight-styles';
  style.textContent = `
    .thorium-highlight {
      position: relative;
      cursor: pointer;
      padding: 2px 0;
      border-radius: 2px;
      transition: background-color 0.2s ease, opacity 0.2s ease;
    }

    .thorium-highlight:hover {
      opacity: 0.8;
    }

    .thorium-highlight-yellow { background-color: ${HIGHLIGHT_COLORS.yellow}; }
    .thorium-highlight-green { background-color: ${HIGHLIGHT_COLORS.green}; }
    .thorium-highlight-blue { background-color: ${HIGHLIGHT_COLORS.blue}; }
    .thorium-highlight-pink { background-color: ${HIGHLIGHT_COLORS.pink}; }
    .thorium-highlight-orange { background-color: ${HIGHLIGHT_COLORS.orange}; }
    .thorium-highlight-purple { background-color: ${HIGHLIGHT_COLORS.purple}; }

    .thorium-highlight[data-has-note="true"] {
      border-bottom: 2px solid rgba(0, 0, 0, 0.3);
    }

    .thorium-highlight.selected {
      outline: 2px solid rgba(0, 0, 0, 0.4);
      outline-offset: 2px;
    }
  `;

  doc.head.appendChild(style);
}

/**
 * Remove highlight mark (alias for unwrapHighlight)
 */
export const removeHighlightMark = unwrapHighlight;

/**
 * Toggle highlight note indicator (alias for updateHighlightNoteIndicator)
 */
export const toggleHighlightNoteIndicator = updateHighlightNoteIndicator;

/**
 * Select a highlight mark
 */
export function selectHighlightMark(highlightId: string, doc: Document): void {
  // First deselect all
  deselectAllHighlights(doc);

  const marks = doc.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
  marks.forEach(mark => {
    (mark as HTMLElement).classList.add('selected');
  });
}

/**
 * Deselect all highlight marks
 */
export function deselectAllHighlights(doc: Document): void {
  const selectedMarks = doc.querySelectorAll('.thorium-highlight.selected');
  selectedMarks.forEach(mark => {
    (mark as HTMLElement).classList.remove('selected');
  });
}

/**
 * Get highlight ID from an element (if it is part of a highlight)
 */
export function getHighlightIdFromElement(element: Element): string | null {
  const mark = element.closest('.thorium-highlight');
  if (mark) {
    return mark.getAttribute('data-highlight-id');
  }
  return null;
}
