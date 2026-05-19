/**
 * Single source of truth for highlight palette presentation.
 *
 * The runtime tinting used inside the reader iframe lives in
 * core/Highlights/dom/injectStyles.ts (HIGHLIGHT_COLORS). The values here
 * cover the surrounding chrome — toolbar swatches, context-menu chips, note
 * editor accent borders, etc. — that is rendered in the main app document.
 *
 * Keep the `bg` values in sync with HIGHLIGHT_COLORS so the in-iframe
 * highlight color and the chrome swatch users click match visually.
 */

import { HighlightColor } from '@/lib/types/highlights';

export interface HighlightPaletteEntry {
  /** Background fill used for swatches / chips. Matches the in-iframe highlight color. */
  bg: string;
  /** Stronger accent (used for borders, focus rings, note-editor quote bars). */
  border: string;
  /** English display name. Wrap with `t('highlights.color.<color>', label)` for i18n. */
  label: string;
}

export const HIGHLIGHT_PALETTE: Record<HighlightColor, HighlightPaletteEntry> = {
  [HighlightColor.YELLOW]: {
    bg: 'rgba(255, 235, 0, 0.35)',
    border: 'rgba(234, 179, 8, 0.7)',
    label: 'Yellow',
  },
  [HighlightColor.GREEN]: {
    bg: 'rgba(165, 214, 167, 0.35)',
    border: 'rgba(74, 168, 109, 0.7)',
    label: 'Green',
  },
  [HighlightColor.BLUE]: {
    bg: 'rgba(144, 202, 249, 0.35)',
    border: 'rgba(59, 130, 246, 0.7)',
    label: 'Blue',
  },
  [HighlightColor.RED]: {
    bg: 'rgba(255, 138, 128, 0.35)',
    border: 'rgba(239, 68, 68, 0.7)',
    label: 'Red',
  },
  [HighlightColor.PURPLE]: {
    bg: 'rgba(206, 147, 216, 0.35)',
    border: 'rgba(139, 92, 246, 0.7)',
    label: 'Purple',
  },
  [HighlightColor.GRAY]: {
    bg: 'rgba(180, 180, 180, 0.35)',
    border: 'rgba(120, 120, 120, 0.7)',
    label: 'Gray',
  },
};

/** Ordered list, suitable for rendering swatch rows in toolbars/menus. */
export const HIGHLIGHT_COLOR_ORDER: HighlightColor[] = [
  HighlightColor.YELLOW,
  HighlightColor.GREEN,
  HighlightColor.BLUE,
  HighlightColor.RED,
  HighlightColor.PURPLE,
  HighlightColor.GRAY,
];

/** Convenience helper: array of `{ color, ...entry }` for `.map()` rendering. */
export const HIGHLIGHT_COLOR_OPTIONS = HIGHLIGHT_COLOR_ORDER.map((color) => ({
  color,
  ...HIGHLIGHT_PALETTE[color],
}));
