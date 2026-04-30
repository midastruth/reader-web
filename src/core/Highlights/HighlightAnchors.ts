/**
 * Anchor conversion and restoration helpers.
 */

import type { HighlightLocator, SerializedRange } from '@/lib/types/highlights';
import {
  canRestoreRange,
  isValidTextRange,
  normalizeRange,
  rangeToLocator,
  serializeRange,
} from '@/components/Highlights/helpers/rangeToLocator';
import { locatorToRange, locatorToRanges } from '@/components/Highlights/helpers/locatorToRange';
import type { TextSelection } from './models';

export class HighlightAnchors {
  static isValidSelection(selection: TextSelection | null | undefined): selection is TextSelection {
    return !!selection?.range && isValidTextRange(selection.range);
  }

  static normalize(range: Range): Range {
    return normalizeRange(range);
  }

  static toLocator(selection: TextSelection, normalizedRange = normalizeRange(selection.range)): HighlightLocator {
    const progression = selection.progression ?? selection.position;
    const locator = rangeToLocator(
      normalizedRange,
      selection.href,
      progression,
      selection.readingOrderPosition
    );

    if (selection.totalProgression !== undefined) {
      locator.locations.totalProgression = selection.totalProgression;
    }

    return locator;
  }

  static serialize(range: Range): SerializedRange {
    return serializeRange(range);
  }

  static restoreAll(range: SerializedRange, locator: HighlightLocator, doc: Document): Range[] {
    return locatorToRanges(range, locator, doc);
  }

  static restore(range: SerializedRange, locator: HighlightLocator, doc: Document): Range | null {
    return locatorToRange(range, locator, doc);
  }

  static canRestore(range: SerializedRange, doc: Document): boolean {
    return canRestoreRange(range, doc);
  }
}

export default HighlightAnchors;
