import type React from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  description?: string
  required?: boolean
  maxLength?: number
  currentLength?: number
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  description,
  required,
  maxLength,
  currentLength,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {maxLength && (
          <span className="text-xs text-muted-foreground font-mono">
            {currentLength || 0}/{maxLength}
          </span>
        )}
      </div>
      {children}
      {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
    </div>
  )
}
