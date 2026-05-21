/**
 * Modal note editor for the currently-edited highlight.
 *
 * State is driven from Redux (`isNoteEditorOpen` + `editingNoteId`). Changes
 * to the textarea are auto-saved with a 500 ms debounce; closing the modal
 * flushes the debounce so the latest text is always persisted.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import debounce from 'debounce';
import type { AppDispatch, RootState } from '@/lib/store';
import type { Highlight } from '@/lib/types/highlights';
import { updateHighlight, closeNoteEditor, setError } from '@/lib/highlightsReducer';
import { highlightService } from '@/core/Highlights';
import { HIGHLIGHT_PALETTE } from './constants/palette';
import styles from './HighlightNote.module.css';

export interface HighlightNoteProps {
  onHighlightUpdated?: (highlight: Highlight) => void;
}

const PREVIEW_LIMIT = 150;
const AUTO_SAVE_DEBOUNCE_MS = 500;

export function HighlightNote({ onHighlightUpdated }: HighlightNoteProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();

  const isOpen = useSelector((state: RootState) => state.highlights.isNoteEditorOpen);
  const editingNoteId = useSelector((state: RootState) => state.highlights.editingNoteId);
  const highlights = useSelector((state: RootState) => state.highlights.currentBookHighlights);
  const highlight = highlights.find((h) => h.id === editingNoteId);

  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editingNoteIdRef = useRef<string | null>(null);

  // Sync local text only when switching to a different highlight — never on the
  // same highlight's save-triggered update, to avoid clobbering in-flight typing.
  useEffect(() => {
    if (!highlight) return;
    if (editingNoteIdRef.current !== highlight.id) {
      editingNoteIdRef.current = highlight.id;
      setNoteText(highlight.note || '');
    }
  }, [highlight]);

  // Focus the textarea on open.
  useEffect(() => {
    if (isOpen && textareaRef.current) textareaRef.current.focus();
  }, [isOpen]);

  const saveNote = useCallback(
    async (text: string) => {
      if (!highlight) return;

      setIsSaving(true);
      try {
        const updated = await highlightService.update(highlight, { note: text || undefined });
        dispatch(updateHighlight({ id: highlight.id, updates: updated }));
        onHighlightUpdated?.(updated);
        setLastSaved(Date.now());
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        dispatch(setError(`Failed to save note: ${message}`));
        console.error('Failed to save note:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [highlight, dispatch, onHighlightUpdated]
  );

  const debouncedSave = useMemo(
    () => debounce((text: string) => saveNote(text), AUTO_SAVE_DEBOUNCE_MS),
    [saveNote]
  );

  useEffect(() => () => debouncedSave.clear(), [debouncedSave]);

  const handleNoteChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setNoteText(text);
      debouncedSave(text);
    },
    [debouncedSave]
  );

  const handleClose = useCallback(() => {
    debouncedSave.flush();
    dispatch(closeNoteEditor());
  }, [debouncedSave, dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    },
    [handleClose]
  );

  if (!isOpen || !highlight) return null;

  const highlightText = highlight.locator.text.highlight;
  const displayText =
    highlightText.length > PREVIEW_LIMIT
      ? `${highlightText.substring(0, PREVIEW_LIMIT)}...`
      : highlightText;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>
            {highlight.note
              ? t('highlights.note.edit', 'Edit Note')
              : t('highlights.note.add', 'Add Note')}
          </h3>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label={t('common.close', 'Close')}
          >
            ✕
          </button>
        </div>

        <div className={styles.preview}>
          <blockquote
            className={styles.quote}
            style={{ borderLeftColor: HIGHLIGHT_PALETTE[highlight.color].border }}
          >
            {displayText}
          </blockquote>
        </div>

        <div className={styles.editor}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={noteText}
            onChange={handleNoteChange}
            placeholder={t('highlights.note.placeholder', 'Add your thoughts...')}
            rows={6}
          />
        </div>

        <div className={styles.footer}>
          <div className={styles.status}>
            {isSaving ? (
              <span className={styles.saving}>
                {t('highlights.note.saving', 'Saving...')}
              </span>
            ) : lastSaved ? (
              <span className={styles.saved}>
                {t('highlights.note.saved', 'Saved')} •{' '}
                {new Date(lastSaved).toLocaleTimeString()}
              </span>
            ) : null}
          </div>

          <button className={styles.doneBtn} onClick={handleClose}>
            {t('common.done', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
}
