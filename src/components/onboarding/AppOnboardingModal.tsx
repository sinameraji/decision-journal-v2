import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { NewWelcomeStep } from './steps/NewWelcomeStep';
import { OllamaInstallStep } from './steps/OllamaInstallStep';
import { WhisperModelStep } from './steps/WhisperModelStep';
import { NewNotificationPermissionStep } from './steps/NewNotificationPermissionStep';
import { NewVoiceInputStep } from './steps/NewVoiceInputStep';
import { PrivacyPromiseStep } from './steps/PrivacyPromiseStep';
import { ProgressDots } from './ProgressDots';
import { useSetOnboardingCompleted } from '@/store';
import { useNavigate } from '@tanstack/react-router';

interface AppOnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

type OnboardingStep = 'welcome' | 'ollama-install' | 'whisper-model' | 'notifications' | 'voice-input' | 'privacy-promise';

export function AppOnboardingModal({ open, onClose }: AppOnboardingModalProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const setOnboardingCompleted = useSetOnboardingCompleted();
  const navigate = useNavigate();

  const handleComplete = async () => {
    await setOnboardingCompleted();
    onClose();
    navigate({ to: '/new' });
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <NewWelcomeStep onNext={() => setStep('ollama-install')} />;

      case 'ollama-install':
        return <OllamaInstallStep onNext={() => setStep('whisper-model')} />;

      case 'whisper-model':
        return (
          <WhisperModelStep
            onNext={() => setStep('notifications')}
            onSkip={() => setStep('notifications')}
          />
        );

      case 'notifications':
        return (
          <NewNotificationPermissionStep
            onNext={() => setStep('voice-input')}
            onSkip={() => setStep('voice-input')}
          />
        );

      case 'voice-input':
        return (
          <NewVoiceInputStep
            onNext={() => setStep('privacy-promise')}
            onSkip={() => setStep('privacy-promise')}
          />
        );

      case 'privacy-promise':
        return <PrivacyPromiseStep onComplete={handleComplete} />;

      default:
        return null;
    }
  };

  const getCurrentStepNumber = () => {
    const steps: OnboardingStep[] = ['welcome', 'ollama-install', 'whisper-model', 'notifications', 'voice-input', 'privacy-promise'];
    const currentIndex = steps.indexOf(step);
    return currentIndex + 1;
  };

  const handleClose = async () => {
    // Mark onboarding as completed even if skipped
    await setOnboardingCompleted();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        {/* Content */}
        <div className="pt-4">
          {/* Progress dots */}
          <div className="flex justify-center mb-6">
            <ProgressDots currentStep={getCurrentStepNumber()} totalSteps={6} />
          </div>

          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
