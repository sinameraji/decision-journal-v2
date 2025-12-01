"use client"

import { cn } from "@/lib/utils"
import { VoiceInputButton } from "@/components/voice-input-button"

const emotionalFlags = ["Regret", "FOMO", "Fear", "Anxiety", "Excitement", "Confidence", "Doubt", "Stress"]

interface MentalContextTabProps {
  data: {
    mentalState: string
    physicalState: string
    timeOfDay: string
    emotionalFlags: string[]
  }
  updateData: (updates: Partial<MentalContextTabProps["data"]>) => void
}

export function MentalContextTab({ data, updateData }: MentalContextTabProps) {
  const toggleFlag = (flag: string) => {
    if (data.emotionalFlags.includes(flag)) {
      updateData({ emotionalFlags: data.emotionalFlags.filter((f) => f !== flag) })
    } else if (data.emotionalFlags.length < 5) {
      updateData({ emotionalFlags: [...data.emotionalFlags, flag] })
    }
  }

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <h2 className="font-serif text-xl font-semibold text-foreground">Mental Context</h2>

      {/* Mental State */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Mental State <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={data.mentalState}
            onChange={(e) => updateData({ mentalState: e.target.value })}
            placeholder="How are you feeling mentally right now..."
            className="w-full min-h-[100px] px-4 py-3 pr-12 bg-background border border-input rounded-md text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
          />
          <div className="absolute right-3 top-3">
            <VoiceInputButton onTranscript={(text) => updateData({ mentalState: data.mentalState + " " + text })} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe your mental state: Are you calm, stressed, rushed, clear-headed, distracted?
        </p>
      </div>

      {/* Physical State */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Physical State <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={data.physicalState}
            onChange={(e) => updateData({ physicalState: e.target.value })}
            placeholder="How are you feeling physically..."
            className="w-full min-h-[100px] px-4 py-3 pr-12 bg-background border border-input rounded-md text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
          />
          <div className="absolute right-3 top-3">
            <VoiceInputButton onTranscript={(text) => updateData({ physicalState: data.physicalState + " " + text })} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe your physical state: Are you tired, energized, hungry, well-rested, sick?
        </p>
      </div>

      {/* Time of Day */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Time of Day <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.timeOfDay}
            onChange={(e) => updateData({ timeOfDay: e.target.value })}
            placeholder="e.g., 11:52 AM"
            className="w-full px-4 py-2.5 pr-12 bg-background border border-input rounded-md text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <VoiceInputButton size="sm" onTranscript={(text) => updateData({ timeOfDay: text })} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">What time is it? Time of day can affect decision quality.</p>
      </div>

      {/* Emotional Flags */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Emotional Flags</label>
        <p className="text-sm text-muted-foreground">{"Select any emotions you're experiencing (up to 5)"}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {emotionalFlags.map((flag) => (
            <button
              key={flag}
              onClick={() => toggleFlag(flag)}
              className={cn(
                "px-4 py-2 text-sm rounded-md border transition-all",
                data.emotionalFlags.includes(flag)
                  ? "border-primary/50 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {flag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
