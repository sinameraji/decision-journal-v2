import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Bot, User, AlertCircle, Loader2 } from 'lucide-react'
import { ollamaService } from '@/services/llm/ollama-service'
import type { ChatMessage as OllamaChatMessage } from '@/services/llm/ollama-service'
import { Button } from '@/components/ui/button'
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar'
import { ModelSelectorButton } from '@/components/chat/ModelSelectorButton'
import { ModelSelectorModal } from '@/components/chat/ModelSelectorModal'
import { VoiceInputButton } from '@/components/voice-input-button'
import { ToolPalette } from '@/components/chat/ToolPalette'
import { ToolInputModal } from '@/components/chat/ToolInputModal'
import { ToolResultCard } from '@/components/chat/ToolResultCard'
import { toolRegistry } from '@/services/tools/tool-registry'
import type { ToolDefinition, ToolExecutionContext } from '@/services/tools/tool-types'
import { vectorSearchService } from '@/services/rag/vector-search-service'
import { buildRAGContext } from '@/utils/prompts/context-builder'
import { buildProfileContext } from '@/utils/prompts/profile-context-prompt'
import type { UserProfile } from '@/utils/prompts/profile-context-prompt'
import { promptBuilder } from '@/utils/prompts/prompt-builder'
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
  usePendingMessage,
  useAutoSubmit,
  useLinkedDecisionId,
  useClearPendingMessage,
  useCleanupPendingSessions,
  useIsPendingSession,
  useCleanup,
  useStore,
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
  const decisions = useStore((state) => state.decisions)
  const profileName = useStore((state) => state.profileName)
  const profileDescription = useStore((state) => state.profileDescription)
  const profileContext = useStore((state) => state.profileContext)

  // Hooks for pending message auto-submission
  const pendingMessage = usePendingMessage()
  const autoSubmit = useAutoSubmit()
  const linkedDecisionId = useLinkedDecisionId()
  const clearPendingMessage = useClearPendingMessage()

  // Hooks for pending session cleanup
  const cleanupPendingSessions = useCleanupPendingSessions()
  const isPendingSession = useIsPendingSession()
  const cleanup = useCleanup()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modelModalOpen, setModelModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Tool execution state
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null)
  const [toolModalOpen, setToolModalOpen] = useState(false)
  const [isExecutingTool, setIsExecutingTool] = useState(false)
  const [toolPaletteCollapsed, setToolPaletteCollapsed] = useState(false)

  // Get current decision if linked
  const currentDecision = linkedDecisionId
    ? decisions.find((d: { id: string }) => d.id === linkedDecisionId)
    : undefined

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

  const handleToolSelect = (tool: ToolDefinition) => {
    setSelectedTool(tool)
    setToolModalOpen(true)
  }

  const handleToolExecute = async (userInput: Record<string, unknown>) => {
    if (!selectedTool || !currentSessionId) return

    setIsExecutingTool(true)

    try {
      // Build execution context
      const context: ToolExecutionContext = {
        currentDecision,
        allDecisions: decisions,
        userInput,
        sessionId: currentSessionId,
      }

      // Execute tool
      const result = await toolRegistry.execute(selectedTool.id, context)

      // Add tool result message
      const toolMessage: Message = {
        id: crypto.randomUUID(),
        role: 'tool',
        content: result.markdown || JSON.stringify(result.data, null, 2),
        timestamp: Date.now(),
        toolExecution: {
          toolId: selectedTool.id,
          toolName: selectedTool.name,
          result,
        },
      }

      addMessage(toolMessage)
      await saveMessageToDb(toolMessage)

      // Close modal
      setToolModalOpen(false)
      setSelectedTool(null)

      // Ask LLM to interpret the result
      if (result.success && ollamaRunning) {
        const interpretationPrompt = `The user just ran the "${selectedTool.name}" tool. Here are the results:\n\n${result.markdown || JSON.stringify(result.data, null, 2)}\n\n${selectedTool.userPromptTemplate.replace('{{markdown}}', result.markdown || '').replace('{{query}}', (userInput.query as string) || '')}`

        // Send interpretation request to LLM
        setTimeout(() => {
          handleSend(interpretationPrompt)
        }, 500)
      }
    } catch (error) {
      setError(
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsExecutingTool(false)
    }
  }

  const handleSend = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isStreaming || !ollamaRunning) return

    // GUARD: Prevent multiple concurrent calls
    if (abortControllerRef.current) {
      console.warn('Message send already in progress, ignoring duplicate call')
      return
    }

    // Create abort controller IMMEDIATELY to claim the lock
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    }

    // Set streaming flag IMMEDIATELY after guard
    setIsStreaming(true)
    setInput('')
    setError(null)

    // Add to UI
    addMessage(userMessage)

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

    // RAG: Search for similar decisions to provide context
    let ragContext = ''
    try {
      const searchResults = await vectorSearchService.searchSimilarDecisions(
        textToSend,
        5, // Top 5 similar decisions
        {
          similarityThreshold: 0.6,
          filters: { isArchived: false },
        }
      )

      console.log(`RAG search for "${textToSend.substring(0, 50)}..." returned ${searchResults.length} results`)
      if (searchResults.length > 0) {
        console.log('Top result similarity:', searchResults[0].similarity)
      }

      if (searchResults.length > 0) {
        // Semantic search found matches
        const similarDecisions = searchResults
          .map((result) => {
            const decision = decisions.find((d) => d.id === result.decisionId)
            return decision ? { decision, similarity: result.similarity } : null
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)

        // Build RAG context
        ragContext = buildRAGContext(similarDecisions)
      } else if (decisions.length > 0) {
        // Fallback: No semantic matches, show most recent decisions
        console.log('No semantic matches found, using recency fallback')

        const recentDecisions = decisions
          .filter((d) => !d.is_archived)
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, 5)
          .map((decision) => ({
            decision,
            similarity: 0.0, // Indicate this is a fallback, not semantic match
          }))

        ragContext = buildRAGContext(recentDecisions)
      }
    } catch (error) {
      console.warn('RAG search failed, continuing without context:', error)
    }

    // Build user profile context
    const userProfile: UserProfile | null = profileName || profileDescription || profileContext.length > 0
      ? {
          name: profileName,
          description: profileDescription,
          contextItems: profileContext,
        }
      : null

    const profileContextString = buildProfileContext(userProfile)

    // Build system prompt using prompt builder
    const systemMessage = promptBuilder.buildSystemPrompt({
      conversationType: linkedDecisionId ? 'decision-linked' : 'general',
      currentDecision,
      conversationHistory: messages
        .filter((m) => m.role !== 'tool')
        .map((m) => ({
          id: m.id,
          session_id: currentSessionId || '',
          role: m.role,
          content: m.content,
          created_at: m.timestamp,
          context_decisions: [],
        })),
    })

    // Inject profile context and RAG context into system message
    let systemMessageWithContext = systemMessage

    // Add profile context first (who the user is)
    if (profileContextString) {
      systemMessageWithContext = `${systemMessageWithContext}\n\n${profileContextString}`
    }

    // Add RAG context second (past decisions)
    if (ragContext) {
      systemMessageWithContext = `${systemMessageWithContext}\n\n${ragContext}`
    }

    const ollamaMessages: OllamaChatMessage[] = [
      {
        role: 'system',
        content: systemMessageWithContext,
      },
      ...messages
        .filter((m) => m.role !== 'tool') // Filter out tool messages
        .map((m) => ({
          role: m.role as 'user' | 'assistant', // Type assertion after filter
          content: m.content,
        })),
      {
        role: 'user',
        content: userMessage.content,
      },
    ]

    let fullResponse = ''

    try {
      await ollamaService.chatStream(
        ollamaMessages,
        // onChunk
        (text: string) => {
          // Verify we're still the active stream
          if (abortController.signal.aborted) {
            return
          }

          fullResponse += text
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
  }, [input, isStreaming, ollamaRunning, addMessage, saveMessageToDb, messages, currentSessionId, generateSessionTitle, linkedDecisionId, selectedModel])

  // Check if Ollama is running on mount
  useEffect(() => {
    checkOllamaStatus()
  }, [])

  // Create initial session if none exists OR if current is stale temp
  useEffect(() => {
    if (!currentSessionId || (isPendingSession(currentSessionId) && messages.length === 0)) {
      // Create session with linkedDecisionId if coming from decision page
      if (linkedDecisionId) {
        createNewSession(linkedDecisionId)
      } else {
        createNewSession()
      }
    }
  }, [currentSessionId, createNewSession, linkedDecisionId, isPendingSession, messages.length])

  // Cleanup pending sessions and timers when leaving chat page
  useEffect(() => {
    return () => {
      // On unmount, cleanup abandoned pending sessions and pending timers
      cleanupPendingSessions()
      cleanup()
    }
  }, [cleanupPendingSessions, cleanup])

  // Auto-submit pending message when coming from decision page
  useEffect(() => {
    if (!pendingMessage || !currentSessionId) return

    // Wait for Ollama status check
    if (ollamaRunning === null) return

    // Additional guard: don't auto-submit if already streaming or about to stream
    if (isStreaming || abortControllerRef.current) {
      return
    }

    // Auto-submit if conditions are met
    if (autoSubmit && ollamaRunning) {
      const autoSubmitTimer = setTimeout(() => {
        // Double-check conditions before sending
        if (!isStreaming && !abortControllerRef.current) {
          handleSend(pendingMessage)
          clearPendingMessage()
        }
      }, 150)  // 150ms delay for UI stability

      return () => clearTimeout(autoSubmitTimer)
    } else if (autoSubmit && !ollamaRunning) {
      // Fallback: pre-fill input if Ollama not running
      setInput(pendingMessage)
      clearPendingMessage()
    }
  }, [pendingMessage, autoSubmit, ollamaRunning, isStreaming, currentSessionId, clearPendingMessage, handleSend])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    <div className="h-full flex flex-col max-w-5xl mx-auto px-6 py-8">
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Chat History Sidebar */}
        <ChatHistorySidebar />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl text-foreground mb-2">
              AI Decision Coach
            </h1>
            <p className="text-muted-foreground">
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
                      className="text-left p-4 bg-muted/50 border border-border rounded-xl text-sm text-foreground hover:bg-muted hover:border-border transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => {
                  // Render tool messages with ToolResultCard
                  if (message.role === 'tool' && message.toolExecution) {
                    return (
                      <div key={message.id}>
                        <ToolResultCard
                          toolName={message.toolExecution.toolName}
                          result={message.toolExecution.result}
                        />
                      </div>
                    )
                  }

                  // Render user/assistant messages normally
                  return (
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
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Tool Palette */}
          <ToolPalette
            tools={toolRegistry.list()}
            onToolSelect={handleToolSelect}
            isCollapsed={toolPaletteCollapsed}
            onToggleCollapse={() => setToolPaletteCollapsed(!toolPaletteCollapsed)}
          />

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

      {/* Tool Input Modal */}
      {selectedTool && (
        <ToolInputModal
          tool={selectedTool}
          isOpen={toolModalOpen}
          isExecuting={isExecutingTool}
          onClose={() => {
            setToolModalOpen(false)
            setSelectedTool(null)
          }}
          onSubmit={handleToolExecute}
        />
      )}
    </div>
  )
}
