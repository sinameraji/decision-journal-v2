import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExport } from '@/hooks/useExport';
import { Download, Loader2, FileText, FileDown } from 'lucide-react';

export function ExportSettings() {
  const { isExporting, format, setFormat, dateRange, setDateRange, handleExport } = useExport();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Export Decisions
        </h3>

        <p className="text-sm text-muted-foreground mb-6">
          Export your decision journal as a ZIP file organized by date. Each date folder contains decisions in your chosen format.
        </p>

        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Export Format
            </label>
            <div className="flex gap-3">
              <Button
                variant={format === 'pdf' ? 'default' : 'outline'}
                onClick={() => setFormat('pdf')}
                disabled={isExporting}
              >
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button
                variant={format === 'markdown' ? 'default' : 'outline'}
                onClick={() => setFormat('markdown')}
                disabled={isExporting}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Markdown
              </Button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <label htmlFor="date-range" className="text-sm font-medium text-foreground mb-2 block">
              Date Range
            </label>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)} disabled={isExporting}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="3months">Past 3 Months</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
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
