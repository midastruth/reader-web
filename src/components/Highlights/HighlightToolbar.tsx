/**
 * Floating toolbar shown after the user selects text in the reader.
 *
 * Lets the user pick a highlight color, attach a note, or hand the selection
 * off to the AI panel. The root element keeps the global `highlight-toolbar`
 * class so HighlightManager's outside-click dismissal logic can detect it
 * regardless of CSS-module hashing.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/lib/store';
import { HighlightColor } from '@/lib/types/highlights';
import { setActiveColor } from '@/lib/highlightsReducer';
import { HIGHLIGHT_COLOR_OPTIONS } from './constants/palette';
import type { AiAction } from '@/components/AI/AiChatPanel';
import styles from './HighlightToolbar.module.css';

export interface HighlightToolbarProps {
  position: { x: number; y: number };
  onColorSelect: (color: HighlightColor) => void;
  onAddNote: () => void;
  onAiQuery: (action: AiAction) => void;
  onClose: () => void;
}

const SAFE_MARGIN = 8;

export function HighlightToolbar({
  position,
  onColorSelect,
  onAddNote,
  onAiQuery,
  onClose,
}: HighlightToolbarProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const activeColor = useSelector((state: RootState) => state.highlights.activeColor);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [clampedX, setClampedX] = useState(position.x);

  // Clamp horizontal position so the toolbar always stays inside the viewport.
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const width = el.offsetWidth;
    const ideal = position.x - width / 2;
    const max = window.innerWidth - width - SAFE_MARGIN;
    setClampedX(Math.min(Math.max(SAFE_MARGIN, ideal), max));
  }, [position.x]);

  const handleColorClick = useCallback(
    (color: HighlightColor) => {
      dispatch(setActiveColor(color));
      onColorSelect(color);
    },
    [dispatch, onColorSelect]
  );

  const handleAiQueryClick = useCallback(
    (e: React.MouseEvent, action: AiAction) => {
      e.stopPropagation();
      onAiQuery(action);
    },
    [onAiQuery]
  );

  return (
    <div
      ref={toolbarRef}
      // The global class name is required: HighlightManager's outside-click
      // handler uses `target.closest('.highlight-toolbar')` to detect us.
      className={`highlight-toolbar ${styles.toolbar}`}
      style={{
        position: 'fixed',
        left: clampedX,
        top: position.y,
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.content}>
        <div className={styles.group}>
          {HIGHLIGHT_COLOR_OPTIONS.map(({ color, label, bg, border }) => (
            <button
              key={color}
              type="button"
              className={`${styles.colorBtn} ${activeColor === color ? styles.active : ''}`}
              style={{ backgroundColor: bg, borderColor: border }}
              onClick={() => handleColorClick(color)}
              title={t(`highlights.color.${color}`, label)}
              aria-label={t(`highlights.color.${color}`, label)}
            >
              <span className={styles.srOnly}>{label}</span>
            </button>
          ))}
        </div>

        <div className={styles.group}>
          <button
            type="button"
            className={styles.noteBtn}
            onClick={(e) => {
              e.stopPropagation();
              onAddNote();
            }}
            title={t('highlights.note.add', 'Add Note')}
            aria-label={t('highlights.note.add', 'Add Note')}
          >
            <span className={styles.noteIcon} aria-hidden="true">+</span>
            <span className={styles.noteText}>
              {t('highlights.note.add', 'Note')}
            </span>
          </button>

          <button
            type="button"
            className={styles.aiBtn}
            onClick={(e) => handleAiQueryClick(e, 'dictionary')}
            title={t('ai.dictionary', '查词')}
            aria-label={t('ai.dictionary', '查词')}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M1.5 2.5C1.5 2.5 3 2 6.5 2C10 2 11.5 2.5 11.5 2.5V10.5C11.5 10.5 10 10 6.5 10C3 10 1.5 10.5 1.5 10.5V2.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
              <line x1="6.5" y1="2" x2="6.5" y2="10" stroke="currentColor" strokeWidth="1.1"/>
              <line x1="3" y1="4.5" x2="6" y2="4.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.7"/>
              <line x1="3" y1="6.5" x2="6" y2="6.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </button>

          <button
            type="button"
            className={styles.aiBtn}
            onClick={(e) => handleAiQueryClick(e, 'analyze')}
            title={t('ai.analyze', '分析')}
            aria-label={t('ai.analyze', '分析')}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <line x1="1" y1="2" x2="9" y2="2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.65"/>
              <line x1="1" y1="4.5" x2="9" y2="4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.65"/>
              <line x1="1" y1="7" x2="5.5" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.65"/>
              <circle cx="9.5" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="11.3" y1="11.3" x2="12.8" y2="12.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>

          <button
            type="button"
            className={styles.aiBtn}
            onClick={(e) => handleAiQueryClick(e, 'ask')}
            title={t('ai.query', 'READER AI')}
            aria-label={t('ai.query', 'READER AI')}
          >
            <span className={styles.aiIcon} aria-hidden="true">✦</span>
            <span className={styles.aiText}>AI</span>
          </button>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title={t('highlights.toolbar.close', 'Close')}
            aria-label={t('highlights.toolbar.close', 'Close')}
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
