import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, Target, Tag, Smile, AlertTriangle } from 'lucide-react'
import { generateAnalytics } from '@/services/analytics/analytics-service'
import type { AnalyticsData } from '@/types/analytics'

export function AnalyticsPage() {
  const decisions = useStore((state) => Array.from(state.decisions.values()))
  const loadDecisions = useStore((state) => state.loadDecisions)
  const isLoading = useStore((state) => state.isLoading)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    loadDecisions()
  }, [loadDecisions])

  useEffect(() => {
    if (decisions.length > 0) {
      const data = generateAnalytics(decisions)
      setAnalytics(data)
    }
  }, [decisions])

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (decisions.length === 0 || !analytics) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl text-foreground mb-2">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your decision-making patterns and outcomes
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-foreground text-lg font-medium mb-2">No decisions yet</p>
          <p className="text-sm text-muted-foreground">
            Start making decisions to see your analytics
          </p>
        </div>
      </div>
    )
  }

  const { overview, emotionalPatterns, tagPatterns } = analytics

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground mb-2">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your decision-making patterns and improve over time
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-muted rounded-2xl p-6">
          <div className="flex items-start justify-between mb-2">
            <span className="text-muted-foreground text-sm">Total Decisions</span>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="font-serif text-4xl text-foreground mb-1">
            {overview.totalDecisions}
          </div>
          <div className="text-muted-foreground text-sm">
            {overview.reviewedCount} reviewed ({Math.round(overview.reviewedPercent)}%)
          </div>
        </div>

        <div className="bg-muted rounded-2xl p-6">
          <div className="flex items-start justify-between mb-2">
            <span className="text-muted-foreground text-sm">Avg Confidence</span>
            <Target className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="font-serif text-4xl text-foreground">
            {overview.avgConfidence.toFixed(1)}/10
          </div>
        </div>

        <div className="bg-muted rounded-2xl p-6">
          <div className="flex items-start justify-between mb-2">
            <span className="text-muted-foreground text-sm">Avg Alternatives</span>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="font-serif text-4xl text-foreground mb-1">
            {overview.avgAlternatives.toFixed(1)}
          </div>
          <div className="text-muted-foreground text-sm">per decision</div>
        </div>
      </div>

      {/* Quality Score */}
      {overview.qualityScore && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Overall Decision Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl font-serif text-foreground">
                {overview.qualityScore.grade}
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  {overview.qualityScore.overall.toFixed(0)}/100
                </p>
                <p className="text-sm text-muted-foreground">Average Quality Score</p>
              </div>
            </div>
            <div className="space-y-3">
              {overview.qualityScore.factors.map((factor) => (
                <div key={factor.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{factor.name}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {factor.score.toFixed(0)}/20
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(factor.score / 20) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emotional Patterns */}
      {emotionalPatterns.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Smile className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-serif text-xl text-foreground">Emotional Patterns</h2>
          </div>
          <div className="space-y-3">
            {emotionalPatterns.slice(0, 6).map((pattern) => (
              <div key={pattern.emotion} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div>
                  <div className="font-serif text-lg text-foreground capitalize">{pattern.emotion}</div>
                  <div className="text-sm text-muted-foreground">
                    {pattern.count} decision{pattern.count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">Avg Confidence</div>
                  <div className="font-serif text-xl text-foreground">{pattern.avgConfidence.toFixed(1)}/10</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag Patterns */}
      {tagPatterns.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-serif text-xl text-foreground">Decision Categories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tagPatterns.slice(0, 8).map((pattern) => (
              <div
                key={pattern.tag}
                className="flex items-center justify-between p-4 border border-border rounded-xl"
              >
                <div>
                  <div className="font-serif text-lg text-foreground">{pattern.tag}</div>
                  <div className="text-sm text-muted-foreground">
                    Confidence: {pattern.avgConfidence.toFixed(1)}
                  </div>
                </div>
                <div className="text-muted-foreground text-sm">{pattern.count}x</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Prompt */}
      {overview.reviewedPercent < 50 && (
        <div className="bg-muted rounded-2xl border border-border p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-serif text-lg text-foreground mb-1">
                Review More Decisions for Better Insights
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You have {overview.totalDecisions - overview.reviewedCount} decisions without reviews.
                Adding reviews helps calibrate your predictions and provides better analytics.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
