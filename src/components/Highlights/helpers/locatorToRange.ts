/**
 * Convert serialized highlight anchors back to live DOM Ranges.
 */

import type { BlockSerializedRange, HighlightLocator, LegacySerializedRange, SerializedRange } from '@/lib/types/highlights';

function isLegacySerializedRange(serializedRange: SerializedRange): serializedRange is LegacySerializedRange {
  return 'startContainerPath' in serializedRange && 'endContainerPath' in serializedRange;
}

function isBlockSerializedRange(serializedRange: SerializedRange): serializedRange is BlockSerializedRange {
  return serializedRange.type === 'block-offset' && Array.isArray(serializedRange.parts);
}

/**
 * Find a node using XPath, accepting both legacy HTML-name and new
 * namespace-agnostic local-name() paths.
 */
function getNodeByXPath(xpath: string, doc: Document): Node | null {
  const root = doc.body || doc.documentElement;
  if (!root) return null;

  const candidates: string[] = [];

  const addCandidate = (value: string) => {
    if (value && !candidates.includes(value)) candidates.push(value);
  };

  const toNamespaceAgnosticXPath = (path: string) => path
    .split('/')
    .map((segment) => {
      if (!segment || segment === '.' || segment === '..') return segment;
      if (segment.startsWith('text()') || segment.startsWith('*[local-name()')) return segment;
      const match = segment.match(/^([a-zA-Z][\w-]*)\[(\d+)\]$/);
      if (!match) return segment;
      const [, name, index] = match;
      return `*[local-name()='${name.toLowerCase()}'][${index}]`;
    })
    .join('/');

  addCandidate(xpath);
  if (xpath.startsWith('/')) addCandidate(xpath.replace(/^\/+/, ''));
  addCandidate(toNamespaceAgnosticXPath(xpath));
  if (xpath.startsWith('/')) addCandidate(toNamespaceAgnosticXPath(xpath.replace(/^\/+/, '')));

  for (const candidate of candidates) {
    try {
      const result = doc.evaluate(candidate, root, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue) return result.singleNodeValue;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('XPath evaluation failed:', candidate, error);
    }
  }

  return null;
}

function findTextNodeAtOffset(element: Element, offset: number): { node: Node; offset: number } | null {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let currentOffset = 0;
  let lastTextNode: Node | null = null;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const textLength = node.textContent?.length || 0;
    if (currentOffset + textLength >= offset) {
      return { node, offset: Math.max(0, Math.min(offset - currentOffset, textLength)) };
    }
    lastTextNode = node;
    currentOffset += textLength;
  }

  if (lastTextNode) {
    return { node: lastTextNode, offset: lastTextNode.textContent?.length ?? 0 };
  }

  return null;
}

function rangeFromBlockOffsets(doc: Document, block: Element, startOffset: number, endOffset: number): Range | null {
  const start = findTextNodeAtOffset(block, startOffset);
  const end = findTextNodeAtOffset(block, endOffset);
  if (!start || !end) return null;

  try {
    const range = doc.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    if (range.collapsed || range.toString().trim().length === 0) return null;
    return range;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.warn('Failed to build block-offset range:', error);
    return null;
  }
}

/**
 * Find text using document-level fuzzy matching. This fallback can restore a
 * range even when the EPUB navigator produced a different DOM tree and the
 * stored XPath no longer resolves.
 */
function findRangeByContent(
  root: Element,
  searchText: string,
  beforeContext?: string,
  afterContext?: string
): Range | null {
  const doc = root.ownerDocument;
  const normalizedSearch = searchText.trim();
  if (!normalizedSearch) return null;

  const fullText = root.textContent || '';
  let index = fullText.indexOf(normalizedSearch);

  // Case-insensitive fallback for documents that normalize case/spacing.
  if (index === -1) {
    index = fullText.toLowerCase().indexOf(normalizedSearch.toLowerCase());
  }

  while (index !== -1) {
    const before = fullText.slice(Math.max(0, index - 80), index);
    const after = fullText.slice(index + normalizedSearch.length, index + normalizedSearch.length + 80);
    const beforeMatch = !beforeContext || before.endsWith(beforeContext.trim());
    const afterMatch = !afterContext || after.startsWith(afterContext.trim());

    if (beforeMatch && afterMatch) {
      const start = findTextNodeAtOffset(root, index);
      const end = findTextNodeAtOffset(root, index + normalizedSearch.length);
      if (start && end) {
        const range = doc.createRange();
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);
        return range.collapsed ? null : range;
      }
    }

    const nextStart = index + Math.max(1, normalizedSearch.length);
    index = fullText.indexOf(normalizedSearch, nextStart);
    if (index === -1) index = fullText.toLowerCase().indexOf(normalizedSearch.toLowerCase(), nextStart);
  }

  return null;
}

function legacyLocatorToRange(
  serializedRange: LegacySerializedRange,
  locator: HighlightLocator,
  doc: Document
): Range | null {
  const startNode = getNodeByXPath(serializedRange.startContainerPath, doc);
  const endNode = getNodeByXPath(serializedRange.endContainerPath, doc);

  if (startNode && endNode) {
    try {
      const range = doc.createRange();
      range.setStart(startNode, serializedRange.startOffset);
      range.setEnd(endNode, serializedRange.endOffset);
      if (!range.collapsed && range.toString().trim().length > 0) return range;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('Failed to set range with XPath nodes:', error);
    }
  }

  const root = doc.body || doc.documentElement;
  return root ? findRangeByContent(root, locator.text.highlight, locator.text.before, locator.text.after) : null;
}

/**
 * Restore all live DOM Ranges represented by a serialized highlight.
 */
export function locatorToRanges(
  serializedRange: SerializedRange,
  locator: HighlightLocator,
  doc: Document
): Range[] {
  try {
    if (isBlockSerializedRange(serializedRange)) {
      const ranges: Range[] = [];

      for (const part of serializedRange.parts) {
        const block = getNodeByXPath(part.blockPath, doc);
        if (block && block.nodeType === Node.ELEMENT_NODE) {
          const range = rangeFromBlockOffsets(doc, block as Element, part.startOffset, part.endOffset);
          if (range) ranges.push(range);
        }
      }

      if (ranges.length > 0) return ranges;
    }

    if (isLegacySerializedRange(serializedRange)) {
      const legacyRange = legacyLocatorToRange(serializedRange, locator, doc);
      if (legacyRange) return [legacyRange];
    }

    const root = doc.body || doc.documentElement;
    const fallbackRange = root ? findRangeByContent(root, locator.text.highlight, locator.text.before, locator.text.after) : null;
    return fallbackRange ? [fallbackRange] : [];
  } catch (error) {
    console.error('Error restoring range:', error);
    return [];
  }
}

/**
 * Backwards-compatible single-range helper.
 */
export function locatorToRange(
  serializedRange: SerializedRange,
  locator: HighlightLocator,
  doc: Document
): Range | null {
  return locatorToRanges(serializedRange, locator, doc)[0] ?? null;
}

/**
 * Split a range that crosses text nodes into multiple single-text-node ranges.
 * Used only by the legacy <mark> fallback renderer. The primary renderer uses
 * CSS Custom Highlight API and can consume the original ranges directly.
 */
export function splitRangeByElements(range: Range): Range[] {
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
