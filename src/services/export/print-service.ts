import type { Decision } from '@/types/decision';
import type { ExportTheme } from '@/types/export';
import { formatDateTime } from '@/utils/date-range';

// Color palettes for print
const THEME_STYLES = {
  light: {
    bg: '#f5f1e6',
    card: '#fffcf5',
    text: '#4a3f35',
    accent: '#a67c52',
    muted: '#6b5d4f',
    border: '#e2d8c3',
  },
  dark: {
    bg: '#2d2621',
    card: '#3a322c',
    text: '#ece5d8',
    accent: '#c0a080',
    muted: '#a89885',
    border: '#4a4039',
  },
};

class PrintService {
  /**
   * Generate print-friendly HTML for a decision with specified theme
   */
  generatePrintHTML(decision: Decision, theme: ExportTheme): string {
    const colors = THEME_STYLES[theme];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${decision.problem_statement || 'Decision'}</title>
  <style>
    @page {
      margin: 1cm;
      size: A4;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Libre Baskerville', 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: ${colors.text};
      background-color: ${colors.bg};
      padding: 20px;
    }

    h1 {
      font-family: 'Libre Baskerville', serif;
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 16px;
      color: ${colors.text};
    }

    h2 {
      font-family: 'Libre Baskerville', serif;
      font-size: 16pt;
      font-weight: bold;
      margin-top: 24px;
      margin-bottom: 12px;
      color: ${colors.text};
      border-bottom: 2px solid ${colors.accent};
      padding-bottom: 4px;
    }

    h3 {
      font-family: 'Libre Baskerville', serif;
      font-size: 14pt;
      font-weight: bold;
      margin-top: 16px;
      margin-bottom: 8px;
      color: ${colors.text};
    }

    p {
      margin-bottom: 12px;
      color: ${colors.text};
    }

    .metadata {
      font-size: 10pt;
      color: ${colors.muted};
      margin-bottom: 20px;
    }

    .card {
      background-color: ${colors.card};
      border: 1px solid ${colors.border};
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .card-title {
      font-family: 'Libre Baskerville', serif;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 16px;
      color: ${colors.text};
    }

    ul {
      margin-left: 20px;
      margin-bottom: 12px;
    }

    li {
      margin-bottom: 6px;
      color: ${colors.text};
    }

    .alternative {
      background-color: ${colors.bg};
      border: 1px solid ${colors.border};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .alternative.selected {
      border: 2px solid ${colors.accent};
      background-color: ${theme === 'light' ? 'rgba(166, 124, 82, 0.05)' : 'rgba(192, 160, 128, 0.1)'};
    }

    .alternative-title {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 8px;
      color: ${colors.text};
    }

    .badge {
      display: inline-block;
      background-color: ${colors.accent};
      color: ${theme === 'light' ? '#fff' : colors.text};
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: bold;
      margin-left: 8px;
    }

    .tags {
      margin-top: 16px;
    }

    .tag {
      display: inline-block;
      background-color: ${colors.border};
      color: ${colors.text};
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 10pt;
      margin-right: 8px;
      margin-bottom: 8px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 12px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 12px;
    }

    .confidence-bar {
      width: 100%;
      height: 8px;
      background-color: ${colors.border};
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }

    .confidence-fill {
      height: 100%;
      background-color: ${colors.accent};
    }

    .section-label {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 4px;
      color: ${colors.text};
    }

    .section-content {
      color: ${colors.muted};
      font-size: 11pt;
    }

    @media print {
      body {
        background-color: ${colors.bg};
      }

      .card {
        page-break-inside: avoid;
      }

      .alternative {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(decision.problem_statement || 'Untitled Decision')}</h1>

  <div class="metadata">
    <p><strong>Created:</strong> ${formatDateTime(decision.created_at)}</p>
    <p><strong>Confidence Level:</strong> ${decision.confidence_level}/10</p>
  </div>

  ${decision.tags && decision.tags.length > 0 ? `
    <div class="tags">
      ${decision.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
    </div>
  ` : ''}

  <div class="card">
    <div class="card-title">Situation</div>
    <p>${this.escapeHtml(decision.situation).replace(/\n/g, '<br>')}</p>

    ${decision.variables && decision.variables.length > 0 ? `
      <h3>Key Variables</h3>
      <ul>
        ${decision.variables.map(v => `<li>${this.escapeHtml(v)}</li>`).join('')}
      </ul>
    ` : ''}

    ${decision.complications && decision.complications.length > 0 ? `
      <h3>Complications</h3>
      <ul>
        ${decision.complications.map(c => `<li>${this.escapeHtml(c)}</li>`).join('')}
      </ul>
    ` : ''}
  </div>

  <div class="card">
    <div class="card-title">Alternatives Considered</div>
    ${decision.alternatives && decision.alternatives.length > 0 ? decision.alternatives.map(alt => {
      const isSelected = alt.id === decision.selected_alternative_id;
      return `
        <div class="alternative ${isSelected ? 'selected' : ''}">
          <div class="alternative-title">
            ${this.escapeHtml(alt.title)}
            ${isSelected ? '<span class="badge">Selected</span>' : ''}
          </div>
          ${alt.description ? `<p>${this.escapeHtml(alt.description)}</p>` : ''}

          <div class="grid-2">
            ${alt.pros && alt.pros.length > 0 ? `
              <div>
                <h3>Pros</h3>
                <ul>
                  ${alt.pros.map(pro => `<li>${this.escapeHtml(pro)}</li>`).join('')}
                </ul>
              </div>
            ` : '<div></div>'}

            ${alt.cons && alt.cons.length > 0 ? `
              <div>
                <h3>Cons</h3>
                <ul>
                  ${alt.cons.map(con => `<li>${this.escapeHtml(con)}</li>`).join('')}
                </ul>
              </div>
            ` : '<div></div>'}
          </div>
        </div>
      `;
    }).join('') : '<p>No alternatives recorded</p>'}
  </div>

  <div class="card">
    <div class="card-title">Decision & Expected Outcome</div>

    <div class="section-label">Expected Outcome</div>
    <p class="section-content">${this.escapeHtml(decision.expected_outcome).replace(/\n/g, '<br>')}</p>

    <div class="grid-2">
      <div>
        <div class="section-label">Best Case Scenario</div>
        <p class="section-content">${this.escapeHtml(decision.best_case_scenario).replace(/\n/g, '<br>')}</p>
      </div>
      <div>
        <div class="section-label">Worst Case Scenario</div>
        <p class="section-content">${this.escapeHtml(decision.worst_case_scenario).replace(/\n/g, '<br>')}</p>
      </div>
    </div>

    <div class="section-label">Confidence Level: ${decision.confidence_level}/10</div>
    <div class="confidence-bar">
      <div class="confidence-fill" style="width: ${decision.confidence_level * 10}%"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Mental Context</div>
    <div class="grid-3">
      ${decision.mental_state ? `
        <div>
          <div class="section-label">Mental State</div>
          <p class="section-content">${this.escapeHtml(decision.mental_state)}</p>
        </div>
      ` : ''}
      ${decision.physical_state ? `
        <div>
          <div class="section-label">Physical State</div>
          <p class="section-content">${this.escapeHtml(decision.physical_state)}</p>
        </div>
      ` : ''}
      ${decision.time_of_day ? `
        <div>
          <div class="section-label">Time of Day</div>
          <p class="section-content">${this.escapeHtml(decision.time_of_day)}</p>
        </div>
      ` : ''}
    </div>

    ${decision.emotional_flags && decision.emotional_flags.length > 0 ? `
      <div class="section-label">Emotional Flags</div>
      <div class="tags">
        ${decision.emotional_flags.map(flag => `<span class="tag">${this.escapeHtml(flag)}</span>`).join('')}
      </div>
    ` : ''}
  </div>

  ${decision.actual_outcome ? `
    <div class="card">
      <div class="card-title">Actual Outcome</div>
      <p>${this.escapeHtml(decision.actual_outcome).replace(/\n/g, '<br>')}</p>

      ${decision.outcome_rating !== null ? `
        <div class="section-label">Outcome Rating: ${decision.outcome_rating}/10</div>
        <div class="confidence-bar">
          <div class="confidence-fill" style="width: ${decision.outcome_rating * 10}%"></div>
        </div>
      ` : ''}

      ${decision.lessons_learned ? `
        <div class="section-label">Lessons Learned</div>
        <p class="section-content">${this.escapeHtml(decision.lessons_learned).replace(/\n/g, '<br>')}</p>
      ` : ''}
    </div>
  ` : ''}
</body>
</html>
    `;

    return html;
  }

  /**
   * Open browser print dialog with themed content
   */
  printDecision(decision: Decision, theme: ExportTheme): void {
    const html = this.generatePrintHTML(decision, theme);

    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    // Write content to iframe
    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      console.error('Could not access iframe document');
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for content to load, then print
    iframe.contentWindow?.addEventListener('load', () => {
      setTimeout(() => {
        iframe.contentWindow?.print();

        // Clean up after print dialog closes (or after a delay)
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 100);
    });
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export const printService = new PrintService();
