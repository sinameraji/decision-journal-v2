/**
 * Ollama Service
 * Handles all interactions with local Ollama LLM
 */

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  modified_at: string;
  digest: string;
  details: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

export interface ChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
}

class OllamaService {
  private baseUrl = 'http://localhost:11434';
  private defaultModel = 'gemma3:1b';

  /**
   * Check if Ollama is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });

      if (response.ok) {
        console.log('[Ollama] Service detected and running');
        return true;
      }

      console.warn('[Ollama] Service responded but not OK:', {
        status: response.status,
        statusText: response.statusText
      });
      return false;
    } catch (error) {
      // Detailed error logging for debugging
      if (error instanceof TypeError) {
        console.error('[Ollama] Network error - service may not be running or CSP blocked:', error.message);
      } else if (error instanceof DOMException && error.name === 'SecurityError') {
        console.error('[Ollama] CSP/Security blocked connection to localhost:11434');
      } else {
        console.error('[Ollama] Unknown error checking service:', error);
      }
      return false;
    }
  }

  /**
   * Get list of available models
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Get default model (or first available model)
   */
  async getDefaultModel(): Promise<string> {
    const models = await this.listModels();
    if (models.length === 0) {
      throw new Error('No models available. Please install a model with: ollama pull gemma3:1b');
    }

    // Check if default model exists
    const hasDefault = models.some(m => m.name === this.defaultModel);
    if (hasDefault) {
      return this.defaultModel;
    }

    // Return first available model
    return models[0].name;
  }

  /**
   * Send chat request (non-streaming)
   */
  async chat(
    messages: ChatMessage[],
    model?: string,
    options?: ChatRequest['options']
  ): Promise<string> {
    const modelToUse = model || await this.getDefaultModel();

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          stream: false,
          options: options || {
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();
      return data.message.content;
    } catch (error) {
      console.error('Error in Ollama chat:', error);
      throw error;
    }
  }

  /**
   * Send streaming chat request
   * Calls onChunk for each token, onComplete when done
   */
  async chatStream(
    messages: ChatMessage[],
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    model?: string,
    options?: ChatRequest['options'],
    abortSignal?: AbortSignal
  ): Promise<void> {
    const modelToUse = model || await this.getDefaultModel();

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          stream: true,
          options: options || {
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        // Check if abort was requested
        if (abortSignal?.aborted) {
          await reader.cancel();
          return; // Exit without calling callbacks
        }

        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        // Decode the chunk
        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: ChatResponse = JSON.parse(line);
              if (data.message?.content) {
                onChunk(data.message.content);
              }
              if (data.done) {
                onComplete();
                return;
              }
            } catch (e) {
              console.error('Error parsing streaming response:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streaming chat:', error);
      onError(error as Error);
    }
  }

  /**
   * Generate a system prompt for decision analysis
   */
  getDecisionAnalysisPrompt(): string {
    return `You are a friendly decision-making coach. You help people think through their decisions through natural conversation.

CRITICAL RULES:
- Keep responses SHORT: 2-3 sentences maximum
- Ask ONE question at a time, never multiple
- Be casual and conversational (like texting a friend)
- No long essays or thought dumps
- No listing everything you're thinking
- Get straight to the point

Your approach:
1. Start with brief acknowledgment (1 sentence)
2. Ask a single focused question
3. Wait for response before continuing

Focus areas: cognitive biases, second-order effects, mental models, opportunity costs, reversibility, time horizons.

Remember: You're having a conversation, not writing an analysis report.`;
  }

  /**
   * Pull/download a model
   */
  async pullModel(
    modelName: string,
    onProgress: (progress: { status: string; completed: number; total: number }) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              onProgress({
                status: data.status || 'downloading',
                completed: data.completed || 0,
                total: data.total || 0,
              });
            } catch (e) {
              console.error('Error parsing pull response:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error pulling model:', error);
      throw error;
    }
  }

  /**
   * Delete/uninstall a model
   */
  async deleteModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete model: ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }

  /**
   * Format file size for display
   */
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

export const ollamaService = new OllamaService();
export default ollamaService;
