/**
 * Popup shown when an existing highlight is clicked.
 *
 * Lets the user change color, add/edit a note, or delete the highlight.
 * Persistence is delegated to HighlightService; the parent receives optional
 * callbacks so it can rerender the highlight in the iframe.
 */

import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { AppDispatch } from '@/lib/store';
import { HighlightColor, type Highlight } from '@/lib/types/highlights';
import { updateHighlight, deleteHighlight, openNoteEditor, setError } from '@/lib/highlightsReducer';
import { highlightService } from '@/core/Highlights';
import { HIGHLIGHT_COLOR_OPTIONS } from './constants/palette';
import styles from './HighlightContextMenu.module.css';

export interface HighlightContextMenuProps {
  highlight: Highlight;
  position: { x: number; y: number };
  onClose: () => void;
  onColorChange?: (color: HighlightColor) => void;
  onDelete?: () => void;
}

export function HighlightContextMenu({
  highlight,
  position,
  onClose,
  onColorChange,
  onDelete,
}: HighlightContextMenuProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();

  const handleColorChange = useCallback(
    async (color: HighlightColor) => {
      try {
        const updated = await highlightService.update(highlight, { color });
        dispatch(updateHighlight({ id: highlight.id, updates: updated }));
        onColorChange?.(color);
        onClose();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        dispatch(setError(`Failed to update highlight color: ${message}`));
        console.error('Failed to update highlight color:', error);
      }
    },
    [highlight, dispatch, onColorChange, onClose]
  );

  const handleNoteAction = useCallback(() => {
    dispatch(openNoteEditor(highlight.id));
    onClose();
  }, [highlight.id, dispatch, onClose]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm(t('highlights.delete.confirm', 'Delete this highlight?'))) return;

    try {
      await highlightService.delete(highlight);
      dispatch(deleteHighlight(highlight.id));
      onDelete?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(setError(`Failed to delete highlight: ${message}`));
      console.error('Failed to delete highlight:', error);
    }
  }, [highlight, dispatch, onDelete, onClose, t]);

  const noteLabel = highlight.note
    ? t('highlights.note.edit', 'Edit Note')
    : t('highlights.note.add', 'Add Note');

  return (
    <div
      className={styles.menu}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.label}>
            {t('highlights.changeColor', 'Change Color')}
          </div>
          <div className={styles.colors}>
            {HIGHLIGHT_COLOR_OPTIONS.map(({ color, label, bg }) => {
              const active = highlight.color === color;
              return (
                <button
                  key={color}
                  className={`${styles.colorBtn} ${active ? styles.active : ''}`}
                  style={{ backgroundColor: bg }}
                  onClick={() => handleColorChange(color)}
                  title={t(`highlights.color.${color}`, label)}
                  aria-label={t(`highlights.color.${color}`, label)}
                >
                  {active && <span className={styles.checkMark}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.section}>
          <button className={styles.actionBtn} onClick={handleNoteAction}>
            <span className={styles.icon}>✎</span>
            {noteLabel}
          </button>

          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={handleDelete}
          >
            <span className={styles.icon}>⌫</span>
            {t('highlights.delete', 'Delete')}
          </button>
        </div>

        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
