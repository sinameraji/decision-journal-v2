/**
 * Tool Result Card Component
 *
 * Displays tool execution results with collapsible markdown summary
 * and expandable raw JSON data.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ToolResult } from '../../services/tools/tool-types';
import ReactMarkdown from 'react-markdown';

interface ToolResultCardProps {
  toolName: string;
  toolIcon?: string;
  result: ToolResult;
}

export function ToolResultCard({ toolName, result }: ToolResultCardProps) {
  const [isMarkdownCollapsed, setIsMarkdownCollapsed] = useState(false);
  const [isDataExpanded, setIsDataExpanded] = useState(false);

  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div
      className={`border-l-4 rounded-lg ${
        result.success
          ? 'border-l-green-500 bg-green-50 dark:bg-green-900/10'
          : 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {toolName}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatExecutionTime(result.executionTimeMs)}
                </span>
                {result.metadata && typeof result.metadata.decisionsAnalyzed === 'number' && (
                  <span>
                    Analyzed {result.metadata.decisionsAnalyzed} decision
                    {result.metadata.decisionsAnalyzed === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {!result.success && result.error ? (
        <div className="px-4 py-3 bg-red-100 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{String(result.error)}</p>
        </div>
      ) : null}

      {/* Markdown Summary */}
      {result.success && result.markdown ? (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsMarkdownCollapsed(!isMarkdownCollapsed)}
            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isMarkdownCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Analysis Summary
            </span>
          </button>
          {!isMarkdownCollapsed && (
            <div className="px-4 py-3 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{result.markdown}</ReactMarkdown>
            </div>
          )}
        </div>
      ) : null}

      {/* Raw Data (Expandable) */}
      {result.success && result.data ? (
        <div>
          <button
            onClick={() => setIsDataExpanded(!isDataExpanded)}
            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDataExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Raw Data
            </span>
          </button>
          {isDataExpanded && (
            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800">
              <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                {JSON.stringify(result.data || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
