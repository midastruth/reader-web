/**
 * Convert serialized range back to DOM Range
 */

import type { SerializedRange, HighlightLocator } from '@/lib/types/highlights';

/**
 * Find a node using XPath
 */
function getNodeByXPath(xpath: string, doc: Document): Node | null {
  try {
    const result = doc.evaluate(
      xpath,
      doc.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  } catch (error) {
    console.warn('XPath evaluation failed:', xpath, error);
    return null;
  }
}

/**
 * Find text node containing specific text using fuzzy matching
 */
function findTextNodeByContent(
  root: Node,
  searchText: string,
  beforeContext?: string,
  afterContext?: string
): { node: Node; offset: number } | null {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null
  );

  let currentNode: Node | null;
  const normalizedSearch = searchText.trim().toLowerCase();

  while ((currentNode = walker.nextNode())) {
    const text = currentNode.textContent || '';
    const normalizedText = text.toLowerCase();

    const index = normalizedText.indexOf(normalizedSearch);
    if (index !== -1) {
      // Verify context if provided
      if (beforeContext || afterContext) {
        const before = text.slice(Math.max(0, index - 50), index).trim();
        const after = text.slice(index + searchText.length, index + searchText.length + 50).trim();

        const beforeMatch = !beforeContext || before.endsWith(beforeContext.trim());
        const afterMatch = !afterContext || after.startsWith(afterContext.trim());

        if (beforeMatch && afterMatch) {
          return { node: currentNode, offset: index };
        }
      } else {
        return { node: currentNode, offset: index };
      }
    }
  }

  return null;
}

/**
 * Restore a DOM Range from serialized range data
 */
export function locatorToRange(
  serializedRange: SerializedRange,
  locator: HighlightLocator,
  doc: Document
): Range | null {
  try {
    // Try XPath-based restoration first
    const startNode = getNodeByXPath(serializedRange.startContainerPath, doc);
    const endNode = getNodeByXPath(serializedRange.endContainerPath, doc);

    if (startNode && endNode) {
      const range = doc.createRange();

      try {
        range.setStart(startNode, serializedRange.startOffset);
        range.setEnd(endNode, serializedRange.endOffset);

        // Verify the restored range matches the expected text
        const restoredText = range.toString();
        if (restoredText === locator.text.highlight) {
          return range;
        }

        // If text doesn't match exactly but is close, still accept
        if (restoredText.trim() === locator.text.highlight.trim()) {
          return range;
        }
      } catch (error) {
        console.warn('Failed to set range with XPath nodes:', error);
      }
    }

    // Fallback: text-based matching
    console.warn('XPath restoration failed, falling back to text search');

    const result = findTextNodeByContent(
      doc.body,
      locator.text.highlight,
      locator.text.before,
      locator.text.after
    );

    if (result) {
      const range = doc.createRange();
      range.setStart(result.node, result.offset);
      range.setEnd(result.node, result.offset + locator.text.highlight.length);
      return range;
    }

    console.error('Could not restore highlight:', locator.text.highlight);
    return null;

  } catch (error) {
    console.error('Error restoring range:', error);
    return null;
  }
}

/**
 * Split a range that crosses element boundaries into multiple ranges
 * Useful for handling highlights that span across pages in paginated mode
 */
export function splitRangeByElements(range: Range): Range[] {
  const ranges: Range[] = [];

  if (range.startContainer === range.endContainer) {
    ranges.push(range.cloneRange());
    return ranges;
  }

  // For complex multi-element ranges, we'll need to split them
  // This is a simplified version - full implementation would handle all edge cases
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        return range.intersectsNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);

    // Adjust for start/end boundaries
    if (node === range.startContainer) {
      nodeRange.setStart(node, range.startOffset);
    }
    if (node === range.endContainer) {
      nodeRange.setEnd(node, range.endOffset);
    }

    if (!nodeRange.collapsed) {
      ranges.push(nodeRange);
    }
  }

  return ranges.length > 0 ? ranges : [range.cloneRange()];
}
