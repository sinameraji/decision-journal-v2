import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NewWelcomeStepProps {
  onNext: () => void;
}

export function NewWelcomeStep({ onNext }: NewWelcomeStepProps) {
  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
        <Sparkles className="h-10 w-10 text-muted-foreground" />
      </div>

      <h3 className="text-2xl font-bold text-foreground mb-3">
        Welcome to Decision Journal
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Your private space to track decisions, gain AI insights, and improve your decision-making over time.
      </p>

      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        <Badge variant="default">100% Private</Badge>
        <Badge variant="default">Works Offline</Badge>
        <Badge variant="default">AI-Powered</Badge>
      </div>

      <Button size="lg" onClick={onNext} className="mb-4">
        Get Started
      </Button>

      <p className="text-xs text-muted-foreground">
        1 of 5
      </p>
    </div>
  );
}
