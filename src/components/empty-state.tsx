import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
        <FileText className="h-8 w-8 text-muted-foreground/50" />
      </div>

      <h3 className="font-serif text-lg font-medium text-foreground mb-2">No decisions yet</h3>

      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6 leading-relaxed font-sans">
        Start documenting your decisions to track your thinking, gain insights, and improve over time.
      </p>

      <Button className="gap-2 font-sans">
        <Plus className="h-4 w-4" />
        Record Your First Decision
      </Button>
    </div>
  )
}
