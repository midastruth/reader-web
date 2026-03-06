/**
 * Highlight color selection toolbar
 * Appears when user selects text in the reader
 */

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/lib/store';
import { HighlightColor } from '@/lib/types/highlights';
import { setActiveColor } from '@/lib/highlightsReducer';

export interface HighlightToolbarProps {
  position: { x: number; y: number };
  onColorSelect: (color: HighlightColor) => void;
  onAddNote: () => void;
  onClose: () => void;
}

const COLOR_OPTIONS: Array<{
  color: HighlightColor;
  label: string;
  bg: string;
  border: string;
}> = [
  {
    color: HighlightColor.YELLOW,
    label: 'Yellow',
    bg: '#fff59d',
    border: '#ffd54f',
  },
  {
    color: HighlightColor.GREEN,
    label: 'Green',
    bg: '#a5d6a7',
    border: '#81c784',
  },
  {
    color: HighlightColor.BLUE,
    label: 'Blue',
    bg: '#90caf9',
    border: '#64b5f6',
  },
  {
    color: HighlightColor.PINK,
    label: 'Pink',
    bg: '#f48fb1',
    border: '#f06292',
  },
  {
    color: HighlightColor.ORANGE,
    label: 'Orange',
    bg: '#ffcc80',
    border: '#ffb74d',
  },
  {
    color: HighlightColor.PURPLE,
    label: 'Purple',
    bg: '#ce93d8',
    border: '#ba68c8',
  },
];

export function HighlightToolbar({
  position,
  onColorSelect,
  onAddNote,
  onClose,
}: HighlightToolbarProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const activeColor = useSelector((state: RootState) => state.highlights.activeColor);

  const handleColorClick = useCallback((color: HighlightColor) => {
    dispatch(setActiveColor(color));
    onColorSelect(color);
  }, [dispatch, onColorSelect]);

  const handleAddNoteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddNote();
  }, [onAddNote]);

  return (
    <div
      className="highlight-toolbar"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="highlight-toolbar-content">
        {/* Color buttons */}
        <div className="highlight-toolbar-colors">
          {COLOR_OPTIONS.map(({ color, label, bg, border }) => (
            <button
              key={color}
              className={`highlight-toolbar-color-btn ${activeColor === color ? 'active' : ''}`}
              style={{
                backgroundColor: bg,
                borderColor: border,
              }}
              onClick={() => handleColorClick(color)}
              title={t(`highlights.color.${color}`, label)}
              aria-label={t(`highlights.color.${color}`, label)}
            >
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>

        {/* Add note button */}
        <button
          className="highlight-toolbar-note-btn"
          onClick={handleAddNoteClick}
          title={t('highlights.note.add', 'Add Note')}
          aria-label={t('highlights.note.add', 'Add Note')}
        >
          <span role="img" aria-label="note">📝</span>
          <span className="highlight-toolbar-note-text">
            {t('highlights.note.add', 'Note')}
          </span>
        </button>

        {/* Close button */}
        <button
          className="highlight-toolbar-close-btn"
          onClick={onClose}
          title={t('highlights.toolbar.close', 'Close')}
          aria-label={t('highlights.toolbar.close', 'Close')}
        >
          ✕
        </button>
      </div>

      <style jsx>{`
        .highlight-toolbar {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .highlight-toolbar-content {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .highlight-toolbar-colors {
          display: flex;
          gap: 6px;
        }

        .highlight-toolbar-color-btn {
          width: 32px;
          height: 32px;
          border: 2px solid;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .highlight-toolbar-color-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .highlight-toolbar-color-btn.active::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }

        .highlight-toolbar-note-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .highlight-toolbar-note-btn:hover {
          background: #e8e8e8;
          border-color: #d0d0d0;
        }

        .highlight-toolbar-note-text {
          font-weight: 500;
          color: #333;
        }

        .highlight-toolbar-close-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          color: #666;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .highlight-toolbar-close-btn:hover {
          background: #f0f0f0;
          color: #333;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        @media (prefers-color-scheme: dark) {
          .highlight-toolbar-content {
            background: #2c2c2c;
            border-color: #444;
          }

          .highlight-toolbar-note-btn {
            background: #3a3a3a;
            border-color: #555;
            color: #e0e0e0;
          }

          .highlight-toolbar-note-btn:hover {
            background: #454545;
            border-color: #666;
          }

          .highlight-toolbar-note-text {
            color: #e0e0e0;
          }

          .highlight-toolbar-close-btn {
            color: #aaa;
          }

          .highlight-toolbar-close-btn:hover {
            background: #3a3a3a;
            color: #e0e0e0;
          }
        }
      `}</style>
    </div>
  );
}
