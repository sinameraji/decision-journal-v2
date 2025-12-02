import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { Decision } from '@/types/decision';
import { TAG_FILTER_MAX_HEIGHT } from '@/constants/search';

interface TagFilterProps {
  value: string[];
  onChange: (tags: string[]) => void;
  decisions: Decision[];
}

export function TagFilter({ value, onChange, decisions }: TagFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all unique tags from decisions
  const allTags = Array.from(
    new Set(decisions.flatMap((d) => d.tags))
  ).sort();

  // Filter tags by search term
  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium">Tags</label>
        {value.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {value.length} selected
          </span>
        )}
      </div>

      <Input
        type="text"
        placeholder="Search tags..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-9"
      />

      <div
        className="space-y-1 overflow-y-auto"
        style={{ maxHeight: `${TAG_FILTER_MAX_HEIGHT}px` }}
      >
        {filteredTags.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2 text-center">
            {searchTerm ? 'No tags match your search' : 'No tags available'}
          </p>
        ) : (
          filteredTags.map((tag) => {
            const isSelected = value.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                  isSelected
                    ? 'bg-accent/10 text-accent border border-accent/30'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <span>{tag}</span>
                {isSelected && <X className="h-4 w-4" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
