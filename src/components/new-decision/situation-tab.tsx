"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceInputButton } from "@/components/voice-input-button"

interface SituationTabProps {
  data: {
    situation: string
    problemStatement: string
    keyVariables: string[]
    complications: string[]
  }
  updateData: (updates: Partial<SituationTabProps["data"]>) => void
}

export function SituationTab({ data, updateData }: SituationTabProps) {
  const [newVariable, setNewVariable] = useState("")
  const [newComplication, setNewComplication] = useState("")

  const addVariable = () => {
    if (newVariable.trim()) {
      updateData({ keyVariables: [...data.keyVariables, newVariable.trim()] })
      setNewVariable("")
    }
  }

  const addComplication = () => {
    if (newComplication.trim()) {
      updateData({ complications: [...data.complications, newComplication.trim()] })
      setNewComplication("")
    }
  }

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <h2 className="font-serif text-xl font-semibold text-foreground">Situation</h2>

      {/* Situation Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Situation <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={data.situation}
            onChange={(e) => updateData({ situation: e.target.value })}
            placeholder="Describe the current situation or context..."
            className="w-full min-h-[120px] px-4 py-3 pr-12 bg-background border border-input rounded-md text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
          />
          <div className="absolute right-3 top-3">
            <VoiceInputButton onTranscript={(text) => updateData({ situation: data.situation + " " + text })} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {"What's happening right now? Provide context about the situation you're facing."}
        </p>
      </div>

      {/* Problem Statement Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Problem Statement <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={data.problemStatement}
            onChange={(e) => updateData({ problemStatement: e.target.value.slice(0, 100) })}
            placeholder="Clearly define the problem you're trying to solve..."
            className="w-full min-h-[100px] px-4 py-3 pr-12 bg-background border border-input rounded-md text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
          />
          <div className="absolute right-3 top-3">
            <VoiceInputButton
              onTranscript={(text) =>
                updateData({ problemStatement: (data.problemStatement + " " + text).slice(0, 100) })
              }
            />
          </div>
        </div>
        <div className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            What specific problem are you trying to solve? Be as clear and specific as possible.
          </p>
          <span className="text-sm text-muted-foreground">{data.problemStatement.length}/100</span>
        </div>
      </div>

      {/* Key Variables Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Key Variables <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-muted-foreground">What are the important factors that could affect the outcome?</p>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariable())}
              placeholder="Add a key variable..."
              className="w-full px-4 py-2.5 pr-12 bg-background border border-input rounded-full text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <VoiceInputButton size="sm" onTranscript={(text) => setNewVariable(text)} />
            </div>
          </div>
          <Button onClick={addVariable} size="icon" variant="outline" className="shrink-0 rounded-full bg-transparent">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {/* Display added variables */}
        {data.keyVariables.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.keyVariables.map((variable, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-sm text-foreground rounded-md"
              >
                {variable}
                <button
                  onClick={() => updateData({ keyVariables: data.keyVariables.filter((_, i) => i !== index) })}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Complications Field (Optional) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Complications</label>
        <p className="text-sm text-muted-foreground">
          What factors make this decision more difficult or complex? (Optional)
        </p>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newComplication}
              onChange={(e) => setNewComplication(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addComplication())}
              placeholder="Add a complication..."
              className="w-full px-4 py-2.5 pr-12 bg-background border border-input rounded-full text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <VoiceInputButton size="sm" onTranscript={(text) => setNewComplication(text)} />
            </div>
          </div>
          <Button
            onClick={addComplication}
            size="icon"
            variant="outline"
            className="shrink-0 rounded-full bg-transparent"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {/* Display added complications */}
        {data.complications.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.complications.map((complication, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-sm text-foreground rounded-md"
              >
                {complication}
                <button
                  onClick={() => updateData({ complications: data.complications.filter((_, i) => i !== index) })}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
