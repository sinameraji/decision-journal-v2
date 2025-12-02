import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ollamaService } from '@/services/llm/ollama-service';
import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { isTauri } from '@/utils/platform';

interface OllamaInstallStepProps {
  onNext: () => void;
}

type InstallStatus = 'initial' | 'checking' | 'installing' | 'success' | 'error';

export function OllamaInstallStep({ onNext }: OllamaInstallStepProps) {
  const [status, setStatus] = useState<InstallStatus>('initial');
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Helper to open URLs in both Tauri and browser modes
  const openUrl = async (url: string) => {
    if (isTauri()) {
      try {
        const { open } = await import('@tauri-apps/plugin-shell');
        await open(url);
      } catch (err) {
        console.error('Failed to open URL in Tauri:', err);
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  };

  const getPlatformInstructions = () => {
    const platform = navigator.platform.toLowerCase();

    if (platform.includes('mac')) {
      return {
        name: 'macOS',
        icon: '🍎',
        steps: [
          'Download Ollama from ollama.com/download',
          'Install and run Ollama (like any other app)',
          'Click "I\'ve installed Ollama" below',
        ],
        command: 'ollama pull llama3.2',
        downloadUrl: 'https://ollama.com/download/mac',
      };
    } else if (platform.includes('win')) {
      return {
        name: 'Windows',
        icon: '🪟',
        steps: [
          'Download Ollama from ollama.com/download',
          'Install and run Ollama (like any other app)',
          'Click "I\'ve installed Ollama" below',
        ],
        command: null,
        downloadUrl: 'https://ollama.com/download/windows',
      };
    } else {
      return {
        name: 'Linux',
        icon: '🐧',
        steps: [
          'Download Ollama from ollama.com/download',
          'Install and run Ollama (like any other app)',
          'Click "I\'ve installed Ollama" below',
        ],
        command: 'curl -fsSL https://ollama.com/install.sh | sh',
        downloadUrl: 'https://ollama.com/download/linux',
      };
    }
  };

  const instructions = getPlatformInstructions();

  const checkOllamaInstallation = async () => {
    setStatus('checking');
    setError(null);

    try {
      const isRunning = await ollamaService.isRunning();

      if (!isRunning) {
        setStatus('error');
        setError('Ollama is not running. Please install and start Ollama, then try again.');
        return;
      }

      // Ollama is running, check if we have a model
      const models = await ollamaService.listModels();

      if (models.length > 0) {
        setStatus('success');
        setTimeout(() => {
          onNext();
        }, 1500);
      } else {
        // No models, need to download one
        await installModel();
      }
    } catch (err) {
      setStatus('error');
      setError('Failed to connect to Ollama. Please make sure it is installed and running.');
    }
  };

  const installModel = async () => {
    setStatus('installing');
    setError(null);

    try {
      await ollamaService.pullModel(
        'gemma3:1b',
        (progress) => {
          setDownloadProgress({
            current: progress.completed,
            total: progress.total,
          });
        }
      );

      setStatus('success');
      setTimeout(() => {
        onNext();
      }, 1500);
    } catch (err) {
      setError((err as Error).message || 'Failed to download AI model. Please try again.');
      setStatus('error');
    }
  };

  // Render different states
  if (status === 'checking') {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Checking for Ollama...
        </h3>
        <p className="text-muted-foreground">
          Just a moment while we verify your setup.
        </p>
      </div>
    );
  }

  if (status === 'installing') {
    const progressPercent = downloadProgress.total > 0
      ? Math.round((downloadProgress.current / downloadProgress.total) * 100)
      : 0;

    return (
      <div className="py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Download className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Downloading AI Model
          </h3>
          <p className="text-muted-foreground">
            Installing gemma3:1b (~815MB). This will take a few minutes...
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-card rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {downloadProgress.current > 0 && downloadProgress.total > 0
              ? `Downloaded ${ollamaService.formatSize(downloadProgress.current)} of ${ollamaService.formatSize(downloadProgress.total)}`
              : 'Initializing download...'}
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          2 of 5
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/20 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Ollama is Ready!
        </h3>
        <p className="text-muted-foreground mb-6">
          Your AI assistant is set up and ready to use.
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
      </div>
    );
  }

  // Initial or error state
  return (
    <div className="py-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center mb-4">
          <img
            src="/images/ollama-light.png"
            alt="Ollama"
            className="w-20 h-20 object-contain dark:hidden"
          />
          <img
            src="/images/ollama-dark.png"
            alt="Ollama"
            className="w-20 h-20 object-contain hidden dark:block"
          />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">
          Install Ollama
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Decision Journal uses Ollama to run AI models locally on your device.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg p-5 border border-border mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{instructions.icon}</span>
          <h4 className="text-lg font-semibold text-foreground">
            Quick Setup for {instructions.name}
          </h4>
        </div>

        <ol className="space-y-2 mb-5 list-decimal list-inside text-muted-foreground">
          <li>Click "Download Ollama" below</li>
          <li>Install and run Ollama (like any other app)</li>
          <li>Return here and click "I've installed Ollama"</li>
        </ol>

        <Button
          className="w-full mb-4"
          size="lg"
          onClick={() => openUrl(instructions.downloadUrl)}
        >
          <Download className="h-5 w-5 mr-2" />
          Download Ollama
        </Button>

        {instructions.command && (
          <details className="mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Advanced: Install via Terminal
            </summary>
            <div className="mt-3 bg-slate-900 rounded-lg p-3 flex items-center justify-between">
              <code className="text-green-400 text-xs font-mono break-all">
                {instructions.command}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white h-7 text-xs ml-2"
                onClick={() => navigator.clipboard.writeText(instructions.command!)}
              >
                Copy
              </Button>
            </div>
          </details>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <Button
          variant="default"
          size="lg"
          onClick={checkOllamaInstallation}
          disabled={status !== 'initial' && status !== 'error'}
          className="flex-1"
        >
          I've installed Ollama
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        2 of 5
      </p>
    </div>
  );
}
