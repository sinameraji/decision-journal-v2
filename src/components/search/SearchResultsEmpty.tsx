import { Search } from 'lucide-react';

interface SearchResultsEmptyProps {
  hasActiveFilters: boolean;
}

export function SearchResultsEmpty({ hasActiveFilters }: SearchResultsEmptyProps) {
  if (!hasActiveFilters) {
    // No search or filters applied
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Start Searching</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Enter a search term or apply filters to find relevant decisions.
        </p>
      </div>
    );
  }

  // Search/filters applied but no results
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Decisions Found</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        No decisions match your current search and filters.
      </p>
      <ul className="text-sm text-muted-foreground space-y-1">
        <li>• Try using different keywords</li>
        <li>• Remove some filters</li>
        <li>• Check for typos</li>
        <li>• Use broader search terms</li>
      </ul>
    </div>
  );
}
