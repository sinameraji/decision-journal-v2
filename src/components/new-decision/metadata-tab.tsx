"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceInputButton } from "@/components/voice-input-button"

interface MetadataTabProps {
  data: {
    problemStatement: string
    selectedAlternative: string
    confidence: number
    tags: string[]
  }
  updateData: (updates: Partial<MetadataTabProps["data"]>) => void
}

export function MetadataTab({ data, updateData }: MetadataTabProps) {
  const [newTag, setNewTag] = useState("")

  const addTag = () => {
    if (newTag.trim() && !data.tags.includes(newTag.trim().toLowerCase()) && data.tags.length < 10) {
      updateData({ tags: [...data.tags, newTag.trim().toLowerCase()] })
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    updateData({ tags: data.tags.filter((t) => t !== tag) })
  }

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <h2 className="font-serif text-xl font-semibold text-foreground">Metadata</h2>

      {/* Info Banner */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          {"You're almost done! Review your decision and add tags to help organize and find it later."}
        </p>
      </div>

      {/* Decision Summary */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-semibold text-foreground">Decision Summary</h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-foreground">Problem:</span>
            <p className="text-sm text-muted-foreground mt-0.5">{data.problemStatement || "Not set"}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">Selected Alternative:</span>
            <p className="text-sm text-muted-foreground mt-0.5">{data.selectedAlternative || "Not selected"}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">Confidence:</span>
            <p className="text-sm text-muted-foreground mt-0.5">{data.confidence}/10</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Tags</label>
        <p className="text-sm text-muted-foreground">Add tags to categorize this decision (optional, max 10)</p>

        {/* Display added tags */}
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-sm text-foreground rounded-md"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="Add a tag (e.g., career, finance...)"
              className="w-full px-4 py-2.5 pr-12 bg-background border border-input rounded-full text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <VoiceInputButton size="sm" onTranscript={(text) => setNewTag(text)} />
            </div>
          </div>
          <Button onClick={addTag} size="icon" variant="outline" className="shrink-0 rounded-full bg-transparent">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
