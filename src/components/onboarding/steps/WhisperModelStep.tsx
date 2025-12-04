import { useState, useEffect } from 'react';
import { Download, CheckCircle2, AlertCircle, Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { whisperService } from '@/services/transcription/whisper-service';
import { useStore } from '@/store';

interface WhisperModelStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function WhisperModelStep({ onNext, onSkip }: WhisperModelStepProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasModel, setHasModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'tiny' | 'base'>('tiny');
  const [error, setError] = useState<string | null>(null);

  const setWhisperModel = useStore((state) => state.setWhisperModel);
  const setWhisperModelDownloaded = useStore((state) => state.setWhisperModelDownloaded);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    setIsChecking(true);
    try {
      const status = await whisperService.getModelStatus();
      setHasModel(status.isDownloaded);
      if (status.isDownloaded && status.modelType) {
        setSelectedModel(status.modelType as 'tiny' | 'base');
      }
    } catch (error) {
      console.error('Failed to check whisper model status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      await whisperService.downloadModel(selectedModel);
      setWhisperModel(selectedModel);
      setWhisperModelDownloaded(true);
      setHasModel(true);

      // Auto-proceed after 1 second
      setTimeout(() => onNext(), 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to download model');
      setIsDownloading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleProceed = () => {
    onNext();
  };

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Checking for voice models...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[500px]">
      {/* Header */}
      <div className="flex-shrink-0 space-y-2 mb-6">
        <div className="flex items-center gap-2">
          <Mic className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Voice Transcription</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Step 3 of 7
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6">
        {hasModel ? (
          // Model already downloaded
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-400">
                  Voice transcription ready
                </p>
                <p className="text-xs text-green-700 dark:text-green-500">
                  Whisper {selectedModel} model is installed
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              You can now use voice input to dictate decisions and search. All processing happens locally on your device.
            </p>
          </div>
        ) : (
          // Need to download
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Download a voice transcription model to enable voice input features. Choose between speed and accuracy:
            </p>

            {/* Model Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedModel('tiny')}
                disabled={isDownloading}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedModel === 'tiny'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedModel === 'tiny' ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <span className="font-semibold text-sm">Tiny</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">~75 MB</p>
                <p className="text-xs text-muted-foreground">Fast, good for clear audio</p>
              </button>

              <button
                onClick={() => setSelectedModel('base')}
                disabled={isDownloading}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedModel === 'base'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedModel === 'base' ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <span className="font-semibold text-sm">Base</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">~142 MB</p>
                <p className="text-xs text-muted-foreground">Slower, better accuracy</p>
              </button>
            </div>

            {/* Download Status */}
            {isDownloading && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-900 dark:text-blue-400">
                  Downloading {selectedModel} model...
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-900 dark:text-red-400">
                  {error}
                </span>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Voice data is processed locally and never leaves your device</p>
              <p>• You can change or delete the model later in Settings</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex-shrink-0 flex justify-between items-center pt-6 border-t">
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={isDownloading}
        >
          Skip for now
        </Button>

        {hasModel ? (
          <Button onClick={handleProceed}>
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download {selectedModel} model
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
