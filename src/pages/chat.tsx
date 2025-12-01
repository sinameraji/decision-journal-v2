import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, AlertCircle, Loader2 } from 'lucide-react'
import { ollamaService } from '@/services/llm/ollama-service'
import type { ChatMessage as OllamaChatMessage } from '@/services/llm/ollama-service'
import { Button } from '@/components/ui/button'
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar'
import { ModelSelectorButton } from '@/components/chat/ModelSelectorButton'
import { ModelSelectorModal } from '@/components/chat/ModelSelectorModal'
import { VoiceInputButton } from '@/components/chat/VoiceInputButton'
import {
  useChatMessages,
  useCurrentSessionId,
  useAddMessage,
  useSaveMessageToDb,
  useSelectedModel,
  useSetSelectedModel,
  useDownloadingModels,
  useGenerateSessionTitle,
  useCreateNewSession,
  type Message,
} from '@/store'

const SUGGESTED_PROMPTS = [
  'What patterns do you notice in my recent decisions?',
  'Help me think through my latest decision',
  'What cognitive biases should I watch out for?',
  'How can I improve my decision-making process?',
]

export function ChatPage() {
  const messages = useChatMessages()
  const currentSessionId = useCurrentSessionId()
  const addMessage = useAddMessage()
  const saveMessageToDb = useSaveMessageToDb()
  const selectedModel = useSelectedModel()
  const setSelectedModel = useSetSelectedModel()
  const downloadingModels = useDownloadingModels()
  const generateSessionTitle = useGenerateSessionTitle()
  const createNewSession = useCreateNewSession()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modelModalOpen, setModelModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Check if Ollama is running on mount
  useEffect(() => {
    checkOllamaStatus()
  }, [])

  // Create initial session if none exists
  useEffect(() => {
    if (!currentSessionId) {
      createNewSession()
    }
  }, [currentSessionId, createNewSession])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkOllamaStatus = async () => {
    try {
      const running = await ollamaService.isRunning()
      setOllamaRunning(running)
      if (!running) {
        setError('Ollama is not running. Please start Ollama to use chat.')
      }
    } catch (error) {
      setOllamaRunning(false)
      setError('Failed to connect to Ollama. Make sure it is installed and running.')
    }
  }

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isStreaming || !ollamaRunning) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    }

    // Add to UI
    addMessage(userMessage)
    setInput('')
    setIsStreaming(true)
    setError(null)

    // Save to database
    await saveMessageToDb(userMessage)

    // Generate title if this is the first message
    if (messages.length === 0 && currentSessionId) {
      await generateSessionTitle(currentSessionId)
    }

    // Create assistant message placeholder
    const assistantMessageId = crypto.randomUUID()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    addMessage(assistantMessage)

    // Prepare messages for Ollama (include system prompt)
    const ollamaMessages: OllamaChatMessage[] = [
      {
        role: 'system',
        content: ollamaService.getDecisionAnalysisPrompt(),
      },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: 'user',
        content: userMessage.content,
      },
    ]

    // Create abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    let fullResponse = ''

    try {
      await ollamaService.chatStream(
        ollamaMessages,
        // onChunk
        (text: string) => {
          fullResponse += text
          // Force update by creating new message object
          addMessage({ ...assistantMessage, content: fullResponse })
        },
        // onComplete
        async () => {
          setIsStreaming(false)
          abortControllerRef.current = null

          // Save complete assistant message to database
          const completedAssistantMessage: Message = {
            ...assistantMessage,
            content: fullResponse,
            timestamp: Date.now(),
          }
          await saveMessageToDb(completedAssistantMessage)
        },
        // onError
        (error: Error) => {
          console.error('Chat stream error:', error)
          setError(error.message)
          setIsStreaming(false)
          abortControllerRef.current = null
        },
        selectedModel || undefined, // Use selected model
        undefined, // Use default options
        abortController.signal
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePromptClick = (prompt: string) => {
    setInput(prompt)
  }

  const handleVoiceTranscript = (transcript: string) => {
    setInput((prev) => (prev ? prev + ' ' + transcript : transcript))
  }

  const currentModelName = selectedModel || 'gemma3:1b'
  const downloadingCount = downloadingModels.size

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex gap-6">
        {/* Chat History Sidebar */}
        <ChatHistorySidebar />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight mb-1">
              AI Decision Coach
            </h1>
            <p className="text-sm text-muted-foreground">
              Discuss your decisions with an AI assistant powered by Ollama
            </p>
          </div>

          {/* Model Selector Button */}
          <ModelSelectorButton
            currentModel={currentModelName}
            downloadingCount={downloadingCount}
            onClick={() => setModelModalOpen(true)}
          />
        </div>

        {/* Ollama Status Alert */}
        {ollamaRunning === false && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Ollama is not running</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please start Ollama and install a model (e.g., ollama pull gemma3:1b).
              </p>
              <Button variant="outline" size="sm" onClick={checkOllamaStatus} className="mt-2">
                Retry Connection
              </Button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && ollamaRunning !== false && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{error}</p>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm flex flex-col min-h-0 mb-4">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-16 w-16 text-muted-foreground mb-6" />
                <p className="text-foreground text-lg font-medium mb-2">
                  Start a conversation
                </p>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Ask me anything about your decisions. I can help identify patterns, blind spots,
                  and improve your thinking.
                </p>

                {/* Suggested Prompts */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className="text-left p-4 bg-muted/50 border border-border rounded-xl text-sm text-foreground hover:bg-muted hover:border-border/80 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                        {message.role === 'assistant' && isStreaming && !message.content && (
                          <Loader2 className="h-4 w-4 animate-spin inline-block" />
                        )}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-5 w-5 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    ollamaRunning
                      ? 'Ask me anything about your decisions... (Shift+Enter for new line)'
                      : 'Ollama is not running...'
                  }
                  disabled={!ollamaRunning || isStreaming}
                  className="w-full px-4 py-3 pr-14 bg-muted border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  rows={2}
                />
                <div className="absolute right-3 top-3">
                  <VoiceInputButton onTranscript={handleVoiceTranscript} />
                </div>
              </div>
              <Button
                size="icon"
                className="h-12 w-12 rounded-xl"
                onClick={() => handleSend()}
                disabled={!input.trim() || !ollamaRunning || isStreaming}
              >
                {isStreaming ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            {messages.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Using model: {currentModelName}
              </p>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Model Selector Modal */}
      <ModelSelectorModal
        open={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
        currentModel={currentModelName}
        onModelSelect={(modelName) => {
          setSelectedModel(modelName)
          setModelModalOpen(false)
        }}
      />
    </div>
  )
}
