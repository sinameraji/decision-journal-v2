import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, ArrowLeft, X } from 'lucide-react';
import { SearchFiltersPanel } from '@/components/search/SearchFiltersPanel';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { SearchResultsEmpty } from '@/components/search/SearchResultsEmpty';
import { useDebounce } from '@/hooks/use-debounce';
import { getMatchedFields } from '@/utils/search-utils';
import { FILTER_DEBOUNCE_MS } from '@/constants/search';
import type { DecisionFilters } from '@/types/decision';

export function SearchPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/search' });
  const queryParam = (searchParams as { q?: string }).q || '';

  const [searchInput, setSearchInput] = useState(queryParam);
  const [filters, setFilters] = useState<DecisionFilters>({
    search: queryParam || undefined,
  });

  const decisions = useStore((state) => state.decisions);
  const searchDecisions = useStore((state) => state.searchDecisions);
  const isLoading = useStore((state) => state.isLoading);

  // Debounce filters to prevent excessive queries
  const debouncedFilters = useDebounce(filters, FILTER_DEBOUNCE_MS);

  // Load all decisions on mount (for filter panel tag extraction)
  useEffect(() => {
    const loadInitial = async () => {
      await useStore.getState().loadDecisions();
    };
    loadInitial();
  }, []);

  // Apply debounced filters to search
  useEffect(() => {
    const performSearch = async () => {
      await searchDecisions(debouncedFilters.search || '', debouncedFilters);
    };
    performSearch();
  }, [debouncedFilters, searchDecisions]);

  // Sync URL with search query
  useEffect(() => {
    if (searchInput !== queryParam) {
      const timer = setTimeout(() => {
        navigate({
          to: '/search',
          search: searchInput ? { q: searchInput } : { q: undefined },
          replace: true,
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchInput, queryParam, navigate]);

  // Update search input when URL query param changes (browser back/forward)
  useEffect(() => {
    setSearchInput(queryParam);
    setFilters((prev) => ({ ...prev, search: queryParam || undefined }));
  }, [queryParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput || undefined }));
  };

  const clearSearch = () => {
    setSearchInput('');
    setFilters((prev) => ({ ...prev, search: undefined }));
    navigate({
      to: '/search',
      search: { q: undefined },
      replace: true,
    });
  };

  // Check if any filters are active (excluding search)
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.tags?.length ||
    filters.emotional_flags?.length ||
    filters.date_from ||
    filters.date_to ||
    filters.confidence_min !== undefined ||
    filters.confidence_max !== undefined ||
    filters.has_outcome !== undefined
  );

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/' })}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Decisions
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <SearchIcon className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Search</h1>
          </div>
          <p className="text-muted-foreground">
            Search through your decisions and apply filters
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <SearchFiltersPanel
              filters={filters}
              onChange={setFilters}
              decisions={decisions}
            />
          </aside>

          {/* Main content */}
          <main className="space-y-6">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search decisions..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button type="submit">Search</Button>
            </form>

            {/* Results */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-muted-foreground">Searching decisions...</p>
              </div>
            ) : (
              <div>
                {/* Result count */}
                {decisions.length > 0 && (
                  <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {decisions.length}
                      </span>{' '}
                      {decisions.length === 1 ? 'result' : 'results'} found
                      {filters.search && (
                        <>
                          {' '}
                          for <span className="font-semibold text-foreground">"{filters.search}"</span>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Result cards or empty state */}
                {decisions.length === 0 ? (
                  <SearchResultsEmpty hasActiveFilters={hasActiveFilters} />
                ) : (
                  <div className="space-y-4">
                    {decisions.map((decision) => {
                      const matchedFields = getMatchedFields(decision, filters.search || '');
                      return (
                        <SearchResultCard
                          key={decision.id}
                          decision={decision}
                          query={filters.search || ''}
                          matchedFields={matchedFields}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
