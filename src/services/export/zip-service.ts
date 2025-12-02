import JSZip from 'jszip';
import type { GroupedDecisions, ExportFormat } from '@/types/export';
import { exportService } from './export-service';
import { useStore } from '@/store';

/**
 * Create a ZIP file with date-based folders
 * Structure: decisions-export-[timestamp].zip
 *   ├── 2024-01-15/
 *   │   ├── decision-abc123.pdf (or .md)
 *   │   └── decision-def456.pdf
 *   └── 2024-01-20/
 *       └── decision-ghi789.pdf
 */
export async function createZipWithDateFolders(
  groupedDecisions: GroupedDecisions,
  format: ExportFormat
): Promise<Blob> {
  const zip = new JSZip();

  // Get current theme for PDF generation
  const currentTheme = useStore.getState().theme;
  const effectiveTheme = currentTheme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : currentTheme;

  // Iterate through each date folder
  for (const [dateKey, decisions] of Object.entries(groupedDecisions)) {
    // Create folder for this date
    const dateFolder = zip.folder(dateKey);

    if (!dateFolder) {
      throw new Error(`Failed to create folder for date: ${dateKey}`);
    }

    // Add each decision to the date folder
    for (const decision of decisions) {
      const fileName = `decision-${decision.id}.${format === 'pdf' ? 'pdf' : 'md'}`;

      let content: string | ArrayBuffer;

      if (format === 'pdf') {
        content = exportService.generatePDFForDecision(decision, effectiveTheme);
      } else {
        content = exportService.generateMarkdownForDecision(decision);
      }

      dateFolder.file(fileName, content);
    }
  }

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}
