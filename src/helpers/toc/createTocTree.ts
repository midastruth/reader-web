import { TocItem } from "@/models/toc";
import { Link, Locator } from "@readium/shared";

/**
 * Recursively adds an ID to each Link in a list of Links, and returns a new list of TocItems.
 * @param links - The list of Links to process.
 * @param idGenerator - A function that generates a unique ID for each Link.
 * @returns A new list of TocItems with an id added to each.
 */
export function createTocTree(
  links: Link[],
  idGenerator: () => string,
  positionsList?: Locator[]
): TocItem[] {
  return links.map((link) => {
    // Generate a new ID for the current Link
    const newId = idGenerator();

    // Create a plain object for compatibility with Tree components
    const treeNode: TocItem = {
      id: newId, 
      href: link.href,
      title: link.title,
      position: positionsList?.find((position) => position.href === link.href)?.locations.position
    };

    // Recursively process children if they exist
    if (link.children) {
      treeNode.children = createTocTree(link.children.items, idGenerator, positionsList);
    }

    return treeNode;
  });
}
