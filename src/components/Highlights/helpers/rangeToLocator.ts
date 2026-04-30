/**
 * Convert DOM Range to Readium Locator and Obsidian-style block-offset anchors.
 */

import type { BlockRangePart, SerializedRange, HighlightLocator, LegacySerializedRange } from '@/lib/types/highlights';

const TEXT_BLOCK_SPLIT_TAGS = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE',
  'FIGCAPTION', 'TD', 'TH', 'PRE'
]);

/**
 * Generate a namespace-agnostic XPath for a DOM node, relative to root.
 */
function getXPathForNode(node: Node, root: Node): string {
  const segments: string[] = [];
  let current: Node | null = node;

  while (current && current !== root) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as Element;
      const localName = (element.localName || element.tagName).toLowerCase();

      let index = 1;
      let sibling = element.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE) {
          const siblingElement = sibling as Element;
          const siblingLocalName = (siblingElement.localName || siblingElement.tagName).toLowerCase();
          if (siblingLocalName === localName) index++;
        }
        sibling = sibling.previousSibling;
      }

      segments.unshift(`*[local-name()='${localName}'][${index}]`);
    } else if (current.nodeType === Node.TEXT_NODE) {
      let index = 1;
      let sibling = current.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.TEXT_NODE) index++;
        sibling = sibling.previousSibling;
      }
      segments.unshift(`text()[${index}]`);
    }

    current = current.parentNode;
  }

  return segments.length === 0 ? '.' : segments.join('/');
}

function getRoot(doc: Document): Element {
  return doc.body || doc.documentElement;
}

function getClosestTextBlock(node: Node | null, doc: Document): Element | null {
  let current: Node | null = node;
  if (current?.nodeType === Node.TEXT_NODE) current = current.parentElement;

  while (current && current !== doc.body && current !== doc.documentElement) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as Element;
      const tag = el.tagName.toUpperCase();
      if (TEXT_BLOCK_SPLIT_TAGS.has(tag)) {
        // Prefer semantic wrappers for common EPUB/article markup.
        if (tag === 'P') {
          const parentTag = el.parentElement?.tagName.toUpperCase();
          if (parentTag === 'LI' || parentTag === 'BLOCKQUOTE' || parentTag === 'FIGCAPTION') {
            return el.parentElement;
          }
        }
        return el;
      }
    }
    current = current.parentNode;
  }

  return doc.body || doc.documentElement;
}

function findFirstTextNode(element: Element): Text | null {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

function findLastTextNode(element: Element): Text | null {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  let node: Node | null;
  while ((node = walker.nextNode())) last = node as Text;
  return last;
}

function getTextOffset(container: Element, targetNode: Node, targetOffset: number): number {
  const walker = container.ownerDocument.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const textLength = node.textContent?.length || 0;
    if (node === targetNode) {
      return offset + Math.max(0, Math.min(targetOffset, textLength));
    }
    offset += textLength;
  }

  return offset;
}

