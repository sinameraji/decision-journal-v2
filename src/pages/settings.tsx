import { useState, useEffect } from 'react';
import { useStore, useUninstallingModels, useUninstallModel } from '@/store';
import { ollamaService } from '@/services/llm/ollama-service';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Settings as SettingsIcon, Moon, Sun, Laptop, CheckCircle2, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPage() {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isOllamaRunning, setIsOllamaRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const uninstallingModels = useUninstallingModels();
  const uninstallModel = useUninstallModel();
  const [modelToUninstall, setModelToUninstall] = useState<string | null>(null);

  useEffect(() => {
    checkOllamaAndLoadModels();
  }, []);

  const checkOllamaAndLoadModels = async () => {
    setIsLoading(true);
    try {
      const running = await ollamaService.isRunning();
      setIsOllamaRunning(running);

      if (running) {
        const models = await ollamaService.listModels();
        setAvailableModels(models.map((m) => m.name));
      }
    } catch (error) {
      console.error('Failed to check Ollama:', error);
      setIsOllamaRunning(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleUninstall = async (modelName: string) => {
    await uninstallModel(modelName);
    setModelToUninstall(null);
    // Reload models after uninstall
    await checkOllamaAndLoadModels();
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your Decision Journal preferences
        </p>
      </div>

      {/* Theme Settings */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Appearance</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="theme" className="text-sm font-medium text-foreground mb-2 block">
              Theme Mode
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('light')}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('dark')}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('system')}
                className="flex items-center gap-2"
              >
                <Laptop className="h-4 w-4" />
                System
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Ollama AI Settings */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">AI Assistant (Ollama)</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Checking Ollama connection...</p>
          </div>
        ) : !isOllamaRunning ? (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-400 mb-1">
                  Ollama Not Running
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-500 mb-3">
                  The Ollama service is not running. Please start Ollama to use AI chat features.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkOllamaAndLoadModels}
                >
                  Retry Connection
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  Ollama is running
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Available Models
              </Label>
              {availableModels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No models installed</p>
              ) : (
                <ul className="space-y-2">
                  {availableModels.map((model) => {
                    const isUninstalling = uninstallingModels.has(model);
                    return (
                      <li
                        key={model}
                        className="flex items-center justify-between text-sm text-foreground bg-muted/30 rounded px-3 py-2"
                      >
                        <span className="font-mono">{model}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setModelToUninstall(model)}
                          disabled={isUninstalling}
                          className="p-1.5 h-auto hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                          title="Uninstall model"
                        >
                          {isUninstalling ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="text-sm text-muted-foreground mt-3">
                Manage models in the Chat screen or using the Ollama CLI
              </p>
            </div>
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">About</h2>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <span className="font-medium text-foreground">Decision Journal v2</span>
          </p>
          <p>Using the Farnam Street decision-making methodology</p>
        </div>
      </div>

      {/* Uninstall Confirmation Dialog */}
      <ConfirmDialog
        open={modelToUninstall !== null}
        onOpenChange={(open) => !open && setModelToUninstall(null)}
        title="Uninstall Model?"
        description={`Are you sure you want to uninstall "${modelToUninstall}"? This will remove the model from your system.`}
        confirmText="Uninstall"
        cancelText="Cancel"
        onConfirm={() => modelToUninstall && handleUninstall(modelToUninstall)}
        variant="destructive"
      />
      </div>
    </div>
  );
}
