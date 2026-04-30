/**
 * Note editor for highlights
 * Modal dialog with auto-save functionality
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import debounce from 'debounce';
import type { RootState } from '@/lib/store';
import type { Highlight } from '@/lib/types/highlights';
import { updateHighlight, closeNoteEditor } from '@/lib/highlightsReducer';
import { highlightService } from '@/core/Highlights';

export interface HighlightNoteProps {
  onHighlightUpdated?: (highlight: Highlight) => void;
}

export function HighlightNote({ onHighlightUpdated }: HighlightNoteProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const isOpen = useSelector((state: RootState) => state.highlights.isNoteEditorOpen);
  const editingNoteId = useSelector((state: RootState) => state.highlights.editingNoteId);
  const highlights = useSelector((state: RootState) => state.highlights.currentBookHighlights);

  const highlight = highlights.find(h => h.id === editingNoteId);

  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize note text when highlight changes
  useEffect(() => {
    if (highlight) {
      setNoteText(highlight.note || '');
    }
  }, [highlight]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Auto-save with debounce
  const saveNote = useCallback(async (text: string) => {
    if (!highlight) return;

    setIsSaving(true);
    const note = text || undefined;

    try {
      const updated = await highlightService.update(highlight.id, { note });

      // Update in Redux
      dispatch(updateHighlight({
        id: highlight.id,
        updates: updated
      }));

      onHighlightUpdated?.(updated);

      setLastSaved(Date.now());
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [highlight, dispatch, onHighlightUpdated]);

  const debouncedSave = useMemo(() => {
    return debounce((text: string) => saveNote(text), 500);
  }, [saveNote]);

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    debouncedSave(text);
  }, [debouncedSave]);

  useEffect(() => {
    return () => {
      debouncedSave.clear();
    };
  }, [debouncedSave]);

  const handleClose = useCallback(() => {
    debouncedSave.flush();
    dispatch(closeNoteEditor());
  }, [debouncedSave, dispatch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Close on Escape
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen || !highlight) {
    return null;
  }

  const highlightText = highlight.locator.text.highlight;
  const displayText = highlightText.length > 150
    ? highlightText.substring(0, 150) + '...'
    : highlightText;

  return (
    <div className="highlight-note-overlay" onClick={handleClose}>
      <div
        className="highlight-note-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="highlight-note-header">
          <h3 className="highlight-note-title">
            {highlight.note
              ? t('highlights.note.edit', 'Edit Note')
              : t('highlights.note.add', 'Add Note')
            }
          </h3>
          <button
            className="highlight-note-close-btn"
            onClick={handleClose}
            aria-label={t('common.close', 'Close')}
          >
            ✕
          </button>
        </div>

        {/* Highlight preview */}
        <div className="highlight-note-preview">
          <blockquote className={`highlight-note-quote quote-${highlight.color}`}>
            {displayText}
          </blockquote>
        </div>

        {/* Note editor */}
        <div className="highlight-note-editor">
          <textarea
            ref={textareaRef}
            className="highlight-note-textarea"
            value={noteText}
            onChange={handleNoteChange}
            placeholder={t('highlights.note.placeholder', 'Add your thoughts...')}
            rows={6}
          />
        </div>

        {/* Footer */}
        <div className="highlight-note-footer">
          <div className="highlight-note-status">
            {isSaving ? (
              <span className="highlight-note-saving">
                {t('highlights.note.saving', 'Saving...')}
              </span>
            ) : lastSaved ? (
              <span className="highlight-note-saved">
                {t('highlights.note.saved', 'Saved')} •{' '}
                {new Date(lastSaved).toLocaleTimeString()}
              </span>
            ) : null}
          </div>

          <button
            className="highlight-note-done-btn"
            onClick={handleClose}
          >
            {t('common.done', 'Done')}
          </button>
        </div>
      </div>

      <style jsx>{`
        .highlight-note-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.32);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          padding: 16px;
          backdrop-filter: blur(6px);
        }

        .highlight-note-modal {
          background: rgba(255, 255, 255, 0.96);
          border-radius: 20px;
          box-shadow:
            0 24px 64px rgba(15, 23, 42, 0.18),
            0 4px 16px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 1);
          width: 100%;
          max-width: 420px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          border: 1px solid rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .highlight-note-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 12px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }

        .highlight-note-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .highlight-note-close-btn {
          width: 26px;
          height: 26px;
          border: none;
          background: rgba(15, 23, 42, 0.05);
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .highlight-note-close-btn:hover {
          background: rgba(15, 23, 42, 0.1);
          color: #111827;
        }

        .highlight-note-preview {
          padding: 10px 16px;
          background: rgba(15, 23, 42, 0.02);
          border-bottom: 1px solid rgba(15, 23, 42, 0.05);
        }

        .highlight-note-color-indicator {
          display: none;
        }

        .highlight-note-quote {
          margin: 0;
          padding: 0 0 0 10px;
          font-size: 12.5px;
          line-height: 1.55;
          color: #4b5563;
          font-style: italic;
          border-left: 3px solid currentColor;
        }

        .highlight-note-quote.quote-yellow { border-color: rgba(234, 179, 8, 0.7); }
        .highlight-note-quote.quote-green  { border-color: rgba(74, 168, 109, 0.7); }
        .highlight-note-quote.quote-blue   { border-color: rgba(59, 130, 246, 0.7); }
        .highlight-note-quote.quote-pink   { border-color: rgba(236, 72, 153, 0.7); }
        .highlight-note-quote.quote-orange { border-color: rgba(249, 115, 22, 0.7); }
        .highlight-note-quote.quote-purple { border-color: rgba(139, 92, 246, 0.7); }

        .highlight-note-editor {
          padding: 12px 16px;
          flex: 1;
          overflow-y: auto;
        }

        .highlight-note-textarea {
          width: 100%;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13.5px;
          line-height: 1.6;
          font-family: inherit;
          resize: none;
          min-height: 96px;
          background: rgba(255, 255, 255, 0.7);
          color: #111827;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }

        .highlight-note-textarea::placeholder {
          color: #9ca3af;
        }

        .highlight-note-textarea:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
          background: #fff;
        }

        .highlight-note-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-top: 1px solid rgba(15, 23, 42, 0.06);
        }

        .highlight-note-status {
          font-size: 11px;
          color: #9ca3af;
          letter-spacing: 0.01em;
        }

        .highlight-note-saving {
          color: #6366f1;
        }

        .highlight-note-saved {
          color: #22c55e;
        }

        .highlight-note-done-btn {
          padding: 6px 18px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.15s ease;
          letter-spacing: 0.01em;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .highlight-note-done-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .highlight-note-done-btn:active {
          transform: scale(0.97);
          opacity: 1;
        }

        @media (prefers-color-scheme: dark) {
          .highlight-note-modal {
            background: rgba(30, 30, 34, 0.97);
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow:
              0 24px 64px rgba(0, 0, 0, 0.5),
              0 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.07);
          }

          .highlight-note-header {
            border-color: rgba(255, 255, 255, 0.06);
          }

          .highlight-note-title {
            color: #f3f4f6;
          }

          .highlight-note-close-btn {
            background: rgba(255, 255, 255, 0.07);
            color: #9ca3af;
          }

          .highlight-note-close-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #f3f4f6;
          }

          .highlight-note-preview {
            background: rgba(255, 255, 255, 0.02);
            border-color: rgba(255, 255, 255, 0.05);
          }

          .highlight-note-quote {
            color: #9ca3af;
          }

          .highlight-note-textarea {
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(255, 255, 255, 0.1);
            color: #e5e7eb;
          }

          .highlight-note-textarea::placeholder {
            color: #6b7280;
          }

          .highlight-note-textarea:focus {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(99, 102, 241, 0.5);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          }

          .highlight-note-footer {
            border-color: rgba(255, 255, 255, 0.06);
          }

          .highlight-note-status {
            color: #6b7280;
          }
        }

        @media (max-width: 640px) {
          .highlight-note-modal {
            max-width: 100%;
            max-height: 85vh;
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
}
