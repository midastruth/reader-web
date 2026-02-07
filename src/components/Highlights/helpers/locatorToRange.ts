/**
 * Convert serialized range back to DOM Range
 */

import type { SerializedRange, HighlightLocator } from '@/lib/types/highlights';

/**
 * Find a node using XPath
 */
function getNodeByXPath(xpath: string, doc: Document): Node | null {

  const root = doc.body || doc.documentElement;

  if (!root) return null;



  const candidates: string[] = [];



  const addCandidate = (value: string) => {

    if (!value) return;

    if (!candidates.includes(value)) {

      candidates.push(value);

    }

  };



  const toNamespaceAgnosticXPath = (path: string) => {

    return path

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

  };



  addCandidate(xpath);

  if (xpath.startsWith('/')) {

    addCandidate(xpath.replace(/^\/+/, ''));

  }



  addCandidate(toNamespaceAgnosticXPath(xpath));

  if (xpath.startsWith('/')) {

    addCandidate(toNamespaceAgnosticXPath(xpath.replace(/^\/+/, '')));

  }



  for (const candidate of candidates) {

    try {

      const result = doc.evaluate(

        candidate,

        root,

        null,

        XPathResult.FIRST_ORDERED_NODE_TYPE,

        null

      );



      if (result.singleNodeValue) return result.singleNodeValue;

    } catch (error) {

      console.warn('XPath evaluation failed:', candidate, error);

    }

  }



  return null;

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
  const ownerDocument = root.nodeType === Node.DOCUMENT_NODE

    ? (root as Document)

    : root.ownerDocument;



  if (!ownerDocument) return null;



  const walker = ownerDocument.createTreeWalker(

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

        const restoredText = range.toString();

        if (!range.collapsed && restoredText.trim().length > 0) {

          return range;

        }

      } catch (error) {

        if (process.env.NODE_ENV !== 'production') {

          console.warn('Failed to set range with XPath nodes:', error);

        }

      }

    }

    // Fallback: text-based matching

    const searchRoot = doc.body || doc.documentElement;


    if (!searchRoot) {

      return null;

    }



    const result = findTextNodeByContent(

      searchRoot,

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

    if (process.env.NODE_ENV !== 'production') {

      console.warn('Could not restore highlight range');

    }

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

  // If it's fully within one text node, we can return as-is.

  if (

    range.startContainer === range.endContainer &&

    range.startContainer.nodeType === Node.TEXT_NODE

  ) {

    ranges.push(range.cloneRange());

    return ranges;

  }


  // For complex multi-element ranges, we'll need to split them

  // This is a simplified version - full implementation would handle all edge cases

  const ownerDocument =

    (range.commonAncestorContainer.nodeType === Node.DOCUMENT_NODE

      ? (range.commonAncestorContainer as Document)

      : range.commonAncestorContainer.ownerDocument) ||

    range.startContainer.ownerDocument ||

    range.endContainer.ownerDocument;



  if (!ownerDocument) {

    return [];

  }



  const root =

    range.commonAncestorContainer.nodeType === Node.TEXT_NODE

      ? range.commonAncestorContainer.parentNode || range.commonAncestorContainer

      : range.commonAncestorContainer;



  const walker = ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {

    acceptNode: (node) => {

      try {

        if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;

      } catch {

        return NodeFilter.FILTER_REJECT;

      }



      const text = node.textContent ?? '';

      if (text.trim().length === 0) return NodeFilter.FILTER_REJECT;



      return NodeFilter.FILTER_ACCEPT;

    },

  });



  let node: Node | null;
  while ((node = walker.nextNode())) {
    const nodeRange = ownerDocument.createRange();

    nodeRange.selectNodeContents(node);

    // Adjust for start/end boundaries
    if (node === range.startContainer) {
      nodeRange.setStart(node, range.startOffset);
    }
    if (node === range.endContainer) {
      nodeRange.setEnd(node, range.endOffset);
    }

    if (nodeRange.collapsed) continue;
    if (nodeRange.toString().trim().length === 0) continue;

    ranges.push(nodeRange);
  }

  return ranges;

}

