"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AlternativesTabProps {
  data: {
    alternatives: string[]
  }
  updateData: (updates: Partial<AlternativesTabProps["data"]>) => void
}

export function AlternativesTab({ data, updateData }: AlternativesTabProps) {
  const addAlternative = () => {
    updateData({
      alternatives: [...data.alternatives, ""],
    })
  }

  const updateAlternative = (index: number, value: string) => {
    const newAlternatives = [...data.alternatives]
    newAlternatives[index] = value
    updateData({ alternatives: newAlternatives })
  }

  const removeAlternative = (index: number) => {
    updateData({
      alternatives: data.alternatives.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <h2 className="font-serif text-xl font-semibold text-foreground">Alternatives</h2>

      {/* Field Label */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Alternatives <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-muted-foreground">
          {"List all possible options you're considering. Consider at least 2 alternatives."}
        </p>
      </div>

      {/* Added alternatives */}
      {data.alternatives.length > 0 && (
        <div className="space-y-3">
          {data.alternatives.map((alt, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <input
                type="text"
                value={alt}
                onChange={(e) => updateAlternative(index, e.target.value)}
                placeholder={`Alternative ${index + 1}...`}
                className="flex-1 px-4 py-2.5 bg-background border border-input rounded-md text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <button
                onClick={() => removeAlternative(index)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Alternative Button */}
      <Button
        onClick={addAlternative}
        variant="outline"
        className="w-full gap-2 border-dashed bg-transparent rounded-full py-6"
      >
        <Plus className="h-4 w-4" />
        Add Alternative
      </Button>
    </div>
  )
}
