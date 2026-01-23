/**
 * Export formats for highlights
 */

import type { Highlight, HighlightColor } from '@/lib/types/highlights';

/**
 * Group highlights by chapter
 */
export function groupHighlightsByChapter(highlights: Highlight[]): Map<string, Highlight[]> {
  const byChapter = new Map<string, Highlight[]>();

  for (const highlight of highlights) {
    const href = highlight.locator.href;
    const existing = byChapter.get(href) || [];
    existing.push(highlight);
    byChapter.set(href, existing);
  }

  return byChapter;
}

/**
 * Format date for export
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get color emoji
 */
function getColorEmoji(color: HighlightColor): string {
  const emojis: Record<HighlightColor, string> = {
    yellow: '🟨',
    green: '🟩',
    blue: '🟦',
    pink: '🟪',
    orange: '🟧',
    purple: '🟪',
  };
  return emojis[color] || '⬜';
}

/**
 * Export highlights as Markdown
 */
export function exportAsMarkdown(
  highlights: Highlight[],
  bookTitle?: string
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${bookTitle || 'Highlights'}`);
  lines.push('');
  lines.push(`*Exported on ${formatDate(Date.now())}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Group by chapter
  const byChapter = groupHighlightsByChapter(highlights);

  for (const [href, chapterHighlights] of byChapter.entries()) {
    // Chapter title (use href as fallback)
    const chapterTitle = href.replace('.xhtml', '').replace('.html', '');
    lines.push(`## ${chapterTitle}`);
    lines.push('');

    for (const highlight of chapterHighlights) {
      // Color indicator
      lines.push(`${getColorEmoji(highlight.color)} **${highlight.color.toUpperCase()}**`);
      lines.push('');

      // Quote
      lines.push(`> ${highlight.locator.text.highlight}`);
      lines.push('');

      // Note if present
      if (highlight.note) {
        lines.push(`**Note:** ${highlight.note}`);
        lines.push('');
      }

      // Metadata
      const progression = highlight.locator.locations.progression;
      const progressStr = progression ? `${Math.round(progression * 100)}%` : 'Unknown';
      lines.push(`*Position: ${progressStr} · ${formatDate(highlight.createdAt)}*`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Export highlights as JSON
 */
export function exportAsJSON(
  highlights: Highlight[],
  bookTitle?: string,
  bookId?: string
): string {
  const data = {
    metadata: {
      bookTitle,
      bookId,
      exportDate: new Date().toISOString(),
      totalHighlights: highlights.length,
    },
    highlights,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Export highlights as HTML
 */
export function exportAsHTML(
  highlights: Highlight[],
  bookTitle?: string
): string {
  const byChapter = groupHighlightsByChapter(highlights);

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bookTitle || 'Highlights'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #1a1a1a; }
    h2 {
      color: #2c3e50;
      border-bottom: 2px solid #eee;
      padding-bottom: 0.5rem;
      margin-top: 2rem;
    }
    .highlight {
      margin: 1.5rem 0;
      padding: 1rem;
      border-left: 4px solid #ddd;
      background: #f9f9f9;
    }
    .highlight-yellow { border-left-color: #ffd54f; }
    .highlight-green { border-left-color: #81c784; }
    .highlight-blue { border-left-color: #64b5f6; }
    .highlight-pink { border-left-color: #f06292; }
    .highlight-orange { border-left-color: #ffb74d; }
    .highlight-purple { border-left-color: #ba68c8; }
    .color-tag {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .quote {
      font-size: 1.1rem;
      font-style: italic;
      margin: 1rem 0;
    }
    .note {
      background: #fff3cd;
      padding: 0.75rem;
      border-radius: 4px;
      margin: 1rem 0;
    }
    .metadata {
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.5rem;
    }
    .export-info {
      background: #e3f2fd;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 2rem;
    }
  </style>
</head>
<body>
  <h1>${bookTitle || 'Highlights'}</h1>
  <div class="export-info">
    <strong>Exported:</strong> ${formatDate(Date.now())}<br>
    <strong>Total Highlights:</strong> ${highlights.length}
  </div>
`;

  for (const [href, chapterHighlights] of byChapter.entries()) {
    const chapterTitle = href.replace('.xhtml', '').replace('.html', '');
    html += `  <h2>${chapterTitle}</h2>\n`;

    for (const highlight of chapterHighlights) {
      html += `  <div class="highlight highlight-${highlight.color}">\n`;
      html += `    <div class="color-tag" style="background-color: ${getColorBg(highlight.color)};">${highlight.color.toUpperCase()}</div>\n`;
      html += `    <div class="quote">"${escapeHtml(highlight.locator.text.highlight)}"</div>\n`;

      if (highlight.note) {
        html += `    <div class="note"><strong>Note:</strong> ${escapeHtml(highlight.note)}</div>\n`;
      }

      const progression = highlight.locator.locations.progression;
      const progressStr = progression ? `${Math.round(progression * 100)}%` : 'Unknown';
      html += `    <div class="metadata">Position: ${progressStr} · ${formatDate(highlight.createdAt)}</div>\n`;
      html += `  </div>\n`;
    }
  }

  html += `
</body>
</html>`;

  return html;
}

function getColorBg(color: HighlightColor): string {
  const colors: Record<HighlightColor, string> = {
    yellow: '#fff59d',
    green: '#a5d6a7',
    blue: '#90caf9',
    pink: '#f48fb1',
    orange: '#ffcc80',
    purple: '#ce93d8',
  };
  return colors[color];
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Download a file with given content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
