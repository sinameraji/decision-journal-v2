import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { PlusCircle } from 'lucide-react'
import { useStore } from '@/store'
import { DecisionCard } from '@/components/decision-card'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

export function IndexPage() {
  const decisions = useStore((state) => state.decisions)
  const isLoading = useStore((state) => state.isLoading)
  const error = useStore((state) => state.error)
  const loadDecisions = useStore((state) => state.loadDecisions)

  // Load decisions on mount
  useEffect(() => {
    loadDecisions()
  }, [loadDecisions])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">
            Your Decisions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'} recorded
          </p>
        </div>
        <Button className="gap-2 font-sans text-sm" size="sm" asChild>
          <Link to="/new">
            <PlusCircle className="h-4 w-4" />
            New Decision
          </Link>
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && decisions.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading decisions...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && decisions.length === 0 && !error && (
        <EmptyState />
      )}

      {/* Decisions List */}
      {decisions.length > 0 && (
        <div className="space-y-4">
          {decisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      )}
    </div>
  )
}
