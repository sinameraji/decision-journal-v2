/**
 * Tool Input Form Message Component
 *
 * Wrapper around ToolInputForm for displaying tool input forms
 * as inline messages in the chat stream.
 */

import { useState } from 'react'
import { ToolInputForm } from './ToolInputForm'
import type { ToolDefinition } from '@/services/tools/tool-types'

interface ToolInputFormMessageProps {
  messageId: string
  tool: ToolDefinition
  formData: Record<string, unknown>
  onSubmit: (formData: Record<string, unknown>) => void
  onCancel: () => void
  isExecuting: boolean
}

export function ToolInputFormMessage({
  tool,
  formData: initialFormData,
  onSubmit,
  onCancel,
  isExecuting,
}: ToolInputFormMessageProps) {
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  const validateAndSubmit = () => {
    // Validation logic
    const customFields =
      tool.inputSchema.type === 'custom-query' ? tool.inputSchema.customFields || [] : []
    const newErrors: Record<string, string> = {}

    customFields.forEach((field) => {
      const value = formData[field.name]

      if (field.required && !value) {
        newErrors[field.name] = `${field.label} is required`
        return
      }

      if (value && field.validation) {
        const validation = field.validation

        if (field.type === 'text' && typeof value === 'string') {
          if (validation.minLength && value.length < validation.minLength) {
            newErrors[field.name] = `Minimum length is ${validation.minLength}`
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            newErrors[field.name] = `Maximum length is ${validation.maxLength}`
          }
        }

        if (field.type === 'number' && typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            newErrors[field.name] = `Minimum value is ${validation.min}`
          }
          if (validation.max !== undefined && value > validation.max) {
            newErrors[field.name] = `Maximum value is ${validation.max}`
          }
        }
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm max-w-[75%]">
      <div className="border-b border-border bg-muted/30 px-4 py-2 flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Tool Input Required</span>
      </div>

      <ToolInputForm
        tool={tool}
        formData={formData}
        errors={errors}
        isExecuting={isExecuting}
        onFieldChange={handleFieldChange}
        onSubmit={validateAndSubmit}
        onBack={onCancel}
        showHeader={true}
        showFooter={true}
      />
    </div>
  )
}
