import type { Decision } from './decision';

export type ExportFormat = 'pdf' | 'markdown';
export type DateRangePreset = 'month' | '3months' | 'year' | 'all';
export type ExportTheme = 'light' | 'dark';

export interface ExportOptions {
  format: ExportFormat;
  dateRange: DateRangePreset;
}

export interface SingleDecisionExportOptions {
  format: 'pdf' | 'print';
  theme: ExportTheme;
}

export interface ExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
  decisionCount?: number;
}

export interface GroupedDecisions {
  [dateKey: string]: Decision[]; // dateKey: YYYY-MM-DD format
}
