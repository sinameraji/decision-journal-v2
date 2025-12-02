import jsPDF from 'jspdf';
import type { Decision } from '@/types/decision';
import type { ExportOptions, ExportResult, ExportTheme } from '@/types/export';
import { useStore } from '@/store';
import { getDateRangeFromPreset, groupDecisionsByDate, formatDateTime } from '@/utils/date-range';
import { createZipWithDateFolders } from './zip-service';
import { saveZipFile } from './file-save-service';

// Color palettes for V2
const THEME_COLORS = {
  light: {
    bg: [245, 241, 230] as [number, number, number], // #f5f1e6
    text: [74, 63, 53] as [number, number, number], // #4a3f35
    accent: [166, 124, 82] as [number, number, number], // #a67c52
    headerText: [255, 255, 255] as [number, number, number],
  },
  dark: {
    bg: [45, 38, 33] as [number, number, number], // #2d2621
    text: [236, 229, 216] as [number, number, number], // #ece5d8
    accent: [192, 160, 128] as [number, number, number], // #c0a080
    headerText: [45, 38, 33] as [number, number, number],
  },
};

class ExportService {
  /**
   * Main export function - exports decisions based on options
   */
  async exportDecisions(options: ExportOptions): Promise<ExportResult> {
    try {
      // Get date range
      const { from, to } = getDateRangeFromPreset(options.dateRange);

      // Fetch filtered decisions from store
      const allDecisions = useStore.getState().decisions;
      const decisions = allDecisions.filter(
        (d) => d.created_at >= from && d.created_at <= to
      );

      // Check if we have decisions
      if (decisions.length === 0) {
        return {
          success: false,
          error: 'No decisions found in the selected date range',
          decisionCount: 0,
        };
      }

      // Group by date
      const groupedDecisions = groupDecisionsByDate(decisions);

      // Generate ZIP
      const zipBlob = await createZipWithDateFolders(groupedDecisions, options.format);

      // Save file
      const fileName = `decisions-export-${Date.now()}.zip`;
      const saved = await saveZipFile(zipBlob, fileName);

      if (saved) {
        return {
          success: true,
          fileName,
          decisionCount: decisions.length,
        };
      } else {
        return {
          success: false,
          error: 'User cancelled save dialog or save failed',
        };
      }
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during export',
      };
    }
  }

  /**
   * Generate Markdown content for a single decision
   */
  generateMarkdownForDecision(decision: Decision): string {
    const lines: string[] = [];

    // Header
    lines.push(`# ${decision.problem_statement || 'Untitled Decision'}`);
    lines.push('');
    lines.push(`**Created**: ${formatDateTime(decision.created_at)}`);
    lines.push(`**Confidence Level**: ${decision.confidence_level}/10`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Situation
    if (decision.situation) {
      lines.push('## Situation');
      lines.push('');
      lines.push(decision.situation);
      lines.push('');
    }

    // Key Variables
    if (decision.variables && decision.variables.length > 0) {
      lines.push('## Key Variables');
      lines.push('');
      decision.variables.forEach((variable) => {
        lines.push(`- ${variable}`);
      });
      lines.push('');
    }

    // Complications
    if (decision.complications && decision.complications.length > 0) {
      lines.push('## Complications');
      lines.push('');
      decision.complications.forEach((complication) => {
        lines.push(`- ${complication}`);
      });
      lines.push('');
    }

    // Alternatives
    if (decision.alternatives && decision.alternatives.length > 0) {
      lines.push('## Alternatives Evaluated');
      lines.push('');

      decision.alternatives.forEach((alt, index) => {
        const isSelected = alt.id === decision.selected_alternative_id;
        lines.push(`### ${index + 1}. ${alt.title}${isSelected ? ' ⭐ (Selected)' : ''}`);
        lines.push('');

        if (alt.description) {
          lines.push(alt.description);
          lines.push('');
        }

        if (alt.pros && alt.pros.length > 0) {
          lines.push('**Pros:**');
          alt.pros.forEach((pro) => {
            lines.push(`- ${pro}`);
          });
          lines.push('');
        }

        if (alt.cons && alt.cons.length > 0) {
          lines.push('**Cons:**');
          alt.cons.forEach((con) => {
            lines.push(`- ${con}`);
          });
          lines.push('');
        }

        if (alt.estimated_effort) {
          lines.push(`**Effort**: ${alt.estimated_effort}`);
        }
        if (alt.estimated_cost) {
          lines.push(`**Cost**: ${alt.estimated_cost}`);
        }
        if (alt.reversibility) {
          lines.push(`**Reversibility**: ${alt.reversibility}`);
        }
        if (alt.success_probability !== undefined) {
          lines.push(`**Success Probability**: ${alt.success_probability}%`);
        }
        lines.push('');
      });
    }

    // Outcome Projections
    lines.push('## Outcome Projections');
    lines.push('');

    if (decision.expected_outcome) {
      lines.push('**Expected Outcome**:');
      lines.push(decision.expected_outcome);
      lines.push('');
    }

    if (decision.best_case_scenario) {
      lines.push('**Best Case Scenario**:');
      lines.push(decision.best_case_scenario);
      lines.push('');
    }

    if (decision.worst_case_scenario) {
      lines.push('**Worst Case Scenario**:');
      lines.push(decision.worst_case_scenario);
      lines.push('');
    }

    // Mental & Physical Context
    lines.push('## Mental & Physical Context');
    lines.push('');

    if (decision.mental_state) {
      lines.push(`**Mental State**: ${decision.mental_state}`);
    }
    if (decision.physical_state) {
      lines.push(`**Physical State**: ${decision.physical_state}`);
    }
    if (decision.time_of_day) {
      lines.push(`**Time of Day**: ${decision.time_of_day}`);
    }
    if (decision.emotional_flags && decision.emotional_flags.length > 0) {
      lines.push(`**Emotional Flags**: ${decision.emotional_flags.join(', ')}`);
    }
    lines.push('');

    // Review (if available)
    if (decision.actual_outcome || decision.outcome_rating || decision.lessons_learned) {
      lines.push('## Review');
      lines.push('');

      if (decision.actual_outcome) {
        lines.push('**Actual Outcome**:');
        lines.push(decision.actual_outcome);
        lines.push('');
      }

      if (decision.outcome_rating !== null) {
        lines.push(`**Outcome Rating**: ${decision.outcome_rating}/10`);
        lines.push('');
      }

      if (decision.lessons_learned) {
        lines.push('**Lessons Learned**:');
        lines.push(decision.lessons_learned);
        lines.push('');
      }
    }

    // Tags
    if (decision.tags && decision.tags.length > 0) {
      lines.push(`**Tags**: ${decision.tags.map((tag) => `#${tag}`).join(' ')}`);
      lines.push('');
    }

    lines.push('---');

    return lines.join('\n');
  }

  /**
   * Generate PDF content for a single decision with theme support
   */
  generatePDFForDecision(decision: Decision, theme: ExportTheme = 'light'): ArrayBuffer {
    const doc = new jsPDF();
    const colors = THEME_COLORS[theme];

    // PDF settings
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Set page background color
    doc.setFillColor(...colors.bg);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');

      const lines = doc.splitTextToSize(text, maxWidth);

      // Check if we need a new page
      if (yPosition + lines.length * fontSize * 0.5 > pageHeight - margin) {
        doc.addPage();
        // Set background for new page
        doc.setFillColor(...colors.bg);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPosition = margin;
      }

      doc.text(lines, margin, yPosition);
      yPosition += lines.length * fontSize * 0.5 + 3;
    };

    // Helper function to add a section header
    const addSectionHeader = (title: string) => {
      yPosition += 5;
      doc.setFillColor(...colors.accent);
      doc.rect(margin, yPosition - 5, maxWidth, 8, 'F');
      doc.setTextColor(...colors.headerText);
      addText(title, 14, true);
      doc.setTextColor(...colors.text);
      yPosition += 2;
    };

    // Helper function to add a bullet list
    const addBulletList = (items: string[]) => {
      items.forEach((item) => {
        const bulletText = `• ${item}`;
        addText(bulletText, 11);
      });
      yPosition += 3;
    };

    // Set initial text color
    doc.setTextColor(...colors.text);

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(decision.problem_statement || 'Untitled Decision', maxWidth);
    doc.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 9 + 5;

    // Metadata
    addText(`Created: ${formatDateTime(decision.created_at)}`, 10);
    addText(`Confidence Level: ${decision.confidence_level}/10`, 10);
    yPosition += 5;

    // Situation
    if (decision.situation) {
      addSectionHeader('Situation');
      addText(decision.situation);
    }

    // Key Variables
    if (decision.variables && decision.variables.length > 0) {
      addSectionHeader('Key Variables');
      addBulletList(decision.variables);
    }

    // Complications
    if (decision.complications && decision.complications.length > 0) {
      addSectionHeader('Complications');
      addBulletList(decision.complications);
    }

    // Alternatives
    if (decision.alternatives && decision.alternatives.length > 0) {
      addSectionHeader('Alternatives Evaluated');

      decision.alternatives.forEach((alt, index) => {
        const isSelected = alt.id === decision.selected_alternative_id;
        addText(`${index + 1}. ${alt.title}${isSelected ? ' ⭐ (Selected)' : ''}`, 13, true);

        if (alt.description) {
          addText(alt.description, 11);
        }

        if (alt.pros && alt.pros.length > 0) {
          addText('Pros:', 11, true);
          addBulletList(alt.pros);
        }

        if (alt.cons && alt.cons.length > 0) {
          addText('Cons:', 11, true);
          addBulletList(alt.cons);
        }

        const details: string[] = [];
        if (alt.estimated_effort) details.push(`Effort: ${alt.estimated_effort}`);
        if (alt.estimated_cost) details.push(`Cost: ${alt.estimated_cost}`);
        if (alt.reversibility) details.push(`Reversibility: ${alt.reversibility}`);
        if (alt.success_probability !== undefined)
          details.push(`Success Probability: ${alt.success_probability}%`);

        if (details.length > 0) {
          addText(details.join(' | '), 10);
        }

        yPosition += 3;
      });
    }

    // Outcome Projections
    addSectionHeader('Outcome Projections');

    if (decision.expected_outcome) {
      addText('Expected Outcome:', 11, true);
      addText(decision.expected_outcome, 11);
    }

    if (decision.best_case_scenario) {
      addText('Best Case Scenario:', 11, true);
      addText(decision.best_case_scenario, 11);
    }

    if (decision.worst_case_scenario) {
      addText('Worst Case Scenario:', 11, true);
      addText(decision.worst_case_scenario, 11);
    }

    // Mental & Physical Context
    addSectionHeader('Mental & Physical Context');

    const contextLines: string[] = [];
    if (decision.mental_state) contextLines.push(`Mental State: ${decision.mental_state}`);
    if (decision.physical_state) contextLines.push(`Physical State: ${decision.physical_state}`);
    if (decision.time_of_day) contextLines.push(`Time of Day: ${decision.time_of_day}`);
    if (decision.emotional_flags && decision.emotional_flags.length > 0) {
      contextLines.push(`Emotional Flags: ${decision.emotional_flags.join(', ')}`);
    }

    contextLines.forEach((line) => addText(line, 11));

    // Review (if available)
    if (decision.actual_outcome || decision.outcome_rating !== null || decision.lessons_learned) {
      addSectionHeader('Review');

      if (decision.actual_outcome) {
        addText('Actual Outcome:', 11, true);
        addText(decision.actual_outcome, 11);
      }

      if (decision.outcome_rating !== null) {
        addText(`Outcome Rating: ${decision.outcome_rating}/10`, 11);
      }

      if (decision.lessons_learned) {
        addText('Lessons Learned:', 11, true);
        addText(decision.lessons_learned, 11);
      }
    }

    // Tags
    if (decision.tags && decision.tags.length > 0) {
      yPosition += 5;
      addText(`Tags: ${decision.tags.map((tag) => `#${tag}`).join(' ')}`, 10);
    }

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
        align: 'center',
      });
    }

    return doc.output('arraybuffer') as ArrayBuffer;
  }
}

export const exportService = new ExportService();
