import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { toast } from '@/hooks/use-toast'
import { SituationTab } from '@/components/new-decision/situation-tab'
import { AlternativesTab } from '@/components/new-decision/alternatives-tab'
import { DecisionTab } from '@/components/new-decision/decision-tab'
import { MentalContextTab } from '@/components/new-decision/mental-context-tab'
import { MetadataTab } from '@/components/new-decision/metadata-tab'
import { type Decision, type Alternative, type EmotionalFlag } from '@/types/decision'

type FormStep = 'situation' | 'alternatives' | 'decision' | 'mental-context' | 'metadata'

interface FormData {
  // Situation
  situation: string
  problemStatement: string
  keyVariables: string[]
  complications: string[]

  // Alternatives (simplified as strings in UI)
  alternatives: string[]

  // Decision
  selectedAlternative: string
  expectedOutcome: string
  bestCase: string
  worstCase: string
  confidence: number

  // Mental Context
  mentalState: string
  physicalState: string
  timeOfDay: string
  emotionalFlags: string[]

  // Metadata
  tags: string[]
}

const steps: { id: FormStep; label: string }[] = [
  { id: 'situation', label: 'Situation' },
  { id: 'alternatives', label: 'Alternatives' },
  { id: 'decision', label: 'Decision' },
  { id: 'mental-context', label: 'Mental Context' },
  { id: 'metadata', label: 'Metadata' },
]

export function NewPage() {
  const navigate = useNavigate()
  const createDecision = useStore((state) => state.createDecision)
  const isLoading = useStore((state) => state.isLoading)

  const [currentStep, setCurrentStep] = useState<FormStep>('situation')
  const [formData, setFormData] = useState<FormData>({
    situation: '',
    problemStatement: '',
    keyVariables: [],
    complications: [],
    alternatives: [],
    selectedAlternative: '',
    expectedOutcome: '',
    bestCase: '',
    worstCase: '',
    confidence: 5,
    mentalState: '',
    physicalState: '',
    timeOfDay: '',
    emotionalFlags: [],
    tags: [],
  })

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(steps[currentStepIndex + 1].id)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(steps[currentStepIndex - 1].id)
    }
  }

  const handleSubmit = async () => {
    try {
      // Convert form data to Decision type
      // Convert simple string alternatives to Alternative objects
      const alternatives: Alternative[] = formData.alternatives.map((alt) => ({
        id: crypto.randomUUID(),
        title: alt,
        description: '',
        pros: [],
        cons: [],
      }))

      // Find selected alternative ID
      const selectedIndex = formData.alternatives.findIndex(a => a === formData.selectedAlternative)
      const selectedAlternativeId = selectedIndex >= 0 ? alternatives[selectedIndex].id : null

      const decision: Omit<Decision, 'id' | 'created_at' | 'updated_at'> = {
        situation: formData.situation,
        problem_statement: formData.problemStatement,
        variables: formData.keyVariables,
        complications: formData.complications,
        alternatives: alternatives,
        selected_alternative_id: selectedAlternativeId,
        expected_outcome: formData.expectedOutcome,
        best_case_scenario: formData.bestCase,
        worst_case_scenario: formData.worstCase,
        confidence_level: formData.confidence,
        mental_state: formData.mentalState,
        physical_state: formData.physicalState,
        time_of_day: formData.timeOfDay,
        emotional_flags: formData.emotionalFlags as EmotionalFlag[],
        actual_outcome: null,
        outcome_rating: null,
        lessons_learned: null,
        tags: formData.tags,
        is_archived: false,
        encryption_key_id: null,
      }

      await createDecision(decision)
      toast({
        title: 'Decision created',
        description: 'Your decision has been saved successfully.',
      })
      navigate({ to: '/' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create decision',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/' })}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Decisions
        </Button>
        <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight mb-2">
          New Decision
        </h1>
        <p className="text-sm text-muted-foreground">
          Document your decision-making process step by step
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`flex-1 h-1 rounded-full transition-colors ${
                  index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
              {index < steps.length - 1 && <div className="w-2" />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`text-xs font-medium transition-colors ${
                step.id === currentStep
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="mb-8">
        {currentStep === 'situation' && (
          <SituationTab
            data={{
              situation: formData.situation,
              problemStatement: formData.problemStatement,
              keyVariables: formData.keyVariables,
              complications: formData.complications,
            }}
            updateData={(updates) => updateFormData(updates)}
          />
        )}
        {currentStep === 'alternatives' && (
          <AlternativesTab
            data={{ alternatives: formData.alternatives }}
            updateData={(updates) => updateFormData(updates)}
          />
        )}
        {currentStep === 'decision' && (
          <DecisionTab
            data={{
              alternatives: formData.alternatives,
              selectedAlternative: formData.selectedAlternative,
              expectedOutcome: formData.expectedOutcome,
              bestCase: formData.bestCase,
              worstCase: formData.worstCase,
              confidence: formData.confidence,
            }}
            updateData={(updates) => updateFormData(updates)}
          />
        )}
        {currentStep === 'mental-context' && (
          <MentalContextTab
            data={{
              mentalState: formData.mentalState,
              physicalState: formData.physicalState,
              timeOfDay: formData.timeOfDay,
              emotionalFlags: formData.emotionalFlags,
            }}
            updateData={(updates) => updateFormData(updates)}
          />
        )}
        {currentStep === 'metadata' && (
          <MetadataTab
            data={{
              problemStatement: formData.problemStatement,
              selectedAlternative: formData.selectedAlternative,
              confidence: formData.confidence,
              tags: formData.tags,
            }}
            updateData={(updates) => updateFormData(updates)}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        {isLastStep ? (
          <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
            <Check className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Decision'}
          </Button>
        ) : (
          <Button onClick={handleNext} className="gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      </div>
    </div>
  )
}
