/**
 * Picker shown when the user clicks on a spot covered by multiple highlights.
 *
 * Renders a stacked list of candidate highlights; selecting one promotes it
 * to the context menu via `onChoose`.
 */

import React from 'react';
import type { Highlight } from '@/lib/types/highlights';
import { HIGHLIGHT_PALETTE } from '../constants/palette';
import styles from './OverlapChooser.module.css';

export interface OverlapChooserProps {
  highlights: Highlight[];
  position: { x: number; y: number };
  onChoose: (highlight: Highlight) => void;
}

const TEXT_PREVIEW_LIMIT = 80;

function previewText(text: string): string {
  return text.length > TEXT_PREVIEW_LIMIT
    ? `${text.slice(0, TEXT_PREVIEW_LIMIT)}…`
    : text;
}

export function OverlapChooser({ highlights, position, onChoose }: OverlapChooserProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.content}>
        <div className={styles.label}>选择高亮</div>
        {highlights.map((highlight) => (
          <button
            key={highlight.id}
            className={styles.item}
            onClick={() => onChoose(highlight)}
          >
            <span
              className={styles.color}
              style={{ backgroundColor: HIGHLIGHT_PALETTE[highlight.color].bg }}
            />
            <span className={styles.text}>
              {previewText(highlight.locator.text.highlight)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
