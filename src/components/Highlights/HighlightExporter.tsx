/**
 * Highlight export component
 * Export highlights in various formats (Markdown, JSON, HTML, PDF)
 */

import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/lib/store';
import { ExportFormat } from '@/lib/types/highlights';
import {
  exportAsMarkdown,
  exportAsJSON,
  exportAsHTML,
  downloadFile,
} from './helpers/exportFormats';

export interface HighlightExporterProps {
  bookTitle?: string;
  bookId?: string;
  onClose?: () => void;
}

export function HighlightExporter({ bookTitle, bookId, onClose }: HighlightExporterProps) {
  const { t } = useTranslation();
  const highlights = useSelector((state: RootState) => state.highlights.currentBookHighlights);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.MARKDOWN);

  const handleExport = useCallback(async () => {
    if (highlights.length === 0) {
      alert(t('highlights.export.noHighlights', 'No highlights to export'));
      return;
    }

    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const safeTitle = (bookTitle || 'book').replace(/[^a-z0-9]/gi, '_').toLowerCase();

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case ExportFormat.MARKDOWN:
          content = exportAsMarkdown(highlights, bookTitle);
          filename = `${safeTitle}_highlights_${timestamp}.md`;
          mimeType = 'text/markdown';
          break;

        case ExportFormat.JSON:
          content = exportAsJSON(highlights, bookTitle, bookId);
          filename = `${safeTitle}_highlights_${timestamp}.json`;
          mimeType = 'application/json';
          break;

        case ExportFormat.HTML:
          content = exportAsHTML(highlights, bookTitle);
          filename = `${safeTitle}_highlights_${timestamp}.html`;
          mimeType = 'text/html';
          break;

        case ExportFormat.PDF:
          // For PDF, we would use jsPDF here
          // For now, export as HTML and let user print to PDF
          content = exportAsHTML(highlights, bookTitle);
          filename = `${safeTitle}_highlights_${timestamp}.html`;
          mimeType = 'text/html';
          alert(t('highlights.export.pdfHint', 'Open the HTML file and use Print to PDF'));
          break;

        default:
          throw new Error('Unknown export format');
      }

      downloadFile(content, filename, mimeType);

      // Close the exporter
      onClose?.();
    } catch (error) {
      console.error('Export failed:', error);
      alert(t('highlights.export.error', 'Failed to export highlights'));
    } finally {
      setIsExporting(false);
    }
  }, [highlights, exportFormat, bookTitle, bookId, t, onClose]);

  return (
    <div className="highlight-exporter">
      <div className="highlight-exporter-content">
        <h3 className="highlight-exporter-title">
          {t('highlights.export.title', 'Export Highlights')}
        </h3>

        <p className="highlight-exporter-description">
          {t('highlights.export.description', 'Export your highlights in various formats')}
        </p>

        {/* Stats */}
        <div className="highlight-exporter-stats">
          <div className="highlight-exporter-stat">
            <span className="highlight-exporter-stat-value">{highlights.length}</span>
            <span className="highlight-exporter-stat-label">
              {t('highlights.export.totalHighlights', 'Total Highlights')}
            </span>
          </div>
          <div className="highlight-exporter-stat">
            <span className="highlight-exporter-stat-value">
              {highlights.filter(h => h.note).length}
            </span>
            <span className="highlight-exporter-stat-label">
              {t('highlights.export.withNotes', 'With Notes')}
            </span>
          </div>
        </div>

        {/* Format selection */}
        <div className="highlight-exporter-formats">
          <label className="highlight-exporter-format-label">
            {t('highlights.export.selectFormat', 'Select Format')}
          </label>

          <div className="highlight-exporter-format-options">
            <label className="highlight-exporter-format-option">
              <input
                type="radio"
                name="exportFormat"
                value={ExportFormat.MARKDOWN}
                checked={exportFormat === ExportFormat.MARKDOWN}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              />
              <div className="highlight-exporter-format-info">
                <strong>Markdown</strong>
                <span className="highlight-exporter-format-desc">
                  {t('highlights.export.markdown.desc', 'Plain text with formatting')}
                </span>
              </div>
            </label>

            <label className="highlight-exporter-format-option">
              <input
                type="radio"
                name="exportFormat"
                value={ExportFormat.JSON}
                checked={exportFormat === ExportFormat.JSON}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              />
              <div className="highlight-exporter-format-info">
                <strong>JSON</strong>
                <span className="highlight-exporter-format-desc">
                  {t('highlights.export.json.desc', 'Complete data for backup')}
                </span>
              </div>
            </label>

            <label className="highlight-exporter-format-option">
              <input
                type="radio"
                name="exportFormat"
                value={ExportFormat.HTML}
                checked={exportFormat === ExportFormat.HTML}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              />
              <div className="highlight-exporter-format-info">
                <strong>HTML</strong>
                <span className="highlight-exporter-format-desc">
                  {t('highlights.export.html.desc', 'Formatted web page')}
                </span>
              </div>
            </label>

            <label className="highlight-exporter-format-option">
              <input
                type="radio"
                name="exportFormat"
                value={ExportFormat.PDF}
                checked={exportFormat === ExportFormat.PDF}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              />
              <div className="highlight-exporter-format-info">
                <strong>PDF</strong>
                <span className="highlight-exporter-format-desc">
                  {t('highlights.export.pdf.desc', 'Printable document')}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="highlight-exporter-actions">
          <button
            className="highlight-exporter-cancel-btn"
            onClick={onClose}
            disabled={isExporting}
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            className="highlight-exporter-export-btn"
            onClick={handleExport}
            disabled={isExporting || highlights.length === 0}
          >
            {isExporting
              ? t('highlights.export.exporting', 'Exporting...')
              : t('highlights.export.button', 'Export')
            }
          </button>
        </div>
      </div>

      <style jsx>{`
        .highlight-exporter {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .highlight-exporter-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
        }

        .highlight-exporter-title {
          margin: 0 0 12px 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .highlight-exporter-description {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #666;
        }

        .highlight-exporter-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .highlight-exporter-stat {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .highlight-exporter-stat-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: #64b5f6;
          margin-bottom: 4px;
        }

        .highlight-exporter-stat-label {
          display: block;
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .highlight-exporter-formats {
          margin-bottom: 24px;
        }

        .highlight-exporter-format-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }

        .highlight-exporter-format-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .highlight-exporter-format-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .highlight-exporter-format-option:hover {
          border-color: #64b5f6;
          background: #f5f9ff;
        }

        .highlight-exporter-format-option:has(input:checked) {
          border-color: #64b5f6;
          background: #e3f2fd;
        }

        .highlight-exporter-format-option input {
          margin-top: 2px;
          cursor: pointer;
        }

        .highlight-exporter-format-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .highlight-exporter-format-info strong {
          font-size: 15px;
          color: #1a1a1a;
        }

        .highlight-exporter-format-desc {
          font-size: 13px;
          color: #666;
        }

        .highlight-exporter-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .highlight-exporter-cancel-btn,
        .highlight-exporter-export-btn {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .highlight-exporter-cancel-btn {
          background: #f5f5f5;
          color: #333;
        }

        .highlight-exporter-cancel-btn:hover {
          background: #e8e8e8;
        }

        .highlight-exporter-export-btn {
          background: #64b5f6;
          color: white;
        }

        .highlight-exporter-export-btn:hover:not(:disabled) {
          background: #42a5f5;
        }

        .highlight-exporter-export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (prefers-color-scheme: dark) {
          .highlight-exporter-content {
            background: #2c2c2c;
          }

          .highlight-exporter-title {
            color: #e0e0e0;
          }

          .highlight-exporter-description {
            color: #aaa;
          }

          .highlight-exporter-stat {
            background: #1e1e1e;
          }

          .highlight-exporter-stat-label {
            color: #aaa;
          }

          .highlight-exporter-format-label {
            color: #e0e0e0;
          }

          .highlight-exporter-format-option {
            border-color: #444;
          }

          .highlight-exporter-format-option:hover {
            border-color: #64b5f6;
            background: #1e3a5f;
          }

          .highlight-exporter-format-option:has(input:checked) {
            background: #1e3a5f;
          }

          .highlight-exporter-format-info strong {
            color: #e0e0e0;
          }

          .highlight-exporter-format-desc {
            color: #aaa;
          }

          .highlight-exporter-cancel-btn {
            background: #3a3a3a;
            color: #e0e0e0;
          }

          .highlight-exporter-cancel-btn:hover {
            background: #454545;
          }
        }
      `}</style>
    </div>
  );
}
