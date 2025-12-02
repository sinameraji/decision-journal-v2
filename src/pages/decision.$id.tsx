import { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Calendar, Tag, Brain, TrendingUp, Edit2, Trash2, MessageCircle } from 'lucide-react'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { format } from 'date-fns'
import { buildDecisionChatContext } from '@/utils/chat-context-builder'

export function DecisionDetailPage() {
  const { id } = useParams({ from: '/decision/$id' })
  const navigate = useNavigate()
  const currentDecision = useStore((state) => state.currentDecision)
  const isLoading = useStore((state) => state.isLoading)
  const error = useStore((state) => state.error)
  const loadDecision = useStore((state) => state.loadDecision)
  const deleteDecision = useStore((state) => state.deleteDecision)
  const decisions = useStore((state) => state.decisions)
  const setPendingMessage = useStore((state) => state.setPendingMessage)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Load decision on mount
  useEffect(() => {
    if (id) {
      loadDecision(id)
    }
  }, [id, loadDecision])

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!currentDecision) return

    try {
      await deleteDecision(currentDecision.id)
      navigate({ to: '/' })
    } catch (error) {
      console.error('Failed to delete decision:', error)
    }
  }

  const handleDiscussWithAI = () => {
    if (!currentDecision) return

    const contextMessage = buildDecisionChatContext(currentDecision, decisions)
    setPendingMessage(contextMessage, true, currentDecision.id)
    navigate({ to: '/chat' })
  }

  // Loading state
  if (isLoading && !currentDecision) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading decision...</p>
        </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !currentDecision) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/' })}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Decisions
        </Button>
        </div>
      </div>
    )
  }

  // No decision found
  if (!currentDecision) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Decision not found</p>
          <Button variant="outline" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decisions
          </Button>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/' })}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Decisions
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="font-serif text-3xl font-semibold text-foreground tracking-tight mb-2">
              {currentDecision.problem_statement}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(currentDecision.created_at, 'MMM d, yyyy')}</span>
              </div>
              {currentDecision.tags.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  <span>{currentDecision.tags.length} tags</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleDiscussWithAI}
            >
              <MessageCircle className="h-4 w-4" />
              Discuss with AI
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Decision?"
        description="This action cannot be undone. This will permanently delete this decision and all associated data."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        requireConfirmation="DELETE"
        onConfirm={handleDeleteConfirm}
      />

      {/* Tags */}
      {currentDecision.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {currentDecision.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="font-sans text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Situation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Situation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {currentDecision.situation}
            </p>
          </div>

          {currentDecision.variables.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Key Variables</h3>
              <ul className="list-disc list-inside space-y-1">
                {currentDecision.variables.map((variable, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {variable}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentDecision.complications.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Complications</h3>
              <ul className="list-disc list-inside space-y-1">
                {currentDecision.complications.map((complication, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {complication}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alternatives */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Alternatives Considered</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentDecision.alternatives.map((alternative) => {
            const isSelected = alternative.id === currentDecision.selected_alternative_id
            return (
              <div
                key={alternative.id}
                className={`p-4 rounded-lg border ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium text-foreground">
                    {alternative.title}
                  </h3>
                  {isSelected && (
                    <Badge variant="default" className="font-sans text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
                {alternative.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {alternative.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {alternative.pros.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-foreground mb-1">Pros</h4>
                      <ul className="list-disc list-inside space-y-0.5">
                        {alternative.pros.map((pro, index) => (
                          <li key={index} className="text-xs text-muted-foreground">
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {alternative.cons.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-foreground mb-1">Cons</h4>
                      <ul className="list-disc list-inside space-y-0.5">
                        {alternative.cons.map((con, index) => (
                          <li key={index} className="text-xs text-muted-foreground">
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Decision & Expectations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Decision & Expected Outcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Expected Outcome</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {currentDecision.expected_outcome}
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Best Case Scenario</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {currentDecision.best_case_scenario}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Worst Case Scenario</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {currentDecision.worst_case_scenario}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">Confidence Level</h3>
              <span className="text-sm font-medium text-primary">
                {currentDecision.confidence_level}/10
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${currentDecision.confidence_level * 10}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mental Context */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Mental Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {currentDecision.mental_state && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Mental State</h3>
                <p className="text-sm text-muted-foreground">{currentDecision.mental_state}</p>
              </div>
            )}
            {currentDecision.physical_state && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Physical State</h3>
                <p className="text-sm text-muted-foreground">{currentDecision.physical_state}</p>
              </div>
            )}
            {currentDecision.time_of_day && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Time of Day</h3>
                <p className="text-sm text-muted-foreground">{currentDecision.time_of_day}</p>
              </div>
            )}
          </div>

          {currentDecision.emotional_flags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Emotional Flags</h3>
              <div className="flex flex-wrap gap-2">
                {currentDecision.emotional_flags.map((flag, index) => (
                  <Badge key={index} variant="outline" className="font-sans text-xs">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outcome (if reviewed) */}
      {currentDecision.actual_outcome && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Actual Outcome
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {currentDecision.actual_outcome}
              </p>
            </div>

            {currentDecision.outcome_rating !== null && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-foreground">Outcome Rating</h3>
                  <span className="text-sm font-medium text-primary">
                    {currentDecision.outcome_rating}/10
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${currentDecision.outcome_rating * 10}%` }}
                  />
                </div>
              </div>
            )}

            {currentDecision.lessons_learned && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Lessons Learned</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {currentDecision.lessons_learned}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}