function compareElementsInDocumentOrder(a: Element, b: Element): number {
  if (a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

/**
 * Split a user selection into stable block-offset parts.
 */
export function rangeToBlockParts(range: Range): BlockRangePart[] {
  if (!range || range.collapsed) return [];

  const doc = range.startContainer.ownerDocument || range.endContainer.ownerDocument;
  if (!doc) return [];

  const root = getRoot(doc);
  const textBlocks = new Set<Element>();
  const searchRoot = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
    ? range.commonAncestorContainer.parentElement || root
    : range.commonAncestorContainer;

  const walker = doc.createTreeWalker(searchRoot, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      try {
        if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
      } catch {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.textContent || node.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const block = getClosestTextBlock(node, doc);
    if (block) textBlocks.add(block);
  }

  // If the walker missed a simple same-text-node selection, recover from the boundaries.
  if (textBlocks.size === 0) {
    const block = getClosestTextBlock(range.startContainer, doc);
    if (block) textBlocks.add(block);
  }

  const blocks = Array.from(textBlocks).sort(compareElementsInDocumentOrder);
  const parts: BlockRangePart[] = [];

  for (const block of blocks) {
    const partRange = doc.createRange();

    let startContainer: Node = range.startContainer;
    let startOffset = range.startOffset;
    let endContainer: Node = range.endContainer;
    let endOffset = range.endOffset;

    if (!block.contains(startContainer)) {
      const firstText = findFirstTextNode(block);
      if (!firstText) continue;
      startContainer = firstText;
      startOffset = 0;
    }

    if (!block.contains(endContainer)) {
      const lastText = findLastTextNode(block);
      if (!lastText) continue;
      endContainer = lastText;
      endOffset = lastText.data.length;
    }

    try {
      partRange.setStart(startContainer, startOffset);
      partRange.setEnd(endContainer, endOffset);
    } catch {
      continue;
    }

    if (partRange.collapsed || partRange.toString().trim().length === 0) continue;

    const startTextOffset = getTextOffset(block, partRange.startContainer, partRange.startOffset);
    const endTextOffset = getTextOffset(block, partRange.endContainer, partRange.endOffset);

    if (endTextOffset <= startTextOffset) continue;

    parts.push({
      blockPath: getXPathForNode(block, root),
      startOffset: startTextOffset,
      endOffset: endTextOffset,
      text: partRange.toString(),
    });
  }

  return parts;
}

/**
 * Extract text context around a range.
 */
function getTextContext(range: Range, contextLength = 80): {
  before: string;
  highlight: string;
  after: string;
} {
  const doc = range.startContainer.ownerDocument || range.endContainer.ownerDocument;
  const root = doc?.body || doc?.documentElement || range.commonAncestorContainer;
  const highlight = range.toString();

  try {
    const beforeRange = range.cloneRange();
    beforeRange.selectNodeContents(root);
    beforeRange.setEnd(range.startContainer, range.startOffset);

    const afterRange = range.cloneRange();
    afterRange.selectNodeContents(root);
    afterRange.setStart(range.endContainer, range.endOffset);

    return {
      before: beforeRange.toString().slice(-contextLength),
      highlight,
      after: afterRange.toString().slice(0, contextLength),
    };
  } catch {
    return { before: '', highlight, after: '' };
  }
}

/**
 * Convert a DOM Range to a Readium Locator.
 */
export function rangeToLocator(
  range: Range,
  href: string,
  progression?: number,
  position?: number
): HighlightLocator {
  const textContext = getTextContext(range);

  return {
    href,
    locations: {
      progression,
      position,
    },
    text: textContext,
  };
}

function isLegacySerializedRange(serializedRange: SerializedRange): serializedRange is LegacySerializedRange {
  return 'startContainerPath' in serializedRange && 'endContainerPath' in serializedRange;
}

/**
 * Validate if a serialized range can be restored.
 */
export function canRestoreRange(
  serializedRange: SerializedRange,
  doc: Document
): boolean {
  try {
    const root = getRoot(doc);

    const resolve = (xpath: string) => {
      const candidates = xpath.startsWith('/') ? [xpath, xpath.replace(/^\/+/, '')] : [xpath];
      for (const candidate of candidates) {
        const node = doc.evaluate(candidate, root, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (node) return node;
      }
      return null;
    };

    if (serializedRange.type === 'block-offset') {
      return serializedRange.parts.some((part) => !!resolve(part.blockPath));
    }

    if (isLegacySerializedRange(serializedRange)) {
      return !!resolve(serializedRange.startContainerPath) && !!resolve(serializedRange.endContainerPath);
    }

    return false;
  } catch (error) {
    console.warn('Cannot restore range:', error);
    return false;
  }
}

/**
 * Validate if a DOM Range is valid text range.
 */
export function isValidTextRange(range: Range): boolean {
  if (!range || range.collapsed) return false;
  return range.toString().trim().length > 0;
}

/**
 * Normalize range to ensure start/end are text nodes where possible.
 */
export function normalizeRange(range: Range): Range {
  const normalized = range.cloneRange();
  const doc = range.startContainer.ownerDocument || range.endContainer.ownerDocument;
  if (!doc) return normalized;

  const rootCandidate = normalized.commonAncestorContainer.nodeType === Node.TEXT_NODE
    ? normalized.commonAncestorContainer.parentNode
    : normalized.commonAncestorContainer;
  const root = rootCandidate || doc.body || doc.documentElement;
  if (!root) return normalized;

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      try {
        if (!normalized.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
      } catch {
        return NodeFilter.FILTER_REJECT;
      }
      if ((node.textContent ?? '').trim().length === 0) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let firstText: Text | null = null;
  let lastText: Text | null = null;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    if (!firstText) firstText = textNode;
    lastText = textNode;
  }

  if (!firstText || !lastText) return normalized;

  if (normalized.startContainer.nodeType !== Node.TEXT_NODE) normalized.setStart(firstText, 0);
  if (normalized.endContainer.nodeType !== Node.TEXT_NODE) normalized.setEnd(lastText, lastText.data.length);

  return normalized;
}

/**
 * Serialize a range using the block-offset model. This intentionally avoids
 * text-node XPaths because those are unstable after rendering/highlight DOM
 * changes and across EPUB navigator reflows.
 */
export function serializeRange(range: Range): SerializedRange {
  const parts = rangeToBlockParts(range);

  if (parts.length > 0) {
    return {
      type: 'block-offset',
      parts,
    };
  }

  // Defensive legacy fallback for unusual documents without text blocks.
  const doc = range.startContainer.ownerDocument;
  const root = doc?.body || doc?.documentElement || range.commonAncestorContainer;

  return {
    type: 'dom-xpath',
    startContainerPath: getXPathForNode(range.startContainer, root),
    startOffset: range.startOffset,
    endContainerPath: getXPathForNode(range.endContainer, root),
    endOffset: range.endOffset,
  };
}
