/**
 * Context menu for existing highlights
 * Appears when user clicks on a highlight
 */

import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { HighlightColor, type Highlight } from '@/lib/types/highlights';
import { updateHighlight, deleteHighlight, openNoteEditor } from '@/lib/highlightsReducer';
import HighlightsDB from '@/core/Storage/HighlightsDB';

export interface HighlightContextMenuProps {
  highlight: Highlight;
  position: { x: number; y: number };
  onClose: () => void;
  onColorChange?: (color: HighlightColor) => void;
  onDelete?: () => void;
}

const COLOR_OPTIONS: Array<{
  color: HighlightColor;
  label: string;
  bg: string;
}> = [
    { color: HighlightColor.YELLOW, label: 'Yellow', bg: '#fff59d' },
    { color: HighlightColor.GREEN, label: 'Green', bg: '#a5d6a7' },
    { color: HighlightColor.BLUE, label: 'Blue', bg: '#90caf9' },
    { color: HighlightColor.PINK, label: 'Pink', bg: '#f48fb1' },
    { color: HighlightColor.ORANGE, label: 'Orange', bg: '#ffcc80' },
    { color: HighlightColor.PURPLE, label: 'Purple', bg: '#ce93d8' },
  ];

export function HighlightContextMenu({
  highlight,
  position,
  onClose,
  onColorChange,
  onDelete,
}: HighlightContextMenuProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const handleColorChange = useCallback(async (color: HighlightColor) => {
    try {
      // Update in database
      await HighlightsDB.updateHighlight(highlight.id, { color });

      // Update in Redux
      dispatch(updateHighlight({ id: highlight.id, updates: { color } }));

      // Notify parent
      onColorChange?.(color);

      onClose();
    } catch (error) {
      console.error('Failed to update highlight color:', error);
    }
  }, [highlight.id, dispatch, onColorChange, onClose]);

  const handleAddNote = useCallback(() => {
    dispatch(openNoteEditor(highlight.id));
    onClose();
  }, [highlight.id, dispatch, onClose]);

  const handleEditNote = useCallback(() => {
    dispatch(openNoteEditor(highlight.id));
    onClose();
  }, [highlight.id, dispatch, onClose]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm(t('highlights.delete.confirm', 'Delete this highlight?'))) {
      return;
    }

    try {
      // Delete from database
      await HighlightsDB.deleteHighlight(highlight.id);

      // Delete from Redux
      dispatch(deleteHighlight(highlight.id));

      // Notify parent
      onDelete?.();

      onClose();
    } catch (error) {
      console.error('Failed to delete highlight:', error);
    }
  }, [highlight.id, dispatch, onDelete, onClose, t]);

  return (
    <div
      className="highlight-context-menu"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="highlight-context-menu-content">
        {/* Change color section */}
        <div className="highlight-context-menu-section">
          <div className="highlight-context-menu-label">
            {t('highlights.changeColor', 'Change Color')}
          </div>
          <div className="highlight-context-menu-colors">
            {COLOR_OPTIONS.map(({ color, label, bg }) => (
              <button
                key={color}
                className={`highlight-context-menu-color-btn ${highlight.color === color ? 'active' : ''}`}
                style={{ backgroundColor: bg }}
                onClick={() => handleColorChange(color)}
                title={t(`highlights.color.${color}`, label)}
                aria-label={t(`highlights.color.${color}`, label)}
              >
                {highlight.color === color && <span className="check-mark">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Actions section */}
        <div className="highlight-context-menu-section">
          {highlight.note ? (
            <button
              className="highlight-context-menu-action-btn"
              onClick={handleEditNote}
            >
              <span className="icon">✏️</span>
              {t('highlights.note.edit', 'Edit Note')}
            </button>
          ) : (
            <button
              className="highlight-context-menu-action-btn"
              onClick={handleAddNote}
            >
              <span className="icon">📝</span>
              {t('highlights.note.add', 'Add Note')}
            </button>
          )}

          <button
            className="highlight-context-menu-action-btn delete-btn"
            onClick={handleDelete}
          >
            <span className="icon">🗑️</span>
            {t('highlights.delete', 'Delete Highlight')}
          </button>
        </div>

        {/* Close button */}
        <button
          className="highlight-context-menu-close-btn"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
        >
          ✕
        </button>
      </div>

      <style jsx>{`
        .highlight-context-menu {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .highlight-context-menu-content {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          min-width: 240px;
          padding: 12px;
        }

        .highlight-context-menu-section {
          padding: 8px 0;
        }

        .highlight-context-menu-section:not(:last-child) {
          border-bottom: 1px solid #e8e8e8;
        }

        .highlight-context-menu-label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .highlight-context-menu-colors {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .highlight-context-menu-color-btn {
          width: 100%;
          aspect-ratio: 1;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .highlight-context-menu-color-btn:hover {
          transform: scale(1.05);
          border-color: #999;
        }

        .highlight-context-menu-color-btn.active {
          border-color: #333;
          border-width: 3px;
        }

        .check-mark {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        .highlight-context-menu-action-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          transition: background-color 0.2s ease;
          text-align: left;
        }

        .highlight-context-menu-action-btn:hover {
          background: #f5f5f5;
        }

        .highlight-context-menu-action-btn.delete-btn {
          color: #d32f2f;
        }

        .highlight-context-menu-action-btn.delete-btn:hover {
          background: #ffebee;
        }

        .highlight-context-menu-action-btn .icon {
          font-size: 16px;
          min-width: 20px;
        }

        .highlight-context-menu-close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .highlight-context-menu-close-btn:hover {
          background: #f0f0f0;
          color: #333;
        }

        @media (prefers-color-scheme: dark) {
          .highlight-context-menu-content {
            background: #2c2c2c;
            border-color: #444;
          }

          .highlight-context-menu-section {
            border-color: #444;
          }

          .highlight-context-menu-label {
            color: #aaa;
          }

          .highlight-context-menu-color-btn {
            border-color: #555;
          }

          .highlight-context-menu-color-btn:hover {
            border-color: #777;
          }

          .highlight-context-menu-color-btn.active {
            border-color: #e0e0e0;
          }

          .highlight-context-menu-action-btn {
            color: #e0e0e0;
          }

          .highlight-context-menu-action-btn:hover {
            background: #3a3a3a;
          }

          .highlight-context-menu-action-btn.delete-btn {
            color: #f44336;
          }

          .highlight-context-menu-action-btn.delete-btn:hover {
            background: #4a2020;
          }

          .highlight-context-menu-close-btn {
            color: #aaa;
          }

          .highlight-context-menu-close-btn:hover {
            background: #3a3a3a;
            color: #e0e0e0;
          }
        }
      `}</style>
    </div>
  );
}
