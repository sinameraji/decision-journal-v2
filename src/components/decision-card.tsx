"use client"

import { useState } from "react"
import { Calendar, MessageCircle, ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Decision {
  id: string
  title: string
  description: string
  date: string
  selectedOption: string | null
  confidence: number | null
  tags: string[]
  status: "decided" | "pending"
}

interface DecisionCardProps {
  decision: Decision
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isDecided = decision.status === "decided"

  return (
    <Card
      className={cn(
        "group p-5 transition-all duration-200 cursor-pointer",
        "hover:shadow-md hover:border-primary/20",
        "bg-card border-border/60",
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status Icon */}
          {isDecided ? (
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
          )}

          {/* Title */}
          <h3 className={cn("font-serif text-base leading-relaxed text-foreground", !expanded && "line-clamp-2")}>
            {decision.title}
          </h3>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-sans">{decision.date}</span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 ml-8 space-y-4">
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed font-sans">{decision.description}</p>

          {/* Selected Option */}
          {decision.selectedOption && (
            <div className="bg-muted/50 rounded-sm p-3 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1 font-sans">Selected Alternative</p>
              <p className="text-sm font-medium text-foreground font-sans">{decision.selectedOption}</p>
            </div>
          )}

          {/* Meta Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              {decision.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-sans font-normal">
                  {tag}
                </Badge>
              ))}
              {decision.tags.length > 3 && (
                <span className="text-xs text-muted-foreground font-sans">+{decision.tags.length - 3} more</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {decision.confidence && (
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn("w-1.5 h-3 rounded-sm", i < (decision.confidence ?? 0) ? "bg-primary" : "bg-muted")}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono ml-1">{decision.confidence ?? 0}/10</span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5 h-8 font-sans text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle discuss action
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Discuss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Collapse indicator */}
      <div className="flex justify-center mt-3">
        <div className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
    </Card>
  )
}
