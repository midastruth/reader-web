/**
 * Highlights list panel component
 * Displays all highlights with filtering, sorting, and grouping
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/lib/store';
import { HighlightSortBy, type Highlight, type HighlightColor } from '@/lib/types/highlights';

import { setSelectedHighlight, openNoteEditor } from '@/lib/highlightsReducer';

export interface HighlightsListProps {
  onHighlightClick?: (highlight: Highlight) => void;
  onJumpToHighlight?: (highlight: Highlight) => void;
}

const COLOR_LABELS: Record<HighlightColor, { label: string; bg: string }> = {
  yellow: { label: 'Yellow', bg: 'rgba(255, 235, 0, 0.35)' },
  green: { label: 'Green', bg: 'rgba(165, 214, 167, 0.35)' },
  blue: { label: 'Blue', bg: 'rgba(144, 202, 249, 0.35)' },
  pink: { label: 'Pink', bg: 'rgba(244, 143, 177, 0.35)' },
  orange: { label: 'Orange', bg: 'rgba(255, 204, 128, 0.35)' },
  purple: { label: 'Purple', bg: 'rgba(206, 147, 216, 0.35)' },
};

export function HighlightsList({ onHighlightClick, onJumpToHighlight }: HighlightsListProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const highlights = useSelector((state: RootState) => state.highlights.currentBookHighlights);
  const selectedHighlightId = useSelector((state: RootState) => state.highlights.selectedHighlightId);

  const [searchText, setSearchText] = useState('');
  const [filterColors, setFilterColors] = useState<HighlightColor[]>([]);
  const [filterWithNotesOnly, setFilterWithNotesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<HighlightSortBy>(HighlightSortBy.POSITION);

  const [groupByChapter, setGroupByChapter] = useState(true);

  // Filter and sort highlights
  const processedHighlights = useMemo(() => {
    let filtered = [...highlights];

    // Apply search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(h =>
        h.locator.text.highlight.toLowerCase().includes(search) ||
        h.note?.toLowerCase().includes(search)
      );
    }

    // Apply color filter
    if (filterColors.length > 0) {
      filtered = filtered.filter(h => filterColors.includes(h.color));
    }

    // Apply notes filter
    if (filterWithNotesOnly) {
      filtered = filtered.filter(h => !!h.note);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case HighlightSortBy.POSITION:

          return (a.locator.locations.progression || 0) - (b.locator.locations.progression || 0);
        case HighlightSortBy.CREATED:

          return b.createdAt - a.createdAt;
        case HighlightSortBy.UPDATED:

          return b.updatedAt - a.updatedAt;
        case HighlightSortBy.COLOR:
          return a.color.localeCompare(b.color);
        default:
          return 0;
      }
    });

    return filtered;
  }, [highlights, searchText, filterColors, filterWithNotesOnly, sortBy]);

  // Group by chapter
  const groupedHighlights = useMemo(() => {
    if (!groupByChapter) {
      return new Map([['all', processedHighlights]]);
    }

    const groups = new Map<string, Highlight[]>();
    for (const highlight of processedHighlights) {
      const href = highlight.locator.href;
      const existing = groups.get(href) || [];
      existing.push(highlight);
      groups.set(href, existing);
    }
    return groups;
  }, [processedHighlights, groupByChapter]);

  const handleHighlightClick = useCallback((highlight: Highlight) => {
    dispatch(setSelectedHighlight(highlight.id));
    onHighlightClick?.(highlight);
    onJumpToHighlight?.(highlight);
  }, [dispatch, onHighlightClick, onJumpToHighlight]);

  const handleAddNote = useCallback((e: React.MouseEvent, highlightId: string) => {
    e.stopPropagation();
    dispatch(openNoteEditor(highlightId));
  }, [dispatch]);

  const toggleColorFilter = useCallback((color: HighlightColor) => {
    setFilterColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getChapterTitle = (href: string) => {
    // Extract title from href (remove extension)
    return href.replace(/\.(xhtml|html)$/i, '').replace(/^.*\//, '');
  };

  return (
    <div className="highlights-list">
      {/* Header */}
      <div className="highlights-list-header">
        <h2 className="highlights-list-title">
          {t('highlights.list.title', 'Highlights')}
          <span className="highlights-list-count">({highlights.length})</span>
        </h2>
      </div>

      {/* Search */}
      <div className="highlights-list-search">
        <input
          type="text"
          className="highlights-list-search-input"
          placeholder={t('highlights.list.search', 'Search highlights...')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="highlights-list-filters">
        {/* Color filters */}
        <div className="highlights-list-color-filters">
          {Object.entries(COLOR_LABELS).map(([color, { label, bg }]) => (
            <button
              key={color}
              className={`highlights-list-color-filter ${filterColors.includes(color as HighlightColor) ? 'active' : ''}`}
              style={{ backgroundColor: bg }}
              onClick={() => toggleColorFilter(color as HighlightColor)}
              title={t(`highlights.color.${color}`, label)}
              aria-label={t(`highlights.color.${color}`, label)}
            />
          ))}
        </div>

        {/* Notes filter */}
        <label className="highlights-list-checkbox">
          <input
            type="checkbox"
            checked={filterWithNotesOnly}
            onChange={(e) => setFilterWithNotesOnly(e.target.checked)}
          />
          <span>{t('highlights.list.withNotesOnly', 'With notes only')}</span>
        </label>
      </div>

      {/* Controls */}
      <div className="highlights-list-controls">
        {/* Sort */}
        <select
          className="highlights-list-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as HighlightSortBy)}
        >
          <option value="position">{t('highlights.list.sort.position', 'Position')}</option>
          <option value="created">{t('highlights.list.sort.created', 'Created')}</option>
          <option value="updated">{t('highlights.list.sort.updated', 'Updated')}</option>
          <option value="color">{t('highlights.list.sort.color', 'Color')}</option>
        </select>

        {/* Group toggle */}
        <label className="highlights-list-checkbox">
          <input
            type="checkbox"
            checked={groupByChapter}
            onChange={(e) => setGroupByChapter(e.target.checked)}
          />
          <span>{t('highlights.list.groupByChapter', 'Group by chapter')}</span>
        </label>
      </div>

      {/* List */}
      <div className="highlights-list-content">
        {processedHighlights.length === 0 ? (
          <div className="highlights-list-empty">
            <p>{t('highlights.list.empty', 'No highlights yet')}</p>
            <p className="highlights-list-empty-hint">
              {t('highlights.list.emptyHint', 'Select text to create your first highlight')}
            </p>
          </div>
        ) : (
          Array.from(groupedHighlights.entries()).map(([chapter, chapterHighlights]) => (
            <div key={chapter} className="highlights-list-group">
              {groupByChapter && (
                <h3 className="highlights-list-chapter-title">
                  {getChapterTitle(chapter)}
                  <span className="highlights-list-chapter-count">
                    ({chapterHighlights.length})
                  </span>
                </h3>
              )}

              {chapterHighlights.map(highlight => (
                <div
                  key={highlight.id}
                  className={`highlights-list-item ${selectedHighlightId === highlight.id ? 'selected' : ''}`}
                  onClick={() => handleHighlightClick(highlight)}
                >
                  {/* Color indicator */}
                  <div
                    className="highlights-list-item-color"
                    style={{ backgroundColor: COLOR_LABELS[highlight.color].bg }}
                  />

                  {/* Content */}
                  <div className="highlights-list-item-content">
                    {/* Text */}
                    <blockquote className="highlights-list-item-text">
                      {highlight.locator.text.highlight}
                    </blockquote>

                    {/* Note */}
                    {highlight.note && (
                      <div className="highlights-list-item-note">
                        <span className="highlights-list-item-note-icon">📝</span>
                        {highlight.note}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="highlights-list-item-meta">
                      <span className="highlights-list-item-date">
                        {formatDate(highlight.createdAt)}
                      </span>
                      {highlight.locator.locations.progression && (
                        <span className="highlights-list-item-position">
                          {Math.round(highlight.locator.locations.progression * 100)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="highlights-list-item-actions">
                    <button
                      className="highlights-list-item-action-btn"
                      onClick={(e) => handleAddNote(e, highlight.id)}
                      title={highlight.note ? t('highlights.note.edit', 'Edit Note') : t('highlights.note.add', 'Add Note')}
                    >
                      {highlight.note ? '✏️' : '📝'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .highlights-list {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: white;
        }

        .highlights-list-header {
          padding: 20px;
          border-bottom: 1px solid #e8e8e8;
        }

        .highlights-list-title {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .highlights-list-count {
          font-size: 18px;
          font-weight: 400;
          color: #666;
        }

        .highlights-list-search {
          padding: 16px 20px;
          border-bottom: 1px solid #e8e8e8;
        }

        .highlights-list-search-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .highlights-list-search-input:focus {
          outline: none;
          border-color: #64b5f6;
          box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.1);
        }

        .highlights-list-filters {
          padding: 16px 20px;
          border-bottom: 1px solid #e8e8e8;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .highlights-list-color-filters {
          display: flex;
          gap: 8px;
        }

        .highlights-list-color-filter {
          width: 28px;
          height: 28px;
          border: 2px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .highlights-list-color-filter:hover {
          transform: scale(1.1);
        }

        .highlights-list-color-filter.active {
          border-color: #333;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
        }

        .highlights-list-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #333;
          cursor: pointer;
        }

        .highlights-list-checkbox input {
          cursor: pointer;
        }

        .highlights-list-controls {
          padding: 16px 20px;
          border-bottom: 1px solid #e8e8e8;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .highlights-list-sort {
          padding: 8px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          background: white;
        }

        .highlights-list-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px 0;
        }

        .highlights-list-empty {
          padding: 60px 20px;
          text-align: center;
          color: #666;
        }

        .highlights-list-empty-hint {
          font-size: 14px;
          color: #999;
          margin-top: 8px;
        }

        .highlights-list-group {
          margin-bottom: 24px;
        }

        .highlights-list-chapter-title {
          margin: 0 0 12px 0;
          padding: 0 20px;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .highlights-list-chapter-count {
          font-size: 14px;
          font-weight: 400;
          color: #999;
        }

        .highlights-list-item {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .highlights-list-item:hover {
          background: #f9f9f9;
        }

        .highlights-list-item.selected {
          background: #e3f2fd;
        }

        .highlights-list-item-color {
          width: 4px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .highlights-list-item-content {
          flex: 1;
          min-width: 0;
        }

        .highlights-list-item-text {
          margin: 0 0 8px 0;
          padding: 0;
          font-size: 15px;
          line-height: 1.6;
          color: #1a1a1a;
          font-style: normal;
          word-wrap: break-word;
        }

        .highlights-list-item-note {
          margin: 8px 0;
          padding: 10px;
          background: #fff3cd;
          border-radius: 6px;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
          display: flex;
          gap: 6px;
        }

        .highlights-list-item-note-icon {
          flex-shrink: 0;
        }

        .highlights-list-item-meta {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: #999;
        }

        .highlights-list-item-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }

        .highlights-list-item-action-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }

        .highlights-list-item-action-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        @media (prefers-color-scheme: dark) {
          .highlights-list {
            background: #1e1e1e;
          }

          .highlights-list-header,
          .highlights-list-search,
          .highlights-list-filters,
          .highlights-list-controls {
            border-color: #333;
          }

          .highlights-list-title {
            color: #e0e0e0;
          }

          .highlights-list-count {
            color: #aaa;
          }

          .highlights-list-search-input {
            background: #2c2c2c;
            border-color: #444;
            color: #e0e0e0;
          }

          .highlights-list-checkbox {
            color: #e0e0e0;
          }

          .highlights-list-sort {
            background: #2c2c2c;
            border-color: #444;
            color: #e0e0e0;
          }

          .highlights-list-empty {
            color: #aaa;
          }

          .highlights-list-chapter-title {
            color: #e0e0e0;
          }

          .highlights-list-item:hover {
            background: #2c2c2c;
          }

          .highlights-list-item.selected {
            background: #1e3a5f;
          }

          .highlights-list-item-text {
            color: #e0e0e0;
          }

          .highlights-list-item-note {
            background: #4a3c1a;
            color: #e0e0e0;
          }

          .highlights-list-item-meta {
            color: #888;
          }

          .highlights-list-item-action-btn:hover {
            background: rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </div>
  );
}
