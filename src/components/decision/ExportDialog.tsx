import { useState } from 'react';
import type { Decision } from '@/types/decision';
import type { ExportTheme } from '@/types/export';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Printer, Download, Loader2 } from 'lucide-react';
import { exportService } from '@/services/export/export-service';
import { printService } from '@/services/export/print-service';
import { savePDFFile } from '@/services/export/file-save-service';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: Decision;
}

export function ExportDialog({ open, onOpenChange, decision }: ExportDialogProps) {
  const [selectedTheme, setSelectedTheme] = useState<ExportTheme>('light');
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    try {
      printService.printDecision(decision, selectedTheme);
      toast.success('Opening print dialog...');
      onOpenChange(false);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to open print dialog');
    }
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      // Generate PDF
      const pdfData = exportService.generatePDFForDecision(decision, selectedTheme);
      const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });

      // Create filename
      const dateStr = format(decision.created_at, 'yyyy-MM-dd');
      const problemSlug = decision.problem_statement
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
      const fileName = `decision-${problemSlug}-${dateStr}.pdf`;

      // Save file
      const saved = await savePDFFile(pdfBlob, fileName);

      if (saved) {
        toast.success('PDF exported successfully');
        onOpenChange(false);
      } else {
        toast.info('Export cancelled');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Export Decision</DialogTitle>
          <DialogDescription>
            Choose theme and export format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Theme Selection */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Theme
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedTheme === 'light' ? 'default' : 'outline'}
                onClick={() => setSelectedTheme('light')}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={selectedTheme === 'dark' ? 'default' : 'outline'}
                onClick={() => setSelectedTheme('dark')}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
