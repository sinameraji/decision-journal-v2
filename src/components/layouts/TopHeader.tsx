import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearch } from '@tanstack/react-router';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserAvatarButton } from '@/components/user-avatar-button';
import { ProfileEditModal } from '@/components/profile-edit-modal';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

const SEARCH_DEBOUNCE_MS = 400;

export function TopHeader() {
  const [searchValue, setSearchValue] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchValue, SEARCH_DEBOUNCE_MS);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false });
  const isUpdatingFromUrl = useRef(false);

  // Sync URL → Input (when navigating to/from search page)
  useEffect(() => {
    isUpdatingFromUrl.current = true;

    if (location.pathname === '/search') {
      const q = (searchParams as { q?: string }).q;
      if (q && q !== searchValue) {
        setSearchValue(q);
      }
    } else {
      // Clear search when navigating away from search page
      if (searchValue) {
        setSearchValue('');
      }
    }

    // Reset flag after a brief delay
    setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 50);
  }, [location.pathname, searchParams]);

  // Sync Input → URL (debounced)
  useEffect(() => {
    // Don't trigger navigation if we're updating from URL
    if (isUpdatingFromUrl.current) return;

    if (debouncedSearch) {
      // Navigate to search page with query
      navigate({
        to: '/search',
        search: { q: debouncedSearch },
        replace: location.pathname === '/search', // Replace if already on search page
      });
    }
  }, [debouncedSearch, location.pathname, navigate]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue) {
      // Immediate navigation on Enter (bypass debounce)
      e.preventDefault();
      navigate({
        to: '/search',
        search: { q: searchValue },
      });
    } else if (e.key === 'Escape') {
      // Clear search on Escape
      setSearchValue('');
      if (location.pathname === '/search') {
        navigate({ to: '/' });
      }
    }
  };

  // Handle clear button
  const handleClear = () => {
    setSearchValue('');
    if (location.pathname === '/search') {
      navigate({ to: '/' });
    }
  };

  return (
    <>
      <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background">
        {/* Search bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search decisions..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                'pl-10 pr-10 bg-background',
                searchValue && 'pr-20' // Extra padding for clear button
              )}
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right side: Avatar + Theme toggle */}
        <div className="flex items-center gap-3 ml-4">
          <UserAvatarButton onClick={() => setIsProfileModalOpen(true)} />
          <ThemeToggle />
        </div>
      </header>

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
