/**
 * Rendering utilities for highlights.
 *
 * Primary rendering uses the CSS Custom Highlight API (Obsidian-style): text
 * decorations are painted by the browser without mutating EPUB content DOM.
 * The older <mark> wrapping path is kept as a fallback for browsers that do
 * not support CSS.highlights.
 */

import type { Highlight, HighlightColor } from '@/lib/types/highlights';
import { splitRangeByElements } from './locatorToRange';

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

interface CSSHighlightsRegistry {
  set(name: string, value: unknown): void;
  delete(name: string): void;
}

interface HighlightInstance {
  add(range: Range): void;
  clear(): void;
  priority?: number;
}

interface RenderedCssHighlightMeta {
  name: string;
  color: HighlightColor;
  hasNote: boolean;
  selected: boolean;
  ranges: Range[];
}

type HighlightConstructor = new (...ranges: Range[]) => HighlightInstance;

function getCssRegistry(doc: Document): CSSHighlightsRegistry | null {
  return ((doc.defaultView?.CSS as unknown as { highlights?: CSSHighlightsRegistry })?.highlights) ?? null;
}

function getHighlightConstructor(doc: Document): HighlightConstructor | null {
  return ((doc.defaultView as unknown as { Highlight?: HighlightConstructor })?.Highlight) ?? null;
}

function getCssMetaMap(doc: Document): Map<string, RenderedCssHighlightMeta> {
  const holder = doc as Document & { __thoriumCssHighlights?: Map<string, RenderedCssHighlightMeta> };
  if (!holder.__thoriumCssHighlights) holder.__thoriumCssHighlights = new Map();
  return holder.__thoriumCssHighlights;
}

