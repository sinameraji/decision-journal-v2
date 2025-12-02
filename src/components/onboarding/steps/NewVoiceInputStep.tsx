import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import { permissionService } from '@/services/permission-service';

interface NewVoiceInputStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function NewVoiceInputStep({ onNext, onSkip }: NewVoiceInputStepProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  const handleEnableMicrophone = async () => {
    setStatus('requesting');

    const granted = await permissionService.requestMicrophonePermission();

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
    await permissionService.savePermissionStatus('prompt');
    onSkip();
  };

  if (status === 'granted') {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/20 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Microphone Enabled!
        </h3>
        <p className="text-muted-foreground">
          You can now use voice input to capture thoughts quickly
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
          Microphone Access Blocked
        </h3>
        <p className="text-muted-foreground mb-6">
          You can enable voice input later in Settings if you change your mind.
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
          <Mic className="h-10 w-10 text-muted-foreground" />
        )}
      </div>

      <h3 className="text-2xl font-bold text-foreground mb-3">
        Voice Input
      </h3>

      <p className="text-muted-foreground mb-2 max-w-md mx-auto">
        Use your voice to capture thoughts quickly.
      </p>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto font-medium">
        This is optional.
      </p>

      <div className="bg-card border border-border rounded-lg p-5 mb-6 max-w-md mx-auto text-left">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">Dictate decision descriptions</p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">Voice search through your journal</p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">Talk through decisions with AI coach</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-3 mb-8 max-w-md mx-auto">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="text-left">
            Voice data is processed locally and never leaves your device.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto mb-4">
        <Button
          size="lg"
          onClick={handleEnableMicrophone}
          disabled={status === 'requesting'}
        >
          {status === 'requesting' ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Requesting Permission...
            </>
          ) : (
            'Enable Microphone'
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
        4 of 5
      </p>
    </div>
  );
}
