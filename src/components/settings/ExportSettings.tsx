import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useExport } from '@/hooks/useExport';
import { Download, Loader2, FileText, FileDown } from 'lucide-react';

export function ExportSettings() {
  const { isExporting, format, setFormat, dateRange, setDateRange, handleExport } = useExport();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg text-foreground mb-2">
          Export Decisions
        </h3>

        <p className="text-sm text-muted-foreground mb-6">
          Export your decision journal as a ZIP file organized by date. Each date folder contains decisions in your chosen format.
        </p>

        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <Label htmlFor="format" className="text-sm font-medium text-foreground mb-2 block">
              Export Format
            </Label>
            <div className="flex gap-3">
              <Button
                variant={format === 'pdf' ? 'default' : 'outline'}
                onClick={() => setFormat('pdf')}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant={format === 'markdown' ? 'default' : 'outline'}
                onClick={() => setFormat('markdown')}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Markdown
              </Button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <Label htmlFor="date-range" className="text-sm font-medium text-foreground mb-2 block">
              Date Range
            </Label>
            <select
              id="date-range"
              className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              disabled={isExporting}
            >
              <option value="month">Past Month</option>
              <option value="3months">Past 3 Months</option>
              <option value="year">Past Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export as ZIP
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