function getRegistryName(id: string): string {
  return `thorium_h_${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function rebuildDynamicHighlightStyles(doc: Document): void {
  let style = doc.getElementById('thorium-highlight-dynamic-styles') as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement('style');
    style.id = 'thorium-highlight-dynamic-styles';
    doc.head.appendChild(style);
  }

  const rules: string[] = [];
  for (const meta of getCssMetaMap(doc).values()) {
    const bg = HIGHLIGHT_COLORS[meta.color] ?? HIGHLIGHT_COLORS.yellow;
    const noteDecoration = meta.hasNote
      ? 'text-decoration-line: underline; text-decoration-color: rgba(0, 0, 0, 0.45); text-decoration-thickness: 2px; text-underline-offset: 0.18em;'
      : '';
    const selectedDecoration = meta.selected
      ? 'text-shadow: 0 0 0.01px currentColor, 0 0 3px rgba(0, 0, 0, 0.35);'
      : '';
    const selectedBg = meta.selected ? `${bg}` : bg;

    rules.push(`::highlight(${meta.name}) { background-color: ${selectedBg}; color: inherit; ${noteDecoration} ${selectedDecoration} }`);
  }

  style.textContent = rules.join('\n');
}

/**
 * Render a highlight with the CSS Custom Highlight API.
 * Returns false when the browser does not support the API.
 */
export function renderCssHighlight(highlight: Highlight, ranges: Range[], doc: Document): boolean {
  const registry = getCssRegistry(doc);
  const HighlightCtor = getHighlightConstructor(doc);
  if (!registry || !HighlightCtor) return false;

  const validRanges = ranges.filter((range) => !range.collapsed && range.toString().trim().length > 0);
  if (validRanges.length === 0) return true;

  const name = getRegistryName(highlight.id);
  registry.delete(name);

  const cssHighlight = new HighlightCtor();
  cssHighlight.priority = 0;
  validRanges.forEach((range) => cssHighlight.add(range));
  registry.set(name, cssHighlight);

  getCssMetaMap(doc).set(highlight.id, {
    name,
    color: highlight.color,
    hasNote: !!highlight.note,
    selected: false,
    ranges: validRanges,
  });
  rebuildDynamicHighlightStyles(doc);
  return true;
}

export function removeCssHighlight(highlightId: string, doc: Document): boolean {
  const registry = getCssRegistry(doc);
  const meta = getCssMetaMap(doc).get(highlightId);
  if (!registry || !meta) return false;

  registry.delete(meta.name);
  getCssMetaMap(doc).delete(highlightId);
  rebuildDynamicHighlightStyles(doc);
  return true;
}

export function removeAllCssHighlights(doc: Document): void {
  const registry = getCssRegistry(doc);
  const metaMap = getCssMetaMap(doc);

  if (registry) {
    for (const meta of metaMap.values()) registry.delete(meta.name);
  }

  metaMap.clear();
  rebuildDynamicHighlightStyles(doc);
}

export function updateCssHighlightAppearance(highlight: Highlight, doc: Document): boolean {
  const meta = getCssMetaMap(doc).get(highlight.id);
  if (!meta) return false;

  meta.color = highlight.color;
  meta.hasNote = !!highlight.note;
  rebuildDynamicHighlightStyles(doc);
  return true;
}

export function getCssHighlightIdAtPoint(doc: Document, x: number, y: number): string | null {
  const PAD_Y = 4;

  for (const [id, meta] of getCssMetaMap(doc)) {
    for (const range of meta.ranges) {
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (x >= rect.left && x <= rect.right && y >= rect.top - PAD_Y && y <= rect.bottom + PAD_Y) {
          return id;
        }
      }
    }
  }

  return null;
}

export function selectCssHighlight(highlightId: string, doc: Document): void {
  const metaMap = getCssMetaMap(doc);
  for (const [id, meta] of metaMap) meta.selected = id === highlightId;
  rebuildDynamicHighlightStyles(doc);
}

export function deselectAllCssHighlights(doc: Document): void {
  const metaMap = getCssMetaMap(doc);
  for (const meta of metaMap.values()) meta.selected = false;
  rebuildDynamicHighlightStyles(doc);
}

/**
 * Generate CSS class name for a fallback <mark> highlight.
 */
export function getHighlightClassName(color: HighlightColor, id: string): string {
  return `thorium-highlight thorium-highlight-${color} thorium-highlight-${id}`;
}

/**
 * Generate inline styles for a fallback <mark> element.
 */
export function getHighlightStyles(color: HighlightColor): string {
  const bgColor = HIGHLIGHT_COLORS[color] ?? HIGHLIGHT_COLORS.yellow;

  return `
    background-color: ${bgColor} !important;
    color: inherit !important;
    display: inline !important;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
    cursor: pointer;
    position: relative;
    padding: 2px 0;
    border-radius: 2px;
    transition: background-color 0.2s ease;
  `.trim();
}

/**
 * Create a fallback <mark> element.
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
  if (hasNote) mark.setAttribute('data-has-note', 'true');
  mark.style.cssText = getHighlightStyles(color);
  if (hasNote) mark.style.borderBottom = '2px solid rgba(0, 0, 0, 0.3)';
  return mark;
}

/**
 * Wrap a range with fallback <mark> elements.
 */
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
      // Fallback: manual wrapping.
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

/**
 * Remove fallback <mark> elements.
 */
export function unwrapHighlight(highlightId: string, doc: Document): boolean {
  try {
    const marks = doc.querySelectorAll(`[data-highlight-id="${highlightId}"]`);

    marks.forEach(mark => {
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

/**
 * Update fallback <mark> color.
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
      if (oldColor) htmlMark.classList.remove(`thorium-highlight-${oldColor}`);
      htmlMark.classList.add(`thorium-highlight-${newColor}`);
      htmlMark.setAttribute('data-highlight-color', newColor);
      htmlMark.style.cssText = getHighlightStyles(newColor);
      if (htmlMark.hasAttribute('data-has-note')) htmlMark.style.borderBottom = '2px solid rgba(0, 0, 0, 0.3)';
    });

    return marks.length > 0;
  } catch (error) {
    console.error('Failed to update highlight color:', error);
    return false;
  }
}

/**
 * Update fallback <mark> note indicator.
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
 * Inject base CSS styles into iframe.
 */
export function injectHighlightStyles(doc: Document): void {
  if (doc.getElementById('thorium-highlight-styles')) return;

  const style = doc.createElement('style');
  style.id = 'thorium-highlight-styles';
  style.textContent = `
    .thorium-highlight {
      position: relative;
      cursor: pointer;
      padding: 2px 0;
      border-radius: 2px;
      color: inherit !important;
      display: inline !important;
      -webkit-box-decoration-break: clone;
      box-decoration-break: clone;
      transition: background-color 0.2s ease, opacity 0.2s ease;
    }

    .thorium-highlight:hover { opacity: 0.8; }
    .thorium-highlight-yellow { background-color: ${HIGHLIGHT_COLORS.yellow} !important; }
    .thorium-highlight-green { background-color: ${HIGHLIGHT_COLORS.green} !important; }
    .thorium-highlight-blue { background-color: ${HIGHLIGHT_COLORS.blue} !important; }
    .thorium-highlight-pink { background-color: ${HIGHLIGHT_COLORS.pink} !important; }
    .thorium-highlight-orange { background-color: ${HIGHLIGHT_COLORS.orange} !important; }
    .thorium-highlight-purple { background-color: ${HIGHLIGHT_COLORS.purple} !important; }
    .thorium-highlight[data-has-note="true"] { border-bottom: 2px solid rgba(0, 0, 0, 0.3); }
    .thorium-highlight.selected { outline: 2px solid rgba(0, 0, 0, 0.4); outline-offset: 2px; }
  `;

  doc.head.appendChild(style);
}

export const removeHighlightMark = unwrapHighlight;
export const toggleHighlightNoteIndicator = updateHighlightNoteIndicator;

/**
 * Select a highlight in both rendering modes.
 */
export function selectHighlightMark(highlightId: string, doc: Document): void {
  deselectAllHighlights(doc);
  selectCssHighlight(highlightId, doc);

  const marks = doc.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
  marks.forEach(mark => (mark as HTMLElement).classList.add('selected'));
}

/**
 * Deselect highlights in both rendering modes.
 */
export function deselectAllHighlights(doc: Document): void {
  deselectAllCssHighlights(doc);
  const selectedMarks = doc.querySelectorAll('.thorium-highlight.selected');
  selectedMarks.forEach(mark => (mark as HTMLElement).classList.remove('selected'));
}

/**
 * Remove every rendered highlight owned by this system from a document.
 */
export function clearRenderedHighlights(doc: Document): void {
  removeAllCssHighlights(doc);
  const marks = Array.from(doc.querySelectorAll('[data-highlight-id]'));
  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
  doc.body?.normalize();
}

/**
 * Get highlight ID from a fallback <mark> element.
 */
export function getHighlightIdFromElement(element: Element): string | null {
  const mark = element.closest('.thorium-highlight');
  return mark ? mark.getAttribute('data-highlight-id') : null;
}
