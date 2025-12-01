import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, AlertCircle, Loader2 } from 'lucide-react'
import { ollamaService } from '@/services/llm/ollama-service'
import type { ChatMessage as OllamaChatMessage } from '@/services/llm/ollama-service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  id: string
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Check if Ollama is running on mount
  useEffect(() => {
    checkOllamaStatus()
  }, [])

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

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !ollamaRunning) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)
    setError(null)

    // Create assistant message placeholder
    const assistantMessageId = crypto.randomUUID()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    }
    setMessages(prev => [...prev, assistantMessage])

    // Prepare messages for Ollama (include system prompt)
    const ollamaMessages: OllamaChatMessage[] = [
      {
        role: 'system',
        content: ollamaService.getDecisionAnalysisPrompt(),
      },
      ...messages.map(m => ({
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

    try {
      await ollamaService.chatStream(
        ollamaMessages,
        // onChunk
        (text: string) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + text }
                : msg
            )
          )
        },
        // onComplete
        () => {
          setIsLoading(false)
          setIsStreaming(false)
          abortControllerRef.current = null
        },
        // onError
        (error: Error) => {
          console.error('Chat stream error:', error)
          setError(error.message)
          setIsLoading(false)
          setIsStreaming(false)
          abortControllerRef.current = null
        },
        undefined, // Use default model
        undefined, // Use default options
        abortController.signal
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
      setIsLoading(false)
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight mb-2">
          AI Decision Coach
        </h1>
        <p className="text-sm text-muted-foreground">
          Discuss your decisions with an AI assistant powered by Ollama
        </p>
      </div>

      {/* Ollama Status Alert */}
      {ollamaRunning === false && (
        <Alert className="mb-4 border-destructive/50 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ollama is not running. Please start Ollama and install a model (e.g., ollama pull gemma3:1b).
            <Button
              variant="outline"
              size="sm"
              onClick={checkOllamaStatus}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && ollamaRunning !== false && (
        <Alert className="mb-4 border-destructive/50 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <Card className="flex-1 overflow-y-auto p-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              No messages yet. Start a conversation!
            </p>
            <p className="text-sm text-muted-foreground">
              Ask questions about your decisions or get help thinking through choices.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={ollamaRunning ? 'Type your message...' : 'Ollama is not running...'}
          disabled={!ollamaRunning || isStreaming}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || !ollamaRunning || isStreaming}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send
        </Button>
      </div>
    </div>
  )
}
