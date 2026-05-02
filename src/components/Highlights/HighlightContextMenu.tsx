/**
 * Context menu for existing highlights
 * Appears when user clicks on a highlight
 */

import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { HighlightColor, type Highlight } from '@/lib/types/highlights';
import { updateHighlight, deleteHighlight, openNoteEditor } from '@/lib/highlightsReducer';
import { highlightService } from '@/core/Highlights';

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
    { color: HighlightColor.YELLOW, label: 'Yellow', bg: 'rgba(255, 235, 0, 0.35)' },
    { color: HighlightColor.GREEN, label: 'Green', bg: 'rgba(165, 214, 167, 0.35)' },
    { color: HighlightColor.BLUE, label: 'Blue', bg: 'rgba(144, 202, 249, 0.35)' },
    { color: HighlightColor.PINK, label: 'Pink', bg: 'rgba(244, 143, 177, 0.35)' },
    { color: HighlightColor.ORANGE, label: 'Orange', bg: 'rgba(255, 204, 128, 0.35)' },
    { color: HighlightColor.PURPLE, label: 'Purple', bg: 'rgba(206, 147, 216, 0.35)' },
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
      const updated = await highlightService.update(highlight.id, { color });

      // Update in Redux
      dispatch(updateHighlight({ id: highlight.id, updates: updated }));

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
      await highlightService.delete(highlight.id);

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
        position: 'fixed',
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
              <span className="icon">✎</span>
              {t('highlights.note.edit', 'Edit Note')}
            </button>
          ) : (
            <button
              className="highlight-context-menu-action-btn"
              onClick={handleAddNote}
            >
              <span className="icon">✎</span>
              {t('highlights.note.add', 'Add Note')}
            </button>
          )}

          <button
            className="highlight-context-menu-action-btn delete-btn"
            onClick={handleDelete}
          >
            <span className="icon">⌫</span>
            {t('highlights.delete', 'Delete')}
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
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(15, 23, 42, 0.09);
          border-radius: 14px;
          box-shadow:
            0 8px 28px rgba(15, 23, 42, 0.14),
            0 2px 8px rgba(15, 23, 42, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 1);
          min-width: 176px;
          padding: 6px;
          position: relative;
          backdrop-filter: blur(16px) saturate(180%);
        }

        .highlight-context-menu-section {
          padding: 4px 0;
        }

        .highlight-context-menu-section:not(:last-child) {
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
          margin-bottom: 2px;
          padding-bottom: 6px;
        }

        .highlight-context-menu-label {
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 0 4px;
        }

        .highlight-context-menu-colors {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0 2px;
        }

        .highlight-context-menu-color-btn {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          border-radius: 999px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .highlight-context-menu-color-btn:hover {
          transform: scale(1.18);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.55),
            0 3px 8px rgba(15, 23, 42, 0.16);
        }

        .highlight-context-menu-color-btn.active {
          border-color: rgba(17, 24, 39, 0.85);
          border-width: 2px;
          box-shadow:
            0 0 0 1.5px rgba(255, 255, 255, 0.9),
            0 0 0 3px rgba(17, 24, 39, 0.7);
        }

        .check-mark {
          font-size: 10px;
          font-weight: 700;
          color: rgba(17, 24, 39, 0.8);
          line-height: 1;
        }

        .highlight-context-menu-action-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 8px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 500;
          color: #374151;
          transition: background-color 0.15s ease;
          text-align: left;
        }

        .highlight-context-menu-action-btn:hover {
          background: rgba(15, 23, 42, 0.06);
        }

        .highlight-context-menu-action-btn.delete-btn {
          color: #ef4444;
        }

        .highlight-context-menu-action-btn.delete-btn:hover {
          background: rgba(239, 68, 68, 0.08);
        }

        .highlight-context-menu-action-btn .icon {
          font-size: 13px;
          min-width: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
        }

        .highlight-context-menu-close-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          border: none;
          background: rgba(15, 23, 42, 0.05);
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          line-height: 1;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .highlight-context-menu-close-btn:hover {
          background: rgba(15, 23, 42, 0.1);
          color: #374151;
        }

        @media (prefers-color-scheme: dark) {
          .highlight-context-menu-content {
            background: rgba(30, 30, 34, 0.97);
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow:
              0 10px 32px rgba(0, 0, 0, 0.42),
              0 2px 8px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.07);
          }

          .highlight-context-menu-section:not(:last-child) {
            border-color: rgba(255, 255, 255, 0.06);
          }

          .highlight-context-menu-label {
            color: #6b7280;
          }

          .highlight-context-menu-color-btn {
            border-color: rgba(255, 255, 255, 0.15);
          }

          .highlight-context-menu-color-btn.active {
            border-color: rgba(249, 250, 251, 0.85);
            box-shadow:
              0 0 0 1.5px rgba(30, 30, 34, 0.9),
              0 0 0 3px rgba(249, 250, 251, 0.6);
          }

          .check-mark {
            color: rgba(249, 250, 251, 0.85);
          }

          .highlight-context-menu-action-btn {
            color: #d1d5db;
          }

          .highlight-context-menu-action-btn:hover {
            background: rgba(255, 255, 255, 0.07);
          }

          .highlight-context-menu-action-btn.delete-btn {
            color: #f87171;
          }

          .highlight-context-menu-action-btn.delete-btn:hover {
            background: rgba(239, 68, 68, 0.12);
          }

          .highlight-context-menu-close-btn {
            background: rgba(255, 255, 255, 0.06);
            color: #6b7280;
          }

          .highlight-context-menu-close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #d1d5db;
          }
        }
      `}</style>
    </div>
  );
}
