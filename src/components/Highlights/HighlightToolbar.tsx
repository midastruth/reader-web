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
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M1.5 2.5C1.5 2.5 3 2 6.5 2C10 2 11.5 2.5 11.5 2.5V10.5C11.5 10.5 10 10 6.5 10C3 10 1.5 10.5 1.5 10.5V2.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
              <line x1="6.5" y1="2" x2="6.5" y2="10" stroke="currentColor" strokeWidth="1.1"/>
              <line x1="3" y1="4.5" x2="6" y2="4.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.7"/>
              <line x1="3" y1="6.5" x2="6" y2="6.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </button>

          <button
            type="button"
            className="highlight-toolbar-ai-btn"
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
          gap: 4px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 246, 248, 0.84));
          border: 1px solid rgba(15, 23, 42, 0.10);
          border-radius: 14px;
          padding: 4px;
          box-shadow:
            0 8px 24px rgba(15, 23, 42, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(20px) saturate(180%);
        }

        .highlight-toolbar-group {
          display: flex;
          align-items: center;
          gap: 2px;
          min-height: 24px;
          padding: 2px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(15, 23, 42, 0.05);
          border-radius: 10px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .highlight-toolbar-colors {
          gap: 2px;
        }

        .highlight-toolbar-actions {
          gap: 2px;
        }

        .highlight-toolbar-color-btn {
          width: 18px;
          height: 18px;
          border: 1px solid;
          border-radius: 999px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          position: relative;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            0 1px 2px rgba(15, 23, 42, 0.1);
        }

        .highlight-toolbar-color-btn:hover {
          transform: scale(1.15);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.55),
            0 3px 8px rgba(15, 23, 42, 0.16);
        }

        .highlight-toolbar-color-btn.active::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          border: 1.5px solid rgba(17, 24, 39, 0.9);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9);
        }

        .highlight-toolbar-note-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 20px;
          padding: 0 8px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          transition: background-color 0.15s ease, transform 0.15s ease;
        }

        .highlight-toolbar-note-btn:hover {
          background: rgba(15, 23, 42, 0.07);
          transform: translateY(-1px);
        }

        .highlight-toolbar-note-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.09);
          color: #111827;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
        }

        .highlight-toolbar-note-text {
          font-weight: 600;
          color: #374151;
          letter-spacing: -0.01em;
          font-size: 11px;
        }

        .highlight-toolbar-ai-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 20px;
          min-width: 20px;
          padding: 0 6px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.15s ease;
          color: #fff;
        }

        .highlight-toolbar-ai-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .highlight-toolbar-ai-icon {
          font-size: 9px;
          line-height: 1;
        }

        .highlight-toolbar-ai-text {
          font-weight: 700;
          letter-spacing: 0.02em;
          font-size: 10px;
        }

        .highlight-toolbar-close-btn {
          width: 20px;
          height: 20px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          color: #9ca3af;
          transition: background-color 0.15s ease, color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .highlight-toolbar-close-btn:hover {
          background: rgba(15, 23, 42, 0.07);
          color: #374151;
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
              linear-gradient(180deg, rgba(52, 52, 56, 0.92), rgba(36, 36, 40, 0.86));
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow:
              0 10px 28px rgba(0, 0, 0, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.12),
              inset 0 -1px 0 rgba(255, 255, 255, 0.03);
          }

          .highlight-toolbar-group {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.07);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
          }

          .highlight-toolbar-note-btn:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .highlight-toolbar-note-icon {
            background: rgba(255, 255, 255, 0.11);
            color: #e5e7eb;
          }

          .highlight-toolbar-note-text {
            color: #d1d5db;
          }

          .highlight-toolbar-ai-btn {
            opacity: 0.92;
          }

          .highlight-toolbar-close-btn {
            color: #9ca3af;
          }

          .highlight-toolbar-close-btn:hover {
            background: rgba(255, 255, 255, 0.09);
            color: #e5e7eb;
          }

          .highlight-toolbar-color-btn.active::after {
            border-color: #f9fafb;
            box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.7);
          }
        }

        @media (max-width: 640px) {
          .highlight-toolbar-content {
            gap: 3px;
            padding: 3px;
          }

          .highlight-toolbar-color-btn {
            width: 16px;
            height: 16px;
          }

          .highlight-toolbar-note-btn {
            width: 24px;
            padding: 0;
            justify-content: center;
          }

          .highlight-toolbar-note-text {
            display: none;
          }

          .highlight-toolbar-ai-btn {
            padding: 0 6px;
          }
        }
      `}</style>
    </div>
  );
}
