/**
 * Static stylesheet injected into each reader iframe.
 *
 * The CSS Custom Highlight rules are appended dynamically per-highlight by
 * cssHighlights.ts. This file owns the fallback `<mark>` styles and the
 * shared color tokens used by both renderers.
 */

import type { HighlightColor } from '@/lib/types/highlights';

/**
 * Base background color (35% opacity) per highlight color.
 *
 * Used by both the CSS Custom Highlight renderer and the legacy `<mark>` fallback.
 * Keep in sync with SELECTED_HIGHLIGHT_COLORS below.
 */
export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: 'rgba(255, 235, 0, 0.35)',
  green: 'rgba(165, 214, 167, 0.35)',
  blue: 'rgba(144, 202, 249, 0.35)',
  red: 'rgba(255, 138, 128, 0.35)',
  purple: 'rgba(206, 147, 216, 0.35)',
  gray: 'rgba(180, 180, 180, 0.35)',
};

/** Slightly stronger version used when a highlight is "selected" via CSS Highlight API. */
export const SELECTED_HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: 'rgba(255, 235, 0, 0.58)',
  green: 'rgba(165, 214, 167, 0.58)',
  blue: 'rgba(144, 202, 249, 0.58)',
  red: 'rgba(255, 138, 128, 0.58)',
  purple: 'rgba(206, 147, 216, 0.58)',
  gray: 'rgba(180, 180, 180, 0.58)',
};

/** Border used to indicate that a highlight has an attached note. */
export const NOTE_MARK_BORDER = '2px solid currentColor';

/** Inject the base stylesheet into an iframe document once. */
export function injectHighlightStyles(doc: Document): void {
  if (doc.getElementById('thorium-highlight-styles')) return;

  const style = doc.createElement('style');
  style.id = 'thorium-highlight-styles';
  style.textContent = `
    .thorium-highlight {
      position: relative;
      cursor: pointer;
      padding: 0;
      border-radius: 2px;
      color: inherit !important;
      display: inline !important;
      -webkit-box-decoration-break: clone;
      box-decoration-break: clone;
      transition: background-color 0.2s ease, opacity 0.2s ease;
    }

    .thorium-highlight:hover { opacity: 0.8; }
    .thorium-highlight-yellow { background-color: ${HIGHLIGHT_COLORS.yellow} !important; }
    .thorium-highlight-green { background-color: ${HIGHLIGHT_COLORS.green} !important; }
    .thorium-highlight-blue { background-color: ${HIGHLIGHT_COLORS.blue} !important; }
    .thorium-highlight-red { background-color: ${HIGHLIGHT_COLORS.red} !important; }
    .thorium-highlight-purple { background-color: ${HIGHLIGHT_COLORS.purple} !important; }
    .thorium-highlight-gray { background-color: ${HIGHLIGHT_COLORS.gray} !important; }
    .thorium-highlight[data-has-note="true"] { border-bottom: ${NOTE_MARK_BORDER}; }
    .thorium-highlight.selected { outline: 2px solid currentColor; outline-offset: 2px; }
  `;

  doc.head.appendChild(style);
}
