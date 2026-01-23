/**
 * Note editor for highlights
 * Modal dialog with auto-save functionality
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import debounce from 'debounce';
import type { RootState } from '@/lib/store';
import { updateHighlight, closeNoteEditor } from '@/lib/highlightsReducer';
import HighlightsDB from '@/core/Storage/HighlightsDB';

export function HighlightNote() {
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

    try {
      // Update in database
      await HighlightsDB.updateHighlight(highlight.id, { note: text || undefined });

      // Update in Redux
      dispatch(updateHighlight({
        id: highlight.id,
        updates: { note: text || undefined }
      }));

      setLastSaved(Date.now());
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [highlight, dispatch]);

  const debouncedSave = useCallback(
    debounce((text: string) => saveNote(text), 500),
    [saveNote]
  );

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    debouncedSave(text);
  }, [debouncedSave]);

  const handleClose = useCallback(() => {
    dispatch(closeNoteEditor());
  }, [dispatch]);

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
          <div className={`highlight-note-color-indicator highlight-${highlight.color}`} />
          <blockquote className="highlight-note-quote">
            "{displayText}"
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
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          padding: 20px;
          backdrop-filter: blur(4px);
        }

        .highlight-note-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .highlight-note-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e8e8e8;
        }

        .highlight-note-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .highlight-note-close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 20px;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .highlight-note-close-btn:hover {
          background: #f0f0f0;
          color: #333;
        }

        .highlight-note-preview {
          padding: 20px 24px;
          background: #f9f9f9;
          border-bottom: 1px solid #e8e8e8;
        }

        .highlight-note-color-indicator {
          width: 40px;
          height: 4px;
          border-radius: 2px;
          margin-bottom: 12px;
        }

        .highlight-note-color-indicator.highlight-yellow { background: #ffd54f; }
        .highlight-note-color-indicator.highlight-green { background: #81c784; }
        .highlight-note-color-indicator.highlight-blue { background: #64b5f6; }
        .highlight-note-color-indicator.highlight-pink { background: #f06292; }
        .highlight-note-color-indicator.highlight-orange { background: #ffb74d; }
        .highlight-note-color-indicator.highlight-purple { background: #ba68c8; }

        .highlight-note-quote {
          margin: 0;
          padding: 0;
          font-size: 15px;
          line-height: 1.6;
          color: #333;
          font-style: italic;
        }

        .highlight-note-editor {
          padding: 20px 24px;
          flex: 1;
          overflow-y: auto;
        }

        .highlight-note-textarea {
          width: 100%;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          font-size: 15px;
          line-height: 1.6;
          font-family: inherit;
          resize: vertical;
          min-height: 150px;
          transition: border-color 0.2s ease;
        }

        .highlight-note-textarea:focus {
          outline: none;
          border-color: #64b5f6;
          box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.1);
        }

        .highlight-note-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-top: 1px solid #e8e8e8;
        }

        .highlight-note-status {
          font-size: 13px;
          color: #666;
        }

        .highlight-note-saving {
          color: #64b5f6;
        }

        .highlight-note-saved {
          color: #81c784;
        }

        .highlight-note-done-btn {
          padding: 10px 24px;
          background: #64b5f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .highlight-note-done-btn:hover {
          background: #42a5f5;
        }

        .highlight-note-done-btn:active {
          transform: scale(0.98);
        }

        @media (prefers-color-scheme: dark) {
          .highlight-note-modal {
            background: #2c2c2c;
          }

          .highlight-note-header {
            border-color: #444;
          }

          .highlight-note-title {
            color: #e0e0e0;
          }

          .highlight-note-close-btn {
            color: #aaa;
          }

          .highlight-note-close-btn:hover {
            background: #3a3a3a;
            color: #e0e0e0;
          }

          .highlight-note-preview {
            background: #1e1e1e;
            border-color: #444;
          }

          .highlight-note-quote {
            color: #e0e0e0;
          }

          .highlight-note-textarea {
            background: #1e1e1e;
            border-color: #555;
            color: #e0e0e0;
          }

          .highlight-note-textarea:focus {
            border-color: #64b5f6;
          }

          .highlight-note-footer {
            border-color: #444;
          }

          .highlight-note-status {
            color: #aaa;
          }
        }

        @media (max-width: 640px) {
          .highlight-note-modal {
            max-width: 100%;
            max-height: 90vh;
          }

          .highlight-note-header,
          .highlight-note-preview,
          .highlight-note-editor,
          .highlight-note-footer {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      `}</style>
    </div>
  );
}
