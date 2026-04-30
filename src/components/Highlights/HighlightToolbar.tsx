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
import type { AiAction } from '@/components/AI/AiChatPanel';

export interface HighlightToolbarProps {
  position: { x: number; y: number };
  onColorSelect: (color: HighlightColor) => void;
  onAddNote: () => void;
  onAiQuery: (action: AiAction) => void;
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
    bg: 'rgba(255, 235, 0, 0.35)',
    border: 'rgba(255, 235, 0, 0.65)',
  },
  {
    color: HighlightColor.GREEN,
    label: 'Green',
    bg: 'rgba(165, 214, 167, 0.35)',
    border: 'rgba(129, 199, 132, 0.65)',
  },
  {
    color: HighlightColor.BLUE,
    label: 'Blue',
    bg: 'rgba(144, 202, 249, 0.35)',
    border: 'rgba(100, 181, 246, 0.65)',
  },
  {
    color: HighlightColor.PINK,
    label: 'Pink',
    bg: 'rgba(244, 143, 177, 0.35)',
    border: 'rgba(240, 98, 146, 0.65)',
  },
  {
    color: HighlightColor.ORANGE,
    label: 'Orange',
    bg: 'rgba(255, 204, 128, 0.35)',
    border: 'rgba(255, 183, 77, 0.65)',
  },
  {
    color: HighlightColor.PURPLE,
    label: 'Purple',
    bg: 'rgba(206, 147, 216, 0.35)',
    border: 'rgba(186, 104, 200, 0.65)',
  },
];

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

  const handleColorClick = useCallback((color: HighlightColor) => {
    dispatch(setActiveColor(color));
    onColorSelect(color);
  }, [dispatch, onColorSelect]);

  const handleAddNoteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddNote();
  }, [onAddNote]);

  const handleAiQueryClick = useCallback((e: React.MouseEvent, action: AiAction) => {
    e.stopPropagation();
    onAiQuery(action);
  }, [onAiQuery]);

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
        <div className="highlight-toolbar-group highlight-toolbar-colors">
          {COLOR_OPTIONS.map(({ color, label, bg, border }) => (
            <button
              key={color}
              type="button"
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

        <div className="highlight-toolbar-group highlight-toolbar-actions">
          <button
            type="button"
            className="highlight-toolbar-note-btn"
            onClick={handleAddNoteClick}
            title={t('highlights.note.add', 'Add Note')}
            aria-label={t('highlights.note.add', 'Add Note')}
          >
            <span className="highlight-toolbar-note-icon" aria-hidden="true">+</span>
            <span className="highlight-toolbar-note-text">
              {t('highlights.note.add', 'Note')}
            </span>
          </button>

          <button
            type="button"
            className="highlight-toolbar-ai-btn"
            onClick={(e) => handleAiQueryClick(e, 'dictionary')}
            title={t('ai.dictionary', '查词')}
            aria-label={t('ai.dictionary', '查词')}
          >
            <span className="highlight-toolbar-ai-text">词</span>
          </button>

          <button
            type="button"
            className="highlight-toolbar-ai-btn"
            onClick={(e) => handleAiQueryClick(e, 'analyze')}
            title={t('ai.analyze', '分析')}
            aria-label={t('ai.analyze', '分析')}
          >
            <span className="highlight-toolbar-ai-text">分析</span>
          </button>

          <button
            type="button"
            className="highlight-toolbar-ai-btn"
            onClick={(e) => handleAiQueryClick(e, 'ask')}
            title={t('ai.query', 'READER AI')}
            aria-label={t('ai.query', 'READER AI')}
          >
            <span className="highlight-toolbar-ai-icon" aria-hidden="true">✦</span>
            <span className="highlight-toolbar-ai-text">AI</span>
          </button>

          <button
            type="button"
            className="highlight-toolbar-close-btn"
            onClick={onClose}
            title={t('highlights.toolbar.close', 'Close')}
            aria-label={t('highlights.toolbar.close', 'Close')}
          >
            x
          </button>
        </div>
      </div>

      <style jsx>{`
        .highlight-toolbar {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .highlight-toolbar-content {
          display: flex;
          align-items: center;
          gap: 6px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(244, 244, 246, 0.78));
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 18px;
          padding: 5px;
          box-shadow:
            0 14px 40px rgba(15, 23, 42, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            inset 0 -1px 0 rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(22px) saturate(180%);
        }

        .highlight-toolbar-group {
          display: flex;
          align-items: center;
          gap: 4px;
          min-height: 30px;
          padding: 3px;
          background: rgba(255, 255, 255, 0.54);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 13px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        .highlight-toolbar-colors {
          gap: 3px;
        }

        .highlight-toolbar-actions {
          gap: 3px;
        }

        .highlight-toolbar-color-btn {
          width: 22px;
          height: 22px;
          border: 1px solid;
          border-radius: 999px;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          position: relative;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.48),
            0 1px 1px rgba(15, 23, 42, 0.08);
        }

        .highlight-toolbar-color-btn:hover {
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.55),
            0 4px 10px rgba(15, 23, 42, 0.14);
        }

        .highlight-toolbar-color-btn.active::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          border: 1.5px solid rgba(17, 24, 39, 0.95);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.92);
        }

        .highlight-toolbar-note-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          height: 24px;
          padding: 0 10px;
          background: transparent;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }

        .highlight-toolbar-note-btn:hover {
          background: rgba(15, 23, 42, 0.08);
          transform: translateY(-1px);
        }

        .highlight-toolbar-note-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.1);
          color: #111827;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
        }

        .highlight-toolbar-note-text {
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .highlight-toolbar-ai-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 24px;
          padding: 0 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          transition: opacity 0.18s ease, transform 0.18s ease;
          color: #fff;
        }

        .highlight-toolbar-ai-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .highlight-toolbar-ai-icon {
          font-size: 10px;
          line-height: 1;
        }

        .highlight-toolbar-ai-text {
          font-weight: 700;
          letter-spacing: 0.02em;
          font-size: 11px;
        }

        .highlight-toolbar-close-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          text-transform: lowercase;
          line-height: 1;
          color: #6b7280;
          transition: background-color 0.18s ease, color 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .highlight-toolbar-close-btn:hover {
          background: rgba(15, 23, 42, 0.08);
          color: #111827;
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
            background:
              linear-gradient(180deg, rgba(58, 58, 60, 0.9), rgba(38, 38, 40, 0.82));
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow:
              0 18px 40px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.16),
              inset 0 -1px 0 rgba(255, 255, 255, 0.04);
          }

          .highlight-toolbar-group {
            background: rgba(255, 255, 255, 0.07);
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .highlight-toolbar-note-btn {
            color: #e0e0e0;
          }

          .highlight-toolbar-note-btn:hover {
            background: rgba(255, 255, 255, 0.12);
          }

          .highlight-toolbar-note-icon {
            background: rgba(255, 255, 255, 0.12);
            color: #f5f5f5;
          }

          .highlight-toolbar-note-text {
            color: #f5f5f5;
          }

          .highlight-toolbar-ai-btn {
            opacity: 0.92;
          }

          .highlight-toolbar-close-btn {
            color: #b8c0cc;
          }

          .highlight-toolbar-close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
          }

          .highlight-toolbar-color-btn.active::after {
            border-color: #f8fafc;
            box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.75);
          }
        }

        @media (max-width: 640px) {
          .highlight-toolbar-content {
            gap: 5px;
            padding: 4px;
          }

          .highlight-toolbar-color-btn {
            width: 20px;
            height: 20px;
          }

          .highlight-toolbar-note-btn {
            width: 28px;
            padding: 0;
            justify-content: center;
          }

          .highlight-toolbar-note-text {
            display: none;
          }

          .highlight-toolbar-ai-btn {
            padding: 0 7px;
            min-width: 26px;
          }
        }
      `}</style>
    </div>
  );
}
