import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2 } from 'lucide-react';

interface PrivacyPromiseStepProps {
  onComplete: () => void;
}

export function PrivacyPromiseStep({ onComplete }: PrivacyPromiseStepProps) {
  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 dark:bg-green-950/20 mb-6">
        <Shield className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>

      <h3 className="text-2xl font-bold text-foreground mb-3">
        100% Private & Offline
      </h3>

      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Your decisions are yours alone. Here's our promise to you.
      </p>

      <div className="space-y-6 mb-8 text-left max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">No Cloud Database</h4>
            <p className="text-sm text-muted-foreground">
              All data is stored in a database on your computer
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Works Offline</h4>
            <p className="text-sm text-muted-foreground">
              No internet required. The app works completely offline.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Local AI Processing</h4>
            <p className="text-sm text-muted-foreground">
              AI runs on your machine via Ollama. Nothing sent to external servers.
            </p>
          </div>
        </div>
      </div>

      <Button size="lg" onClick={onComplete} className="mb-4">
        Start Using Decision Journal
      </Button>

      <p className="text-xs text-muted-foreground">
        5 of 5
      </p>
    </div>
  );
}
