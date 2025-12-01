"use client"

import { CustomSelect } from "@/components/custom-select"
import { VoiceInputButton } from "@/components/voice-input-button"

interface DecisionTabProps {
  data: {
    alternatives: string[]
    selectedAlternative: string
    expectedOutcome: string
    bestCase: string
    worstCase: string
    confidence: number
  }
  updateData: (updates: Partial<DecisionTabProps["data"]>) => void
}

export function DecisionTab({ data, updateData }: DecisionTabProps) {
  const alternativeOptions = data.alternatives.filter(Boolean).map((alt) => ({
    value: alt,
    label: alt,
  }))

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <h2 className="font-serif text-xl font-semibold text-foreground">Decision</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Selected Alternative <span className="text-red-500">*</span>
        </label>
        <CustomSelect
          value={data.selectedAlternative}
          onChange={(value) => updateData({ selectedAlternative: value })}
          options={alternativeOptions}
          placeholder="Choose an alternative..."
        />
        <p className="text-sm text-muted-foreground">Which alternative have you decided to pursue?</p>
      </div>

      {/* Expected Outcome */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Expected Outcome <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={data.expectedOutcome}
            onChange={(e) => updateData({ expectedOutcome: e.target.value })}
            placeholder="What do you expect will happen..."
            className="w-full min-h-[100px] px-4 py-3 pr-12 bg-background border border-input rounded-md text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
          />
          <div className="absolute right-3 top-3">
            <VoiceInputButton
              onTranscript={(text) => updateData({ expectedOutcome: data.expectedOutcome + " " + text })}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">What results do you realistically expect from this decision?</p>
      </div>

      {/* Best Case Scenario */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Best Case Scenario <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={data.bestCase}
            onChange={(e) => updateData({ bestCase: e.target.value })}
            placeholder="If everything goes perfectly..."
            className="w-full min-h-[100px] px-4 py-3 pr-12 bg-background border border-input rounded-md text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
          />
          <div className="absolute right-3 top-3">
            <VoiceInputButton onTranscript={(text) => updateData({ bestCase: data.bestCase + " " + text })} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{"What's the best possible outcome you could hope for?"}</p>
      </div>

      {/* Worst Case Scenario */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Worst Case Scenario <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={data.worstCase}
            onChange={(e) => updateData({ worstCase: e.target.value })}
            placeholder="If things go wrong..."
            className="w-full min-h-[100px] px-4 py-3 pr-12 bg-background border border-input rounded-md text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
          />
          <div className="absolute right-3 top-3">
            <VoiceInputButton onTranscript={(text) => updateData({ worstCase: data.worstCase + " " + text })} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{"What's the worst that could realistically happen?"}</p>
      </div>

      {/* Confidence Level Slider */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground">
          Confidence Level <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          <input
            type="range"
            min="1"
            max="10"
            value={data.confidence}
            onChange={(e) => updateData({ confidence: Number.parseInt(e.target.value) })}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">1 (Low)</span>
            <span className="font-semibold text-foreground">{data.confidence}</span>
            <span className="text-muted-foreground">10 (High)</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">How confident are you that this is the right decision? (1-10)</p>
      </div>
    </div>
  )
}
