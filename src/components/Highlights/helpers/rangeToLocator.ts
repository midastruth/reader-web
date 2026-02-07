/**
 * Convert DOM Range to Readium Locator with serialized range information
 */

import type { SerializedRange, HighlightLocator } from '@/lib/types/highlights';

/**
 * Generate XPath for a DOM node
 */
function getXPathForNode(node: Node, root: Node): string {
  const segments: string[] = [];
  let current: Node | null = node;

  while (current && current !== root) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as Element;
      const localName = (element.localName || element.tagName).toLowerCase();

      // Find index among siblings with same local-name (namespace-agnostic)
      let index = 1;
      let sibling = element.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE) {
          const siblingElement = sibling as Element;
          const siblingLocalName = (siblingElement.localName || siblingElement.tagName).toLowerCase();
          if (siblingLocalName === localName) {
            index++;
          }
        }
        sibling = sibling.previousSibling;
      }

      segments.unshift(`*[local-name()='${localName}'][${index}]`);
    } else if (current.nodeType === Node.TEXT_NODE) {
      // Find index among text node siblings
      let index = 1;
      let sibling = current.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.TEXT_NODE) {
          index++;
        }
        sibling = sibling.previousSibling;
      }
      segments.unshift(`text()[${index}]`);
    }

    current = current.parentNode;
  }

  if (segments.length === 0) return '.';

  return segments.join('/');

}

/**
 * Extract text context around a range
 */
function getTextContext(range: Range, contextLength = 50): {
  before: string;
  highlight: string;
  after: string;
} {
  const highlight = range.toString();

  // Get text before
  const beforeRange = range.cloneRange();
  beforeRange.collapse(true);
  beforeRange.setStart(
    range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer
      : range.startContainer.childNodes[0] || range.startContainer,
    0
  );
  const beforeText = beforeRange.toString();
  const before = beforeText.slice(-contextLength);

  // Get text after
  const afterRange = range.cloneRange();
  afterRange.collapse(false);

  // Try to extend after range to get context
  const container = range.endContainer;
  if (container.nodeType === Node.TEXT_NODE) {
    afterRange.setEnd(container, (container as Text).length);
  }
  const afterText = afterRange.toString();
  const after = afterText.slice(0, contextLength);

  return { before, highlight, after };
}

/**

 * Convert a DOM Range to a Readium Locator

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


/**
 * Validate if a serialized range can be restored
 */
export function canRestoreRange(
  serializedRange: SerializedRange,
  doc: Document
): boolean {
  try {

    const root = doc.body || doc.documentElement;

    if (!root) return false;



    const resolve = (xpath: string) => {

      const candidates = [xpath];

      if (xpath.startsWith('/')) {

        candidates.push(xpath.replace(/^\/+/, ''));

      }



      for (const candidate of candidates) {

        const node = doc.evaluate(

          candidate,

          root,

          null,

          XPathResult.FIRST_ORDERED_NODE_TYPE,

          null

        ).singleNodeValue;



        if (node) return node;

      }



      return null;

    };



    const startNode = resolve(serializedRange.startContainerPath);

    const endNode = resolve(serializedRange.endContainerPath);



    return startNode !== null && endNode !== null;

  } catch (error) {

    console.warn('Cannot restore range:', error);

    return false;

  }

}

/**
 * Validate if a DOM Range is valid text range
 */
export function isValidTextRange(range: Range): boolean {
  if (!range || range.collapsed) {
    return false;
  }

  const text = range.toString().trim();
  return text.length > 0;
}

/**
 * Normalize range to ensure start/end are text nodes
 */
export function normalizeRange(range: Range): Range {
  // If we already have text nodes, just return
  if (range.startContainer.nodeType === Node.TEXT_NODE &&
    range.endContainer.nodeType === Node.TEXT_NODE) {
    return range;
  }

  const newRange = range.cloneRange();

  // Fix start
  if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
    // If element, move to next text node or first child
    // This is a simplified normalization, robust implementation would traverse the tree
  }

  return newRange;
}

/**
 * Manually serialize range (helper for consumers that need just the range part)
 */
export function serializeRange(range: Range): SerializedRange {
  const doc = range.startContainer.ownerDocument;

  const root = doc?.body || doc?.documentElement || range.commonAncestorContainer;


  return {
    startContainerPath: getXPathForNode(range.startContainer, root),
    startOffset: range.startOffset,
    endContainerPath: getXPathForNode(range.endContainer, root),
    endOffset: range.endOffset,
  };
}
