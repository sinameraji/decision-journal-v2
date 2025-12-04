import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { permissionService } from '@/services/permission-service';

interface NewNotificationPermissionStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function NewNotificationPermissionStep({ onNext, onSkip }: NewNotificationPermissionStepProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  const handleEnableNotifications = async () => {
    setStatus('requesting');

    const granted = await permissionService.requestNotificationPermission();

    if (granted) {
      setStatus('granted');
      setTimeout(() => {
        onNext();
      }, 1500);
    } else {
      setStatus('denied');
    }
  };

  const handleSkip = async () => {
    await permissionService.saveNotificationPermissionStatus('prompt');
    onSkip();
  };

  if (status === 'granted') {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/20 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Notifications Enabled!
        </h3>
        <p className="text-muted-foreground">
          You'll receive reminders to review decisions and AI insights
        </p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-950/20 mb-4">
          <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Notification Access Blocked
        </h3>
        <p className="text-muted-foreground mb-6">
          You can enable notifications later in Settings if you change your mind.
        </p>
        <Button onClick={onNext}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
        {status === 'requesting' ? (
          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
        ) : (
          <Bell className="h-10 w-10 text-muted-foreground" />
        )}
      </div>

      <h3 className="text-2xl font-bold text-foreground mb-3">
        Enable Notifications
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Get reminders to review past decisions and track their outcomes.
      </p>

      <div className="bg-card border border-border rounded-lg p-5 mb-8 max-w-md mx-auto text-left">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Review Reminders</h4>
              <p className="text-sm text-muted-foreground">
                Get notified when it's time to review a decision's outcome
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">AI Insights</h4>
              <p className="text-sm text-muted-foreground">
                Receive insights about your decision-making patterns
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto mb-4">
        <Button
          size="lg"
          onClick={handleEnableNotifications}
          disabled={status === 'requesting'}
        >
          {status === 'requesting' ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Requesting Permission...
            </>
          ) : (
            'Enable Notifications'
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={status === 'requesting'}
        >
          Skip
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        4 of 6
      </p>
    </div>
  );
}
