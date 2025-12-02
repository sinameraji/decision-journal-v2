import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Decision, DecisionFilters } from '@/types/decision';
import { FilterChip } from './FilterChip';
import { TagFilter } from './TagFilter';
import { EmotionalFlagsFilter } from './EmotionalFlagsFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { ConfidenceRangeFilter } from './ConfidenceRangeFilter';
import { OutcomeFilter } from './OutcomeFilter';

interface SearchFiltersPanelProps {
  filters: DecisionFilters;
  onChange: (filters: DecisionFilters) => void;
  decisions: Decision[];
}

export function SearchFiltersPanel({ filters, onChange, decisions }: SearchFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate active filter count
  const activeFilterCount = [
    filters.tags?.length || 0,
    filters.emotional_flags?.length || 0,
    filters.date_from ? 1 : 0,
    filters.date_to ? 1 : 0,
    filters.confidence_min !== undefined ? 1 : 0,
    filters.confidence_max !== undefined ? 1 : 0,
    filters.has_outcome !== undefined ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  // Build active filter chips
  const activeFilterChips: Array<{ label: string; onRemove: () => void }> = [];

  // Tags
  filters.tags?.forEach((tag) => {
    activeFilterChips.push({
      label: tag,
      onRemove: () => onChange({ ...filters, tags: filters.tags?.filter((t) => t !== tag) }),
    });
  });

  // Emotional flags
  filters.emotional_flags?.forEach((flag) => {
    activeFilterChips.push({
      label: `Flag: ${flag}`,
      onRemove: () => onChange({ ...filters, emotional_flags: filters.emotional_flags?.filter((f) => f !== flag) }),
    });
  });

  // Date range
  if (filters.date_from) {
    activeFilterChips.push({
      label: `From: ${new Date(filters.date_from).toLocaleDateString()}`,
      onRemove: () => onChange({ ...filters, date_from: undefined }),
    });
  }
  if (filters.date_to) {
    activeFilterChips.push({
      label: `To: ${new Date(filters.date_to).toLocaleDateString()}`,
      onRemove: () => onChange({ ...filters, date_to: undefined }),
    });
  }

  // Confidence range
  if (filters.confidence_min !== undefined) {
    activeFilterChips.push({
      label: `Min confidence: ${filters.confidence_min}`,
      onRemove: () => onChange({ ...filters, confidence_min: undefined }),
    });
  }
  if (filters.confidence_max !== undefined) {
    activeFilterChips.push({
      label: `Max confidence: ${filters.confidence_max}`,
      onRemove: () => onChange({ ...filters, confidence_max: undefined }),
    });
  }

  // Outcome status
  if (filters.has_outcome !== undefined) {
    activeFilterChips.push({
      label: filters.has_outcome ? 'Reviewed' : 'Not Reviewed',
      onRemove: () => onChange({ ...filters, has_outcome: undefined }),
    });
  }

  const handleClearAll = () => {
    onChange({
      search: filters.search, // Preserve search query
      tags: undefined,
      emotional_flags: undefined,
      date_from: undefined,
      date_to: undefined,
      confidence_min: undefined,
      confidence_max: undefined,
      has_outcome: undefined,
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear All
              </button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Active filter chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activeFilterChips.map((chip, index) => (
              <FilterChip
                key={`${chip.label}-${index}`}
                label={chip.label}
                onRemove={chip.onRemove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          <TagFilter
            value={filters.tags || []}
            onChange={(tags) => onChange({ ...filters, tags: tags.length > 0 ? tags : undefined })}
            decisions={decisions}
          />

          <div className="border-t border-border pt-6">
            <EmotionalFlagsFilter
              value={filters.emotional_flags || []}
              onChange={(flags) => onChange({ ...filters, emotional_flags: flags.length > 0 ? flags : undefined })}
            />
          </div>

          <div className="border-t border-border pt-6">
            <DateRangeFilter
              value={{ from: filters.date_from, to: filters.date_to }}
              onChange={(range) => onChange({ ...filters, date_from: range.from, date_to: range.to })}
            />
          </div>

          <div className="border-t border-border pt-6">
            <ConfidenceRangeFilter
              value={{ min: filters.confidence_min, max: filters.confidence_max }}
              onChange={(range) => onChange({ ...filters, confidence_min: range.min, confidence_max: range.max })}
            />
          </div>

          <div className="border-t border-border pt-6">
            <OutcomeFilter
              value={filters.has_outcome}
              onChange={(state) => onChange({ ...filters, has_outcome: state })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
