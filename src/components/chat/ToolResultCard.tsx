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
  compact?: boolean;
}

/**
 * Truncate markdown by stripping formatting and limiting length
 */
function truncateMarkdown(markdown: string, maxLength: number): string {
  // Strip markdown formatting for preview
  const plainText = markdown
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/\*\*/g, '') // Bold
    .replace(/\*/g, '') // Italic
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
    .replace(/`/g, '') // Code

  if (plainText.length <= maxLength) return plainText
  return plainText.substring(0, maxLength) + '...'
}

export function ToolResultCard({ toolName, result, compact = true }: ToolResultCardProps) {
  if (compact) {
    return <CompactToolResult toolName={toolName} result={result} />
  }

  return <FullToolResult toolName={toolName} result={result} />
}

/**
 * Compact Tool Result - More conversational, less card-like
 */
function CompactToolResult({ toolName, result }: { toolName: string; result: ToolResult }) {
  const [expanded, setExpanded] = useState(false)

  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="border-l-2 border-l-primary/50 pl-4 py-2">
      <div className="flex items-center gap-2 text-sm mb-1">
        {result.success ? (
          <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
        )}
        <span className="font-medium text-foreground">{toolName}</span>
        <span className="text-xs text-muted-foreground">
          • {formatExecutionTime(result.executionTimeMs)}
        </span>
        {result.metadata && typeof result.metadata.decisionsAnalyzed === 'number' && (
          <span className="text-xs text-muted-foreground">
            • {result.metadata.decisionsAnalyzed} decision
            {result.metadata.decisionsAnalyzed === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* Error message */}
      {!result.success && result.error && (
        <div className="text-sm text-red-800 dark:text-red-200 mt-1">
          {String(result.error)}
        </div>
      )}

      {/* Markdown summary */}
      {result.success && result.markdown && (
        <div className="text-sm text-muted-foreground mt-1">
          {!expanded ? (
            <>
              {truncateMarkdown(result.markdown, 150)}
              {result.markdown.length > 150 && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-primary hover:underline ml-1"
                >
                  Show more
                </button>
              )}
            </>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none mt-2">
              <ReactMarkdown>{result.markdown}</ReactMarkdown>
              <button
                onClick={() => setExpanded(false)}
                className="text-primary hover:underline text-sm"
              >
                Show less
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Full Tool Result - Original card design
 */
function FullToolResult({ toolName, result }: { toolName: string; result: ToolResult }) {
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
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {toolName}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
        <div className="border-b border-border">
          <button
            onClick={() => setIsMarkdownCollapsed(!isMarkdownCollapsed)}
            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-muted transition-colors"
          >
            {isMarkdownCollapsed ? (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">
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
            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-muted transition-colors"
          >
            {isDataExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">
              Raw Data
            </span>
          </button>
          {isDataExpanded && (
            <div className="px-4 py-3 bg-muted">
              <pre className="text-xs text-foreground overflow-x-auto">
                {JSON.stringify(result.data || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
