/**
 * Curated list of recommended Ollama models
 * These models are shown in the model selector for easy discovery
 */

export interface ModelInfo {
  name: string
  displayName: string
  size: number // bytes
  description: string
  tags: string[]
  recommended?: boolean
}

export const RECOMMENDED_MODELS: ModelInfo[] = [
  {
    name: 'gemma3:1b',
    displayName: 'Gemma 3 (1B)',
    size: 815 * 1024 * 1024,
    description: 'Fast, great for quick chats',
    tags: ['fast', 'small'],
    recommended: true,
  },
  {
    name: 'llama3.2:1b',
    displayName: 'Llama 3.2 (1B)',
    size: 1.3 * 1024 * 1024 * 1024,
    description: 'Smaller, faster Meta model',
    tags: ['fast', 'meta'],
  },
  {
    name: 'llama3.2:3b',
    displayName: 'Llama 3.2 (3B)',
    size: 2 * 1024 * 1024 * 1024,
    description: 'Balanced performance and speed',
    tags: ['balanced', 'meta'],
    recommended: true,
  },
  {
    name: 'phi3:3.8b',
    displayName: 'Phi-3 Mini',
    size: 2.3 * 1024 * 1024 * 1024,
    description: "Microsoft's efficient AI",
    tags: ['efficient', 'microsoft'],
  },
  {
    name: 'qwen2.5:7b',
    displayName: 'Qwen 2.5 (7B)',
    size: 4.7 * 1024 * 1024 * 1024,
    description: 'Strong reasoning, multilingual',
    tags: ['powerful', 'multilingual'],
  },
]
