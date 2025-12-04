import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DecisionSelectCard } from './DecisionSelectCard';
import { useStore } from '@/store';
import { useDebounce } from '@/hooks/use-debounce';

interface DecisionPickerModalProps {
  open: boolean;
  onClose: () => void;
  attachedIds: string[];
  onAttach: (decisionIds: string[]) => void;
}

const MAX_ATTACHMENTS = 10;

export function DecisionPickerModal({
  open,
  onClose,
  attachedIds,
  onAttach,
}: DecisionPickerModalProps) {
  const decisions = useStore((state) => state.decisions);
  const loadDecisions = useStore((state) => state.loadDecisions);
  const isLoading = useStore((state) => state.isLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterByOutcome, setFilterByOutcome] = useState<'all' | 'reviewed' | 'unreviewed'>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load decisions when modal opens
  useEffect(() => {
    if (open) {
      loadDecisions();
      setSelectedIds(new Set(attachedIds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attachedIds]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedIds(new Set());
      setFilterByOutcome('all');
      setSelectedTags(new Set());
    }
  }, [open]);

  // Extract unique tags from all decisions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    decisions.forEach((decision) => {
      decision.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [decisions]);

  // Filter decisions based on search and filters
  const filteredDecisions = useMemo(() => {
    let filtered = decisions;

    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.problem_statement?.toLowerCase().includes(query) ||
          d.situation?.toLowerCase().includes(query) ||
          d.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Outcome filter
    if (filterByOutcome === 'reviewed') {
      filtered = filtered.filter((d) => Boolean(d.actual_outcome));
    } else if (filterByOutcome === 'unreviewed') {
      filtered = filtered.filter((d) => !d.actual_outcome);
    }

    // Tag filter
    if (selectedTags.size > 0) {
      filtered = filtered.filter((d) =>
        d.tags?.some((tag) => selectedTags.has(tag))
      );
    }

    return filtered;
  }, [decisions, debouncedSearch, filterByOutcome, selectedTags]);

  const handleToggle = (decisionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(decisionId)) {
      newSelected.delete(decisionId);
    } else {
      if (newSelected.size >= MAX_ATTACHMENTS) {
        // TODO: Show toast notification
        return;
      }
      newSelected.add(decisionId);
    }
    setSelectedIds(newSelected);
  };

  const handleAttach = () => {
    onAttach(Array.from(selectedIds));
    onClose();
  };

  const handleTagToggle = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterByOutcome('all');
    setSelectedTags(new Set());
  };

  const hasFilters = searchQuery || filterByOutcome !== 'all' || selectedTags.size > 0;
  const newlySelected = Array.from(selectedIds).filter((id) => !attachedIds.includes(id));
  const isAtLimit = selectedIds.size >= MAX_ATTACHMENTS;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Attach Decisions</DialogTitle>
          <DialogDescription>
            Select decisions to provide context for this chat (max {MAX_ATTACHMENTS})
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Filters:</span>

            {/* Outcome filter */}
            <div className="flex gap-1">
              <Button
                variant={filterByOutcome === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterByOutcome('all')}
              >
                All
              </Button>
              <Button
                variant={filterByOutcome === 'reviewed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterByOutcome('reviewed')}
              >
                Reviewed
              </Button>
              <Button
                variant={filterByOutcome === 'unreviewed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterByOutcome('unreviewed')}
              >
                Unreviewed
              </Button>
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {allTags.slice(0, 5).map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.has(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                {allTags.length > 5 && (
                  <Badge variant="outline">+{allTags.length - 5} tags</Badge>
                )}
              </div>
            )}

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading decisions...
              </div>
            ) : filteredDecisions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {decisions.length === 0
                  ? 'No decisions found. Create your first decision to get started.'
                  : hasFilters
                    ? 'No decisions match your filters.'
                    : 'No decisions available.'}
              </div>
            ) : (
              filteredDecisions.map((decision) => (
                <DecisionSelectCard
                  key={decision.id}
                  decision={decision}
                  selected={selectedIds.has(decision.id)}
                  onToggle={handleToggle}
                  disabled={isAtLimit && !selectedIds.has(decision.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedIds.size} selected
            {newlySelected.length > 0 && ` (${newlySelected.length} new)`}
            {isAtLimit && ' • Limit reached'}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAttach} disabled={selectedIds.size === 0}>
              Attach Selected
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
