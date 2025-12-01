import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, Target, Brain, Calendar } from 'lucide-react'

interface AnalyticsData {
  totalDecisions: number
  reviewedDecisions: number
  avgConfidence: number
  avgOutcomeRating: number
  decisionsByMonth: { month: string; count: number }[]
  topTags: { tag: string; count: number }[]
  emotionalFlags: { flag: string; count: number }[]
}

export function AnalyticsPage() {
  const decisions = useStore((state) => state.decisions)
  const loadDecisions = useStore((state) => state.loadDecisions)
  const isLoading = useStore((state) => state.isLoading)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDecisions: 0,
    reviewedDecisions: 0,
    avgConfidence: 0,
    avgOutcomeRating: 0,
    decisionsByMonth: [],
    topTags: [],
    emotionalFlags: [],
  })

  useEffect(() => {
    loadDecisions()
  }, [loadDecisions])

  useEffect(() => {
    if (decisions.length === 0) return

    // Calculate analytics
    const reviewed = decisions.filter((d) => d.actual_outcome).length
    const totalConfidence = decisions.reduce((sum, d) => sum + d.confidence_level, 0)
    const avgConf = totalConfidence / decisions.length

    const reviewedWithRating = decisions.filter((d) => d.outcome_rating !== null)
    const totalRating = reviewedWithRating.reduce((sum, d) => sum + (d.outcome_rating || 0), 0)
    const avgRating = reviewedWithRating.length > 0 ? totalRating / reviewedWithRating.length : 0

    // Decisions by month
    const monthCounts = new Map<string, number>()
    decisions.forEach((d) => {
      const date = new Date(d.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1)
    })
    const decisionsByMonth = Array.from(monthCounts.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months

    // Top tags
    const tagCounts = new Map<string, number>()
    decisions.forEach((d) => {
      d.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })
    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Emotional flags
    const flagCounts = new Map<string, number>()
    decisions.forEach((d) => {
      d.emotional_flags.forEach((flag) => {
        flagCounts.set(flag, (flagCounts.get(flag) || 0) + 1)
      })
    })
    const emotionalFlags = Array.from(flagCounts.entries())
      .map(([flag, count]) => ({ flag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    setAnalytics({
      totalDecisions: decisions.length,
      reviewedDecisions: reviewed,
      avgConfidence: avgConf,
      avgOutcomeRating: avgRating,
      decisionsByMonth,
      topTags,
      emotionalFlags,
    })
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

  if (decisions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight mb-2">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your decision-making patterns and outcomes
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No decisions yet</p>
          <p className="text-sm text-muted-foreground">
            Start making decisions to see your analytics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight mb-2">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your decision-making patterns and outcomes
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Decisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-serif font-semibold text-foreground">
              {analytics.totalDecisions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-serif font-semibold text-foreground">
              {analytics.reviewedDecisions}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((analytics.reviewedDecisions / analytics.totalDecisions) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-serif font-semibold text-foreground">
              {analytics.avgConfidence.toFixed(1)}/10
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${analytics.avgConfidence * 10}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Outcome
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-serif font-semibold text-foreground">
              {analytics.avgOutcomeRating > 0 ? `${analytics.avgOutcomeRating.toFixed(1)}/10` : 'N/A'}
            </p>
            {analytics.avgOutcomeRating > 0 && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${analytics.avgOutcomeRating * 10}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decisions by Month */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Decisions by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.decisionsByMonth.length > 0 ? (
            <div className="space-y-3">
              {analytics.decisionsByMonth.map((item) => {
                const maxCount = Math.max(...analytics.decisionsByMonth.map((d) => d.count))
                const percentage = (item.count / maxCount) * 100
                const date = new Date(item.month + '-01')
                const monthName = date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                })

                return (
                  <div key={item.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{monthName}</span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {item.count} {item.count === 1 ? 'decision' : 'decisions'}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Top Tags and Emotional Flags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Top Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topTags.length > 0 ? (
              <div className="space-y-3">
                {analytics.topTags.map((item) => {
                  const maxCount = Math.max(...analytics.topTags.map((t) => t.count))
                  const percentage = (item.count / maxCount) * 100

                  return (
                    <div key={item.tag}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{item.tag}</span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags used yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Emotional Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.emotionalFlags.length > 0 ? (
              <div className="space-y-3">
                {analytics.emotionalFlags.map((item) => {
                  const maxCount = Math.max(...analytics.emotionalFlags.map((f) => f.count))
                  const percentage = (item.count / maxCount) * 100

                  return (
                    <div key={item.flag}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{item.flag}</span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No emotional flags recorded</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
