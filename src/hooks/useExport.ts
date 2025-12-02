import { useState } from 'react';
import { toast } from 'sonner';
import type { ExportFormat, DateRangePreset } from '@/types/export';
import { exportService } from '@/services/export/export-service';
import { isTauri } from '@/utils/platform';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const result = await exportService.exportDecisions({ format, dateRange });

      if (result.success) {
        toast.success(`Successfully exported ${result.decisionCount} decision${result.decisionCount !== 1 ? 's' : ''}`);

        // Send desktop notification (Tauri mode only)
        if (isTauri() && result.fileName && result.decisionCount) {
          try {
            // Import Tauri notification plugin dynamically
            const { sendNotification } = await import('@tauri-apps/plugin-notification');
            await sendNotification({
              title: 'Export Complete',
              body: `Successfully exported ${result.decisionCount} decision${result.decisionCount !== 1 ? 's' : ''}`,
            });
          } catch (notifError) {
            // Notification failure shouldn't break the export flow
            console.warn('Failed to send desktop notification:', notifError);
          }
        }
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      toast.error('Failed to export decisions');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    format,
    setFormat,
    dateRange,
    setDateRange,
    handleExport,
  };
}
