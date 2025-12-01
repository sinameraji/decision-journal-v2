import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useStore } from '@/store';
import { DecisionCard } from '@/components/decision-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, ArrowLeft, X } from 'lucide-react';

export function SearchPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/search' });
  const queryParam = (searchParams as { q?: string }).q || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const decisions = useStore((state) => state.decisions);
  const loadDecisions = useStore((state) => state.loadDecisions);
  const isLoading = useStore((state) => state.isLoading);

  useEffect(() => {
    loadDecisions();
  }, [loadDecisions]);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  // Filter decisions based on search query
  const filteredDecisions = decisions.filter((decision) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      decision.problem_statement.toLowerCase().includes(query) ||
      decision.situation.toLowerCase().includes(query) ||
      decision.expected_outcome.toLowerCase().includes(query) ||
      decision.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      decision.alternatives.some(
        (alt) =>
          alt.title.toLowerCase().includes(query) ||
          alt.description?.toLowerCase().includes(query)
      )
    );
  });

  // Get unique tags from all decisions
  const allTags = Array.from(
    new Set(decisions.flatMap((d) => d.tags))
  ).sort();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: '/search',
      search: searchQuery ? { q: searchQuery } : { q: undefined },
    });
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    navigate({
      to: '/search',
      search: { q: tag },
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate({
      to: '/search',
      search: { q: undefined },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
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
          Search through your decisions and filter by tags
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
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

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-foreground mb-3">Filter by tag:</h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={searchQuery === tag ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading decisions...</p>
        </div>
      ) : (
        <div>
          {/* Result count */}
          <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">
                {filteredDecisions.length}
              </span>{' '}
              {filteredDecisions.length === 1 ? 'result' : 'results'} found
              {searchQuery && (
                <>
                  {' '}
                  for <span className="font-semibold text-foreground">"{searchQuery}"</span>
                </>
              )}
            </p>
          </div>

          {/* Result cards */}
          {filteredDecisions.length === 0 ? (
            <div className="bg-muted/30 border border-border rounded-lg p-12 text-center">
              <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-foreground mb-2">No results found</h2>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? `We couldn't find any decisions matching "${searchQuery}"`
                  : 'No decisions yet. Create your first decision to get started.'}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={clearSearch}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDecisions.map((decision) => (
                <DecisionCard key={decision.id} decision={decision} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
