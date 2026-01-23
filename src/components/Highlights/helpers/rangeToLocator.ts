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
      const tagName = element.tagName.toLowerCase();

      // Find index among siblings with same tag name
      let index = 1;
      let sibling = element.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE &&
            (sibling as Element).tagName.toLowerCase() === tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      segments.unshift(`${tagName}[${index}]`);
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

  return '/' + segments.join('/');
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
 * Convert a DOM Range to a Readium Locator with serialized range
 */
export function rangeToLocator(
  range: Range,
  href: string,
  progression?: number,
  position?: number
): {
  locator: HighlightLocator;
  range: SerializedRange;
} {
  // Get the root node (usually the iframe document body)
  const root = range.commonAncestorContainer.ownerDocument?.body ||
               range.commonAncestorContainer;

  // Serialize the range
  const serializedRange: SerializedRange = {
    startContainerPath: getXPathForNode(range.startContainer, root),
    startOffset: range.startOffset,
    endContainerPath: getXPathForNode(range.endContainer, root),
    endOffset: range.endOffset,
  };

  // Extract text context
  const textContext = getTextContext(range);

  // Build locator
  const locator: HighlightLocator = {
    href,
    locations: {
      progression,
      position,
    },
    text: textContext,
  };

  return { locator, range: serializedRange };
}

/**
 * Validate if a serialized range can be restored
 */
export function canRestoreRange(
  serializedRange: SerializedRange,
  doc: Document
): boolean {
  try {
    const startNode = doc.evaluate(
      serializedRange.startContainerPath,
      doc.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    const endNode = doc.evaluate(
      serializedRange.endContainerPath,
      doc.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    return startNode !== null && endNode !== null;
  } catch (error) {
    console.warn('Cannot restore range:', error);
    return false;
  }
}
