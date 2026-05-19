/**
 * Primary renderer: CSS Custom Highlight API.
 *
 * Paints highlight backgrounds without mutating the EPUB content DOM. Each
 * highlight gets its own named CSS Highlight entry and a matching `::highlight()`
 * rule appended to a single managed `<style>` element.
 *
 * Browsers without `CSS.highlights` should fall back to markFallback.ts.
 */

import type { Highlight, HighlightColor } from '@/lib/types/highlights';
import { normalizeHighlightColor } from '@/lib/types/highlights';
import { HIGHLIGHT_COLORS, SELECTED_HIGHLIGHT_COLORS } from './injectStyles';

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
      ? 'text-decoration-line: underline; text-decoration-color: currentColor; text-decoration-thickness: 2px; text-underline-offset: 0.18em;'
      : '';
    const selectedDecoration = meta.selected
      ? 'text-shadow: 0 0 0.01px currentColor, 0 0 2px currentColor;'
      : '';
    const selectedBg = meta.selected ? (SELECTED_HIGHLIGHT_COLORS[meta.color] ?? bg) : bg;

    rules.push(`::highlight(${meta.name}) { background-color: ${selectedBg}; color: inherit; ${noteDecoration} ${selectedDecoration} }`);
  }

  style.textContent = rules.join('\n');
}

/**
 * Render a highlight with the CSS Custom Highlight API.
 * Returns false when the browser does not support the API; the caller is
 * expected to fall back to the <mark>-wrapping renderer in that case.
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
    color: normalizeHighlightColor(highlight.color),
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

  meta.color = normalizeHighlightColor(highlight.color);
  meta.hasNote = !!highlight.note;
  rebuildDynamicHighlightStyles(doc);
  return true;
}

export function getCssHighlightIdsAtPoint(doc: Document, x: number, y: number): string[] {
  const PAD_Y = 4;
  const ids: string[] = [];

  for (const [id, meta] of getCssMetaMap(doc)) {
    for (const range of meta.ranges) {
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (x >= rect.left && x <= rect.right && y >= rect.top - PAD_Y && y <= rect.bottom + PAD_Y) {
          ids.push(id);
          break;
        }
      }
      if (ids.includes(id)) break;
    }
  }

  return ids;
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
