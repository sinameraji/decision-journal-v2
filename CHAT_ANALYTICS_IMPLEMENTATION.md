# Chat & Analytics Feature Implementation Plan

**Status:** Phase 10A & 10B Complete (Chat State Management Done)
**Next:** Phase 10C - Chat UI Components
**Estimated Remaining:** 16-22 hours

---

## Overview

This document tracks the complete implementation of Chat and Analytics features to achieve:
- **Chat:** 100% of v0 UI design + 100% of v1 backend functionality
- **Analytics:** Full v0 analytics with calibration, quality scoring, pattern analysis

---

## Phase 10: Complete Chat Feature

### ✅ Phase 10A: Chat Database & Types (COMPLETE)
**Duration:** 30 minutes
**Status:** ✅ Done

**Files:**
- `/src/types/chat.ts` - Already exists, verified compatible

**Types defined:**
```typescript
- ChatSession (id, decision_id, created_at, updated_at, trigger_type, title)
- ChatSessionWithMetadata (extends ChatSession with message_count, first_message_preview, linked_decision_title)
- ChatMessage (id, session_id, role, content, created_at, context_decisions)
- RAGContext (currentDecision, similarDecisions, prompt)
- Suggestion (type, content, confidence, reasoning)
```

**Verification:**
- ✅ Types compile without errors
- ✅ No conflicts with existing Decision types
- ✅ Database schema supports all types

---

### ✅ Phase 10B: Chat State Management (COMPLETE)
**Duration:** 2-3 hours
**Status:** ✅ Done

**Files Created:**
- `/src/store/chat-slice.ts` (448 lines)

**Files Modified:**
- `/src/store/index.ts` - Added ChatSlice to combined store

**State Implemented:**
```typescript
- messages: Message[] - In-memory message list
- currentSessionId: string | null - Active session
- pendingMessage: string | null - Auto-submit support
- autoSubmit: boolean - Auto-submit flag
- linkedDecisionId: string | null - Decision context
- isLoading: boolean - Loading state
- error: string | null - Error messages
- sessions: ChatSessionWithMetadata[] - Session list
- isLoadingSessions: boolean - Sessions loading
- sessionsError: string | null - Session errors
- searchQuery: string - Session search
- refreshTimer: NodeJS.Timeout | null - Debounce timer
- deletingSessions: Set<string> - Deletion tracking
- selectedModel: string | null - Active Ollama model
- availableModels: OllamaModel[] - Model list
- downloadingModels: Map<string, DownloadProgress> - Download tracking
- isLoadingModels: boolean - Models loading
```

**Actions Implemented:**
```typescript
Message Management:
- addMessage(message) - Add to in-memory list
- clearMessages() - Clear all messages

Pending Messages:
- setPendingMessage(message, autoSubmit, decisionId?) - Set for auto-submission
- clearPendingMessage() - Clear pending

Session Management:
- createNewSession(decisionId?) - Create and store session
- loadMessagesFromSession(sessionId) - Load from DB
- setCurrentSessionId(sessionId) - Set active session
- setLinkedDecision(decisionId) - Link to decision
- loadMostRecentSession() - Load or create session

Session List:
- loadChatSessions() - Fetch 50 most recent
- refreshSessions() - Re-fetch sessions
- deleteSession(sessionId) - Delete with cleanup
- renameSession(sessionId, newTitle) - Update title
- setSearchQuery(query) - Set search filter
- generateSessionTitle(sessionId) - Auto-title from first message

Database Persistence:
- saveMessageToDb(message, contextDecisionIds?) - Persist message

Model Management:
- loadAvailableModels() - Fetch from Ollama
- setSelectedModel(modelName) - Switch model, persist preference
- downloadModel(modelName) - Pull model with progress
- updateDownloadProgress(modelName, progress) - Update download state
- removeDownloadProgress(modelName) - Clear download state
```

**Build Result:**
- ✅ Compiles successfully
- Bundle: 489.00 KB JS (146.99 KB gzipped)

**Verification:**
- ✅ All actions compile and type-check
- ✅ Integrated with Zustand store
- ✅ State persists selectedModel to localStorage
- ✅ All database operations use sqliteService

---

### ⏳ Phase 10C: Chat UI Components - Part 1 (PENDING)
**Duration:** 2-3 hours
**Status:** 🔴 Not Started

**Files to Create:**
1. `/src/components/chat/ChatHistorySidebar.tsx`
2. `/src/components/chat/ChatSessionItem.tsx`
3. `/src/components/chat/SessionActionsMenu.tsx`

**Reference Files (v1):**
- `/Users/sinameraji/Craft/decision_journal/src/components/chat/ChatHistorySidebar.tsx`
- `/Users/sinameraji/Craft/decision_journal/src/components/chat/ChatSessionItem.tsx`
- `/Users/sinameraji/Craft/decision_journal/src/components/chat/SessionActionsMenu.tsx`

**Reference Files (v0 Design):**
- `/Users/sinameraji/Craft/decision-journal-redesign/app/chat/page.tsx`

#### ChatHistorySidebar Component
**Features:**
- "New Chat" button at top
- List of sessions sorted by `updated_at` (newest first)
- Each session shows:
  - Title (or truncated first message)
  - Time ago (using `date-fns/formatDistanceToNow`)
  - Message count badge
  - Linked decision indicator (if applicable)
- Click session to switch
- Hover to show actions menu
- Empty state: "No chat history yet"
- Loading state with skeleton
- Search/filter functionality

**Props:**
```typescript
interface ChatHistorySidebarProps {
  className?: string
}
```

**State Hooks:**
```typescript
const sessions = useStore(state => state.sessions)
const currentSessionId = useStore(state => state.currentSessionId)
const isLoadingSessions = useStore(state => state.isLoadingSessions)
const searchQuery = useStore(state => state.searchQuery)
const createNewSession = useStore(state => state.createNewSession)
const loadChatSessions = useStore(state => state.loadChatSessions)
const loadMessagesFromSession = useStore(state => state.loadMessagesFromSession)
const setSearchQuery = useStore(state => state.setSearchQuery)
```

**Adaptations from v1:**
- Replace `next/link` → `@tanstack/react-router` Link
- Use v2 Button/Card/Badge components from `/src/components/ui/`
- Match v0 visual styling (warm brown palette)
- Use Tailwind classes from v2 design system

**Layout:**
```tsx
<aside className="w-64 border-r bg-sidebar">
  <div className="p-4">
    <Button onClick={createNewSession} className="w-full">
      <Plus /> New Chat
    </Button>
  </div>

  <div className="px-2">
    <Input
      placeholder="Search chats..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>

  <ScrollArea className="flex-1">
    {filteredSessions.map(session => (
      <ChatSessionItem
        key={session.id}
        session={session}
        isActive={session.id === currentSessionId}
        onSelect={() => loadMessagesFromSession(session.id)}
      />
    ))}
  </ScrollArea>
</aside>
```

#### ChatSessionItem Component
**Features:**
- Display session title or preview
- Show time ago
- Message count badge
- Linked decision indicator
- Active state highlighting
- Hover actions menu trigger

**Props:**
```typescript
interface ChatSessionItemProps {
  session: ChatSessionWithMetadata
  isActive: boolean
  onSelect: () => void
}
```

**Layout:**
```tsx
<div
  className={cn(
    "p-3 rounded hover:bg-accent cursor-pointer",
    isActive && "bg-accent"
  )}
  onClick={onSelect}
>
  <div className="flex items-start justify-between">
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium truncate">
        {session.title || session.first_message_preview || "New Chat"}
      </h4>
      {session.linked_decision_title && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Link2 className="h-3 w-3" />
          {session.linked_decision_title}
        </p>
      )}
    </div>
    <SessionActionsMenu session={session} />
  </div>

  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
    <span>{formatDistanceToNow(session.updated_at)} ago</span>
    <Badge variant="secondary" className="h-4 px-1 text-xs">
      {session.message_count}
    </Badge>
  </div>
</div>
```

#### SessionActionsMenu Component
**Features:**
- Dropdown menu (Radix UI DropdownMenu)
- Actions: Rename, Delete
- Only visible on hover
- Rename: Opens dialog with input
- Delete: Shows confirmation with "DELETE" text requirement

**Props:**
```typescript
interface SessionActionsMenuProps {
  session: ChatSessionWithMetadata
}
```

**Actions:**
```typescript
const renameSession = useStore(state => state.renameSession)
const deleteSession = useStore(state => state.deleteSession)
```

**Layout:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-6 w-6">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
      <Edit className="h-4 w-4 mr-2" />
      Rename
    </DropdownMenuItem>
    <DropdownMenuItem
      onClick={() => setShowDeleteDialog(true)}
      className="text-destructive"
    >
      <Trash className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

<Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
  {/* Rename input */}
</Dialog>

<ConfirmDialog
  open={showDeleteDialog}
  onOpenChange={setShowDeleteDialog}
  requireConfirmation="DELETE"
  onConfirm={() => deleteSession(session.id)}
/>
```

**Verification Checklist:**
- [ ] Sidebar renders with sessions list
- [ ] "New Chat" button creates session
- [ ] Can switch between sessions
- [ ] Can delete session with "DELETE" confirmation
- [ ] Can rename session
- [ ] Active session is highlighted
- [ ] Search filters sessions
- [ ] Empty state displays correctly
- [ ] Loading state displays correctly
- [ ] Matches v0 design aesthetic
- [ ] Time ago updates properly
- [ ] Message count is accurate
- [ ] Linked decision shows correctly

---

### ⏳ Phase 10D: Chat UI Components - Part 2 (PENDING)
**Duration:** 2-3 hours
**Status:** 🔴 Not Started

**Files to Create:**
1. `/src/components/chat/ModelSelectorModal.tsx`
2. `/src/components/chat/ModelSelectorButton.tsx`
3. `/src/components/chat/ModelListItem.tsx`

**Reference Files (v1):**
- `/Users/sinameraji/Craft/decision_journal/src/components/chat/ModelSelectorModal.tsx`
- `/Users/sinameraji/Craft/decision_journal/src/components/chat/ModelSelectorButton.tsx`
- `/Users/sinameraji/Craft/decision_journal/src/components/chat/ModelListItem.tsx`

**Reference Files (v0 Design):**
- `/Users/sinameraji/Craft/decision-journal-redesign/components/model-selector-modal.tsx`

#### ModelSelectorModal Component
**Features:**
- Full-screen dialog (Radix UI Dialog)
- Three main sections:
  1. **Installed Models** - Radio selection of available models
  2. **Available to Download** - Recommended models with download button
  3. **Custom Model** - Input field + download button for any Ollama model
- Show model metadata: size, family, description
- Download progress bar during model pull
- Link to Ollama Model Library
- Ollama connection status check
- Close button

**Props:**
```typescript
interface ModelSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**State Hooks:**
```typescript
const selectedModel = useStore(state => state.selectedModel)
const availableModels = useStore(state => state.availableModels)
const downloadingModels = useStore(state => state.downloadingModels)
const isLoadingModels = useStore(state => state.isLoadingModels)
const loadAvailableModels = useStore(state => state.loadAvailableModels)
const setSelectedModel = useStore(state => state.setSelectedModel)
const downloadModel = useStore(state => state.downloadModel)
```

**Recommended Models (hardcoded list):**
```typescript
const RECOMMENDED_MODELS = [
  { name: 'gemma3:1b', size: '777.5 MB', description: 'Fast, lightweight model' },
  { name: 'llama3.2:1b', size: '1.3 GB', description: 'Latest Llama 3.2 model' },
  { name: 'llama3.2:3b', size: '2.0 GB', description: 'More capable Llama model' },
  { name: 'phi3:mini', size: '2.3 GB', description: 'Microsoft Phi-3 mini' },
  { name: 'qwen2.5:7b', size: '4.7 GB', description: 'Powerful Qwen 2.5 model' },
]
```

**Layout:**
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Select AI Model</DialogTitle>
      <DialogDescription>
        Choose a model or download a new one
      </DialogDescription>
    </DialogHeader>

    {/* Section 1: Installed Models */}
    <div className="space-y-2">
      <h3 className="font-medium">Installed Models</h3>
      {availableModels.map(model => (
        <ModelListItem
          key={model.name}
          model={model}
          isSelected={selectedModel === model.name}
          onSelect={() => setSelectedModel(model.name)}
          variant="installed"
        />
      ))}
    </div>

    <Separator />

    {/* Section 2: Available to Download */}
    <div className="space-y-2">
      <h3 className="font-medium">Available to Download</h3>
      {RECOMMENDED_MODELS.map(model => (
        <ModelListItem
          key={model.name}
          model={model}
          onDownload={() => downloadModel(model.name)}
          downloadProgress={downloadingModels.get(model.name)}
          variant="download"
        />
      ))}
    </div>

    <Separator />

    {/* Section 3: Custom Model */}
    <div className="space-y-2">
      <h3 className="font-medium">Custom Model</h3>
      <div className="flex gap-2">
        <Input
          placeholder="e.g., mistral:latest"
          value={customModelName}
          onChange={(e) => setCustomModelName(e.target.value)}
        />
        <Button onClick={() => downloadModel(customModelName)}>
          Download
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Browse models at{' '}
        <a
          href="https://ollama.com/library"
          target="_blank"
          className="text-primary hover:underline"
        >
          ollama.com/library
        </a>
      </p>
    </div>

    <DialogFooter>
      <p className="text-xs text-muted-foreground">
        Models run locally on your machine. No data is sent to external servers.
      </p>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### ModelSelectorButton Component
**Features:**
- Button showing current model name
- Badge showing download count (if any downloads in progress)
- Opens ModelSelectorModal on click
- Bouncing animation on download badge

**Props:**
```typescript
interface ModelSelectorButtonProps {
  className?: string
}
```

**Layout:**
```tsx
<Button
  variant="outline"
  onClick={() => setModalOpen(true)}
  className={cn("gap-2", className)}
>
  <Bot className="h-4 w-4" />
  Model: {selectedModel || 'None selected'}
  {downloadingModels.size > 0 && (
    <Badge className="ml-2 animate-bounce">
      {downloadingModels.size}
    </Badge>
  )}
</Button>

<ModelSelectorModal
  open={modalOpen}
  onOpenChange={setModalOpen}
/>
```

#### ModelListItem Component
**Features:**
- Two variants: "installed" (radio button) and "download" (download button)
- Display model name, size, family/description
- Show current badge for selected model
- Download button with loading state
- Progress bar during download

**Props:**
```typescript
interface ModelListItemProps {
  model: {
    name: string
    size?: number | string
    family?: string
    description?: string
  }
  variant: 'installed' | 'download'
  isSelected?: boolean
  onSelect?: () => void
  onDownload?: () => void
  downloadProgress?: DownloadProgress
}
```

**Layout (Installed):**
```tsx
<div className="flex items-center gap-3 p-3 rounded border">
  <input
    type="radio"
    checked={isSelected}
    onChange={onSelect}
  />
  <div className="flex-1">
    <div className="flex items-center gap-2">
      <p className="font-medium">{model.name}</p>
      {isSelected && (
        <Badge variant="default" className="text-xs">Current</Badge>
      )}
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{formatSize(model.size)}</span>
      <span>•</span>
      <span>{model.family}</span>
    </div>
  </div>
</div>
```

**Layout (Download):**
```tsx
<div className="flex items-center gap-3 p-3 rounded border">
  <div className="flex-1">
    <p className="font-medium">{model.name}</p>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{model.size}</span>
      <span>•</span>
      <span>{model.description}</span>
    </div>
  </div>

  {downloadProgress ? (
    <div className="w-32">
      <Progress value={(downloadProgress.completed / downloadProgress.total) * 100} />
      <p className="text-xs text-center">{downloadProgress.status}</p>
    </div>
  ) : (
    <Button size="sm" onClick={onDownload}>
      <Download className="h-4 w-4" />
    </Button>
  )}
</div>
```

**Verification Checklist:**
- [ ] Modal opens and closes correctly
- [ ] Installed models display with radio buttons
- [ ] Can switch between installed models
- [ ] Recommended models display with download buttons
- [ ] Can download recommended models
- [ ] Download progress shows accurately
- [ ] Custom model input works
- [ ] Can download custom models
- [ ] Link to Ollama library opens
- [ ] Model metadata (size, family) displays correctly
- [ ] Current model badge shows
- [ ] Button shows download count badge
- [ ] Badge animates when downloading
- [ ] Matches v0 design

---

### ⏳ Phase 10E: Chat UI Components - Part 3 (PENDING)
**Duration:** 1-2 hours
**Status:** 🔴 Not Started

**Files to Create:**
1. `/src/components/chat/VoiceInputButton.tsx`
2. `/src/components/chat/OllamaSetup.tsx` (optional, for onboarding)

**Reference Files (v0 Design):**
- `/Users/sinameraji/Craft/decision-journal-redesign/components/voice-input-button.tsx`

**Reference Files (v1):**
- `/Users/sinameraji/Craft/decision_journal/src/components/chat/OllamaSetup.tsx`

#### VoiceInputButton Component
**Features:**
- Three states: `idle`, `recording`, `confirming`
- **Idle:** Microphone icon button
- **Recording:** Red pulse animation, timer, stop button
- **Confirming:** Green checkmark (accept), red X (reject)
- Timer display: `MM:SS` format
- Callback on transcript confirmation

**Props:**
```typescript
interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  className?: string
  size?: 'sm' | 'md'
}
```

**State:**
```typescript
const [state, setState] = useState<'idle' | 'recording' | 'confirming'>('idle')
const [transcript, setTranscript] = useState('')
const [duration, setDuration] = useState(0)
```

**Implementation Note:**
- Web Speech API or external service required for actual transcription
- For now: Implement UI structure with placeholder functionality
- Show "Coming soon" toast when clicked
- Can be enhanced later with real speech-to-text

**Layout (Idle):**
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={startRecording}
  className={cn("h-8 w-8", className)}
>
  <Mic className="h-4 w-4" />
</Button>
```

**Layout (Recording):**
```tsx
<div className="flex items-center gap-2">
  <div className="relative">
    <div className="absolute inset-0 bg-destructive rounded-full animate-ping opacity-75" />
    <Button
      variant="destructive"
      size="icon"
      onClick={stopRecording}
      className="relative"
    >
      <Square className="h-4 w-4" />
    </Button>
  </div>
  <span className="text-sm font-mono">
    {formatDuration(duration)}
  </span>
</div>
```

**Layout (Confirming):**
```tsx
<div className="flex items-center gap-2">
  <Button
    variant="default"
    size="icon"
    onClick={confirmTranscript}
    className="bg-green-500"
  >
    <Check className="h-4 w-4" />
  </Button>
  <Button
    variant="destructive"
    size="icon"
    onClick={discardTranscript}
  >
    <X className="h-4 w-4" />
  </Button>
</div>
```

#### OllamaSetup Component (Optional)
**Features:**
- First-time setup wizard
- Check Ollama installation
- Platform-specific instructions (macOS, Windows, Linux)
- Download model workflow
- Progress tracking
- Completion state

**When to show:**
- On first app launch if Ollama not detected
- Can be triggered from settings
- Shows in modal/dialog

**Layout:**
```tsx
<Dialog open={showSetup} onOpenChange={setShowSetup}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Set Up AI Chat</DialogTitle>
    </DialogHeader>

    {step === 'checking' && <CheckingOllama />}
    {step === 'install-ollama' && <InstallInstructions platform={platform} />}
    {step === 'installing-model' && <ModelDownloadProgress />}
    {step === 'complete' && <SetupComplete />}
  </DialogContent>
</Dialog>
```

**Verification Checklist:**
- [ ] Voice button renders correctly
- [ ] Three states display properly
- [ ] Recording state shows timer
- [ ] Recording state has pulse animation
- [ ] Confirming state shows accept/reject buttons
- [ ] Placeholder functionality works (shows toast)
- [ ] UI matches v0 design
- [ ] Size variants work (sm, md)
- [ ] Ollama setup shows on first launch (if implemented)

---

### ⏳ Phase 10F: Integrate Chat Components (PENDING)
**Duration:** 2-3 hours
**Status:** 🔴 Not Started

**Files to Modify:**
1. `/src/pages/chat.tsx` - Complete rewrite

**Reference Files (v0 Design):**
- `/Users/sinameraji/Craft/decision-journal-redesign/app/chat/page.tsx`

**Current File:**
- `/Users/sinameraji/Craft/decision-journal-redesign/v2/src/pages/chat.tsx` (basic implementation, 250 lines)

#### New Chat Page Layout

**Features:**
- Two-pane layout: History sidebar (left) + Chat area (right)
- Header with title and model selector
- Messages area with auto-scroll
- Input area with text, voice button, send button
- Suggested prompts on empty state
- Context indicator ("2 decisions available for context")
- Message streaming support
- Abort generation button
- Loading states

**State Hooks:**
```typescript
const messages = useStore(state => state.messages)
const currentSessionId = useStore(state => state.currentSessionId)
const isLoading = useStore(state => state.isLoading)
const sessions = useStore(state => state.sessions)
const addMessage = useStore(state => state.addMessage)
const saveMessageToDb = useStore(state => state.saveMessageToDb)
const createNewSession = useStore(state => state.createNewSession)
const loadChatSessions = useStore(state => state.loadChatSessions)
const clearMessages = useStore(state => state.clearMessages)
```

**Suggested Prompts (from v0):**
```typescript
const SUGGESTED_PROMPTS = [
  "What patterns do you notice in my recent decisions?",
  "Help me think through my latest decision",
  "What cognitive biases should I watch out for?",
  "How can I improve my decision-making process?",
]
```

**Layout Structure:**
```tsx
<div className="flex h-[calc(100vh-4rem)]">
  {/* Left: Chat History Sidebar */}
  <ChatHistorySidebar />

  {/* Right: Chat Area */}
  <div className="flex-1 flex flex-col">
    {/* Header */}
    <div className="border-b px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="font-serif text-2xl font-semibold">
          AI Decision Coach
        </h1>
        <p className="text-sm text-muted-foreground">
          Discuss your decisions with an AI assistant
        </p>
      </div>
      <ModelSelectorButton />
    </div>

    {/* Messages Area */}
    <ScrollArea className="flex-1 p-6">
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <MessagesList />
      )}
      <div ref={messagesEndRef} />
    </ScrollArea>

    {/* Input Area */}
    <div className="border-t p-4">
      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>{availableDecisionsCount} decisions available for context</span>
      </div>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 min-h-[60px] max-h-[200px]"
          disabled={isLoading}
        />
        <VoiceInputButton
          onTranscript={setInput}
          size="md"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  </div>
</div>
```

**Empty State Component:**
```tsx
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Bot className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
        Ask questions about your decisions or get help thinking through choices
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            className="h-auto p-4 text-left whitespace-normal"
            onClick={() => setInput(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  )
}
```

**Messages List Component:**
```tsx
function MessagesList() {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3",
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {message.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
          )}

          <div
            className={cn(
              "max-w-[80%] rounded-lg p-3",
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>

          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

**Message Streaming Implementation:**
```typescript
const handleSend = async () => {
  if (!input.trim() || isLoading) return

  // Create session if needed
  if (!currentSessionId) {
    await createNewSession()
  }

  // Add user message
  const userMessage: Message = {
    id: crypto.randomUUID(),
    role: 'user',
    content: input.trim(),
    timestamp: Date.now(),
  }
  addMessage(userMessage)
  await saveMessageToDb(userMessage)
  setInput('')

  // Create assistant message placeholder
  const assistantMessageId = crypto.randomUUID()
  const assistantMessage: Message = {
    id: assistantMessageId,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
  }
  addMessage(assistantMessage)

  // Prepare messages for Ollama
  const ollamaMessages = [
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

  // Stream response
  const abortController = new AbortController()
  setAbortController(abortController)

  try {
    await ollamaService.chatStream(
      ollamaMessages,
      // onChunk
      (text) => {
        // Update assistant message content
        useStore.setState(state => ({
          messages: state.messages.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + text }
              : msg
          ),
        }))
      },
      // onComplete
      async () => {
        setIsLoading(false)
        setAbortController(null)
        // Save assistant message
        const finalMessage = useStore.getState().messages.find(
          m => m.id === assistantMessageId
        )
        if (finalMessage) {
          await saveMessageToDb(finalMessage)
        }
      },
      // onError
      (error) => {
        console.error('Chat error:', error)
        toast.error('Failed to get response', {
          description: error.message,
        })
        setIsLoading(false)
        setAbortController(null)
      },
      undefined, // default model
      undefined, // default options
      abortController.signal
    )
  } catch (error) {
    console.error('Send message error:', error)
  }
}
```

**Keyboard Shortcuts:**
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  // Enter = send, Shift+Enter = new line
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
```

**Auto-scroll:**
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])
```

**Load Sessions on Mount:**
```typescript
useEffect(() => {
  loadChatSessions()
}, [loadChatSessions])
```

**Verification Checklist:**
- [ ] Full chat workflow works end-to-end
- [ ] Can create new sessions
- [ ] Can switch between sessions
- [ ] Can send messages and receive responses
- [ ] Messages stream correctly (text appears incrementally)
- [ ] Messages persist to database
- [ ] Sessions persist across app restart
- [ ] Can abort message generation
- [ ] Model switching works
- [ ] Suggested prompts populate input
- [ ] Auto-scroll works
- [ ] Enter sends, Shift+Enter adds new line
- [ ] Context indicator shows decision count
- [ ] Layout matches v0 design
- [ ] Sidebar can collapse/expand (if implemented)
- [ ] Voice input button displays
- [ ] Empty state shows correctly
- [ ] Loading states work
- [ ] Error handling works

---

## Phase 11: Complete Analytics Feature

### ⏳ Phase 11A: Analytics Service Layer (PENDING)
**Duration:** 3-4 hours
**Status:** 🔴 Not Started

**Files to Create:**
1. `/src/services/analytics/analytics-service.ts`
2. `/src/types/analytics.ts`

**Reference Files (v0):**
- `/Users/sinameraji/Craft/decision-journal-redesign/src/services/analytics/analytics-service.ts`
- `/Users/sinameraji/Craft/decision-journal-redesign/src/types/analytics.ts`

#### Types to Define

**File:** `/src/types/analytics.ts`

```typescript
import type { Decision } from './decision'

export interface DecisionQualityScore {
  overall: number // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  factors: {
    alternativesConsidered: number // 0-25
    depthOfAnalysis: number // 0-25
    contextAnalysis: number // 0-20
    mentalContextAwareness: number // 0-15
    outcomeProjections: number // 0-15
  }
  breakdown: {
    alternativesConsidered: { score: number; max: number; details: string }
    depthOfAnalysis: { score: number; max: number; details: string }
    contextAnalysis: { score: number; max: number; details: string }
    mentalContextAwareness: { score: number; max: number; details: string }
    outcomeProjections: { score: number; max: number; details: string }
  }
}

export interface CalibrationPoint {
  confidenceLevel: number // 0-10
  actualAccuracy: number // 0-100 (percentage of decisions at this confidence that succeeded)
  count: number // number of decisions at this confidence level
}

export interface CalibrationData {
  brierScore: number // 0-1, lower is better
  overconfidenceRatio: number // positive = overconfident, negative = underconfident
  calibrationPoints: CalibrationPoint[]
  recommendation: string
}

export interface EmotionalPatternAnalysis {
  flag: string
  count: number
  avgConfidence: number // Average confidence when this flag is present
  avgOutcome: number | null // Average outcome rating (null if no reviewed decisions)
  outcomeVsConfidence: 'better' | 'worse' | 'as-expected' | null
}

export interface TagPatternAnalysis {
  tag: string
  count: number
  avgConfidence: number
  avgOutcome: number | null
}

export interface OverallStats {
  totalDecisions: number
  reviewedCount: number
  reviewRate: number // percentage
  avgConfidence: number
  avgOutcome: number | null
  avgAlternativesConsidered: number
}

export interface AnalyticsData {
  overall: OverallStats
  calibration: CalibrationData | null
  qualityScores: {
    average: number
    gradeDistribution: Record<'A' | 'B' | 'C' | 'D' | 'F', number>
  }
  emotionalPatterns: EmotionalPatternAnalysis[]
  tagPatterns: TagPatternAnalysis[]
  decisionsByMonth: { month: string; count: number }[]
}
```

#### Analytics Service Methods

**File:** `/src/services/analytics/analytics-service.ts`

##### 1. calculateCalibration(decisions: Decision[]): CalibrationData

**Purpose:** Compute Brier Score, overconfidence ratio, and calibration curve

**Algorithm:**
```typescript
// Filter reviewed decisions only
const reviewed = decisions.filter(d => d.outcome_rating !== null)

// Brier Score = average of squared differences between predicted and actual
let brierSum = 0
for (const decision of reviewed) {
  const predicted = decision.confidence_level / 10 // normalize to 0-1
  const actual = decision.outcome_rating! / 10 // normalize to 0-1
  brierSum += Math.pow(predicted - actual, 2)
}
const brierScore = brierSum / reviewed.length

// Overconfidence Ratio = (avg confidence - avg outcome) / 10
const avgConfidence = reviewed.reduce((sum, d) => sum + d.confidence_level, 0) / reviewed.length
const avgOutcome = reviewed.reduce((sum, d) => sum + d.outcome_rating!, 0) / reviewed.length
const overconfidenceRatio = (avgConfidence - avgOutcome) / 10

// Calibration Curve: For each confidence level (0-10), calculate actual success rate
const calibrationPoints: CalibrationPoint[] = []
for (let level = 0; level <= 10; level++) {
  const atLevel = reviewed.filter(d => d.confidence_level === level)
  if (atLevel.length === 0) continue

  const actualAccuracy = (atLevel.reduce((sum, d) => sum + d.outcome_rating!, 0) / atLevel.length) * 10
  calibrationPoints.push({
    confidenceLevel: level,
    actualAccuracy,
    count: atLevel.length,
  })
}

// Recommendation based on overconfidence
let recommendation = ''
if (Math.abs(overconfidenceRatio) < 0.2) {
  recommendation = 'Excellent calibration! Your predictions closely match outcomes.'
} else if (overconfidenceRatio > 0.2) {
  recommendation = 'You tend to be overconfident. Consider being more conservative in your predictions.'
} else {
  recommendation = 'You tend to be underconfident. Consider being less conservative in your predictions.'
}

return { brierScore, overconfidenceRatio, calibrationPoints, recommendation }
```

##### 2. calculateQualityScore(decision: Decision): DecisionQualityScore

**Purpose:** Assign A-F grade based on 5-factor analysis

**Scoring Breakdown:**
```typescript
// Factor 1: Alternatives Considered (0-25 points)
// 5 points per alternative, max 25
const alternativesScore = Math.min(decision.alternatives.length * 5, 25)

// Factor 2: Depth of Analysis (0-25 points)
// Count total pros and cons across all alternatives
let prosConsCount = 0
for (const alt of decision.alternatives) {
  prosConsCount += (alt.pros?.length || 0) + (alt.cons?.length || 0)
}
const depthScore = Math.min(prosConsCount * 2.5, 25)

// Factor 3: Context Analysis (0-20 points)
// Variables (1 pt each, max 10) + Complications (2 pts each, max 10)
const variablesScore = Math.min((decision.variables?.length || 0) * 1, 10)
const complicationsScore = Math.min((decision.complications?.length || 0) * 2, 10)
const contextScore = variablesScore + complicationsScore

// Factor 4: Mental Context Awareness (0-15 points)
// Mental state (5), Physical state (5), Emotional flags (1 pt each, max 5)
const mentalStateScore = decision.mental_state ? 5 : 0
const physicalStateScore = decision.physical_state ? 5 : 0
const emotionalScore = Math.min((decision.emotional_flags?.length || 0) * 1, 5)
const mentalContextScore = mentalStateScore + physicalStateScore + emotionalScore

// Factor 5: Outcome Projections (0-15 points)
// Expected outcome (5), Best case (5), Worst case (5)
const expectedScore = decision.expected_outcome ? 5 : 0
const bestCaseScore = decision.best_case_scenario ? 5 : 0
const worstCaseScore = decision.worst_case_scenario ? 5 : 0
const outcomesScore = expectedScore + bestCaseScore + worstCaseScore

// Total and Grade
const overall = alternativesScore + depthScore + contextScore + mentalContextScore + outcomesScore
const grade = overall >= 90 ? 'A' :
              overall >= 80 ? 'B' :
              overall >= 70 ? 'C' :
              overall >= 60 ? 'D' : 'F'

return {
  overall,
  grade,
  factors: {
    alternativesConsidered: alternativesScore,
    depthOfAnalysis: depthScore,
    contextAnalysis: contextScore,
    mentalContextAwareness: mentalContextScore,
    outcomeProjections: outcomesScore,
  },
  breakdown: {
    alternativesConsidered: {
      score: alternativesScore,
      max: 25,
      details: `${decision.alternatives.length} alternatives considered`,
    },
    // ... similar for other factors
  },
}
```

##### 3. analyzeEmotionalPatterns(decisions: Decision[]): EmotionalPatternAnalysis[]

**Purpose:** Analyze decision quality under different emotional states

**Algorithm:**
```typescript
const patterns = new Map<string, {
  count: number
  confidenceSum: number
  outcomeSum: number
  outcomeCount: number
}>()

for (const decision of decisions) {
  for (const flag of decision.emotional_flags || []) {
    if (!patterns.has(flag)) {
      patterns.set(flag, { count: 0, confidenceSum: 0, outcomeSum: 0, outcomeCount: 0 })
    }

    const data = patterns.get(flag)!
    data.count++
    data.confidenceSum += decision.confidence_level

    if (decision.outcome_rating !== null) {
      data.outcomeSum += decision.outcome_rating
      data.outcomeCount++
    }
  }
}

// Convert to array and calculate averages
const result: EmotionalPatternAnalysis[] = []
for (const [flag, data] of patterns) {
  const avgConfidence = data.confidenceSum / data.count
  const avgOutcome = data.outcomeCount > 0 ? data.outcomeSum / data.outcomeCount : null

  let outcomeVsConfidence: 'better' | 'worse' | 'as-expected' | null = null
  if (avgOutcome !== null) {
    const diff = avgOutcome - avgConfidence
    if (diff > 1) outcomeVsConfidence = 'better'
    else if (diff < -1) outcomeVsConfidence = 'worse'
    else outcomeVsConfidence = 'as-expected'
  }

  result.push({
    flag,
    count: data.count,
    avgConfidence,
    avgOutcome,
    outcomeVsConfidence,
  })
}

// Sort by frequency
return result.sort((a, b) => b.count - a.count).slice(0, 8)
```

##### 4. analyzeTagPatterns(decisions: Decision[]): TagPatternAnalysis[]

**Purpose:** Analyze performance by decision category

**Algorithm:** (Similar to emotional patterns)

##### 5. getOverallStats(decisions: Decision[]): OverallStats

**Purpose:** Calculate aggregate statistics

**Algorithm:**
```typescript
const totalDecisions = decisions.length
const reviewedDecisions = decisions.filter(d => d.outcome_rating !== null)
const reviewedCount = reviewedDecisions.length
const reviewRate = (reviewedCount / totalDecisions) * 100

const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence_level, 0) / totalDecisions
const avgOutcome = reviewedCount > 0
  ? reviewedDecisions.reduce((sum, d) => sum + d.outcome_rating!, 0) / reviewedCount
  : null

const avgAlternativesConsidered = decisions.reduce((sum, d) => sum + d.alternatives.length, 0) / totalDecisions

return {
  totalDecisions,
  reviewedCount,
  reviewRate,
  avgConfidence,
  avgOutcome,
  avgAlternativesConsidered,
}
```

**Verification Checklist:**
- [ ] All types compile
- [ ] Brier Score calculation is mathematically correct
- [ ] Calibration curve handles all confidence levels
- [ ] Quality scoring adds up to 100 points
- [ ] Grade assignment works correctly (A-F)
- [ ] Emotional pattern analysis groups correctly
- [ ] Tag pattern analysis groups correctly
- [ ] Overall stats calculations are accurate
- [ ] Edge cases handled (no decisions, no reviews, empty arrays)
- [ ] Overconfidence ratio calculates correctly

---

### ⏳ Phase 11B: Analytics UI Components (PENDING)
**Duration:** 4-5 hours
**Status:** 🔴 Not Started

**Files to Modify:**
1. `/src/pages/analytics.tsx` - Complete rewrite

**Reference Files (v0):**
- `/Users/sinameraji/Craft/decision-journal-redesign/src/pages/AnalyticsPage.tsx`

**Current File:**
- `/Users/sinameraji/Craft/decision-journal-redesign/v2/src/pages/analytics.tsx` (basic, 335 lines)

#### New Analytics Page Layout

**Components to Create:**
1. StatCard - Key metric display
2. CalibrationCard - Calibration analysis display
3. QualityScoreCard - Quality score display
4. BarChart - Reusable bar chart
5. PatternCard - Emotional/tag pattern display

**Main Layout Structure:**
```tsx
<div className="max-w-6xl mx-auto px-6 py-8">
  {/* Header */}
  <PageHeader />

  {decisions.length === 0 ? (
    <EmptyState />
  ) : (
    <>
      {/* Section 1: Key Metrics Cards (4-column grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Decisions"
          value={analytics.overall.totalDecisions}
          icon={BarChart3}
        />
        <StatCard
          title="Reviewed"
          value={analytics.overall.reviewedCount}
          subtitle={`${analytics.overall.reviewRate.toFixed(0)}% of total`}
          icon={Clock}
        />
        <StatCard
          title="Avg Confidence"
          value={`${analytics.overall.avgConfidence.toFixed(1)}/10`}
          progress={analytics.overall.avgConfidence * 10}
          icon={Target}
        />
        <StatCard
          title="Avg Outcome"
          value={analytics.overall.avgOutcome !== null
            ? `${analytics.overall.avgOutcome.toFixed(1)}/10`
            : 'N/A'}
          progress={analytics.overall.avgOutcome ? analytics.overall.avgOutcome * 10 : 0}
          icon={TrendingUp}
        />
      </div>

      {/* Section 2: Calibration Analysis (if reviews exist) */}
      {analytics.calibration && (
        <CalibrationCard calibration={analytics.calibration} />
      )}

      {/* Section 3: Decision Quality */}
      <QualityScoreCard qualityScores={analytics.qualityScores} />

      {/* Section 4: Unreviewed Decisions Alert */}
      {unreviewedCount > 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Review your decisions</AlertTitle>
          <AlertDescription>
            You have {unreviewedCount} unreviewed decisions. Reviews are essential
            for calibration analysis and improving decision-making.
            <Button variant="link" asChild className="p-0 ml-2">
              <Link to="/reviews">Go to Reviews</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Section 5: Decisions by Month */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Decisions by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={analytics.decisionsByMonth} />
        </CardContent>
      </Card>

      {/* Section 6: Emotional Patterns & Tag Patterns (2-column) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Emotional Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.emotionalPatterns.map(pattern => (
                <PatternCard key={pattern.flag} pattern={pattern} type="emotional" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tag Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.tagPatterns.map(pattern => (
                <PatternCard key={pattern.tag} pattern={pattern} type="tag" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )}
</div>
```

#### StatCard Component
```typescript
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  progress?: number // 0-100
  icon: LucideIcon
}

function StatCard({ title, value, subtitle, progress, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-serif font-semibold">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {progress !== undefined && (
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

#### CalibrationCard Component
```typescript
interface CalibrationCardProps {
  calibration: CalibrationData
}

function CalibrationCard({ calibration }: CalibrationCardProps) {
  const { brierScore, overconfidenceRatio, calibrationPoints, recommendation } = calibration

  // Color code the recommendation
  const recommendationColor =
    Math.abs(overconfidenceRatio) < 0.2 ? 'text-green-600' :
    overconfidenceRatio > 0.2 ? 'text-orange-600' : 'text-blue-600'

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Calibration Analysis
        </CardTitle>
        <CardDescription>
          How well do your predictions match actual outcomes?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Brier Score */}
          <div>
            <p className="text-sm font-medium mb-1">Brier Score</p>
            <p className="text-2xl font-semibold">{brierScore.toFixed(3)}</p>
            <p className="text-xs text-muted-foreground">Lower is better (0-1 scale)</p>
          </div>

          {/* Overconfidence Ratio */}
          <div>
            <p className="text-sm font-medium mb-1">Overconfidence Ratio</p>
            <p className="text-2xl font-semibold">{overconfidenceRatio.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {overconfidenceRatio > 0 ? 'Overconfident' : 'Underconfident'}
            </p>
          </div>
        </div>

        {/* Calibration Curve */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-3">Calibration Curve</p>
          <div className="space-y-2">
            {calibrationPoints.map(point => (
              <div key={point.confidenceLevel}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Confidence: {point.confidenceLevel}/10</span>
                  <span className="text-muted-foreground">
                    Accuracy: {point.actualAccuracy.toFixed(0)}% ({point.count} decisions)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${point.actualAccuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className={recommendationColor}>Recommendation</AlertTitle>
          <AlertDescription>{recommendation}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
```

#### QualityScoreCard Component
```typescript
interface QualityScoreCardProps {
  qualityScores: {
    average: number
    gradeDistribution: Record<'A' | 'B' | 'C' | 'D' | 'F', number>
  }
}

function QualityScoreCard({ qualityScores }: QualityScoreCardProps) {
  const { average, gradeDistribution } = qualityScores

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Decision Quality</CardTitle>
        <CardDescription>
          Based on depth of analysis, context awareness, and outcome projections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Average Score */}
          <div>
            <p className="text-sm font-medium mb-1">Average Quality Score</p>
            <p className="text-4xl font-serif font-semibold">{average.toFixed(0)}</p>
            <p className="text-lg text-muted-foreground">out of 100</p>
          </div>

          {/* Grade Distribution */}
          <div>
            <p className="text-sm font-medium mb-2">Grade Distribution</p>
            <div className="space-y-1">
              {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => (
                <div key={grade} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-4">{grade}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(gradeDistribution[grade] / Object.values(gradeDistribution).reduce((a, b) => a + b, 0)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {gradeDistribution[grade]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### PatternCard Component
```typescript
interface PatternCardProps {
  pattern: EmotionalPatternAnalysis | TagPatternAnalysis
  type: 'emotional' | 'tag'
}

function PatternCard({ pattern, type }: PatternCardProps) {
  const label = type === 'emotional' ? pattern.flag : (pattern as TagPatternAnalysis).tag

  // Outcome indicator
  let outcomeIndicator = null
  if ('outcomeVsConfidence' in pattern && pattern.outcomeVsConfidence) {
    const color =
      pattern.outcomeVsConfidence === 'better' ? 'text-green-600' :
      pattern.outcomeVsConfidence === 'worse' ? 'text-red-600' : 'text-gray-600'

    const text =
      pattern.outcomeVsConfidence === 'better' ? 'Outcomes better than expected' :
      pattern.outcomeVsConfidence === 'worse' ? 'Outcomes worse than expected' : 'As expected'

    outcomeIndicator = <p className={cn("text-xs", color)}>{text}</p>
  }

  return (
    <div className="p-3 border rounded">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium capitalize">{label}</h4>
        <Badge variant="secondary">{pattern.count}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Avg Confidence</p>
          <p className="font-medium">{pattern.avgConfidence.toFixed(1)}/10</p>
        </div>
        {pattern.avgOutcome !== null && (
          <div>
            <p className="text-xs text-muted-foreground">Avg Outcome</p>
            <p className="font-medium">{pattern.avgOutcome.toFixed(1)}/10</p>
          </div>
        )}
      </div>

      {outcomeIndicator && <div className="mt-2">{outcomeIndicator}</div>}
    </div>
  )
}
```

**Verification Checklist:**
- [ ] All sections render with test data
- [ ] Key metrics cards display correctly
- [ ] Calibration card shows when reviews exist
- [ ] Calibration curve displays accurately
- [ ] Brier Score displays correctly
- [ ] Overconfidence ratio displays correctly
- [ ] Recommendation color codes correctly
- [ ] Quality score card displays
- [ ] Grade distribution displays correctly
- [ ] Unreviewed alert shows when applicable
- [ ] Alert links to reviews page
- [ ] Decisions by month chart displays
- [ ] Emotional patterns show all 8 flags
- [ ] Tag patterns show top 8 tags
- [ ] Pattern cards show confidence and outcome
- [ ] Outcome vs confidence indicator displays
- [ ] Empty state displays when no decisions
- [ ] Layout matches v0 design
- [ ] Responsive on different screen sizes

---

### ⏳ Phase 11C: Analytics Integration & Testing (PENDING)
**Duration:** 1-2 hours
**Status:** 🔴 Not Started

**Tasks:**
1. Wire analytics page to Zustand store
2. Load decisions on page mount
3. Calculate all metrics using analytics service
4. Add loading states
5. Add error handling
6. Test with various data scenarios

**Implementation:**
```typescript
export function AnalyticsPage() {
  const decisions = useStore(state => state.decisions)
  const loadDecisions = useStore(state => state.loadDecisions)
  const isLoading = useStore(state => state.isLoading)

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  // Load decisions on mount
  useEffect(() => {
    loadDecisions()
  }, [loadDecisions])

  // Calculate analytics when decisions change
  useEffect(() => {
    if (decisions.length === 0) {
      setAnalytics(null)
      return
    }

    try {
      const overall = analyticsService.getOverallStats(decisions)

      const calibration = overall.reviewedCount > 0
        ? analyticsService.calculateCalibration(decisions)
        : null

      // Calculate quality scores for all decisions
      const qualityScores = decisions.map(d =>
        analyticsService.calculateQualityScore(d)
      )
      const avgQuality = qualityScores.reduce((sum, q) => sum + q.overall, 0) / qualityScores.length
      const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
      qualityScores.forEach(q => gradeDistribution[q.grade]++)

      const emotionalPatterns = analyticsService.analyzeEmotionalPatterns(decisions)
      const tagPatterns = analyticsService.analyzeTagPatterns(decisions)

      // Decisions by month
      const monthCounts = new Map<string, number>()
      decisions.forEach(d => {
        const date = new Date(d.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1)
      })
      const decisionsByMonth = Array.from(monthCounts.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6)

      setAnalytics({
        overall,
        calibration,
        qualityScores: {
          average: avgQuality,
          gradeDistribution,
        },
        emotionalPatterns,
        tagPatterns,
        decisionsByMonth,
      })
    } catch (error) {
      console.error('Failed to calculate analytics:', error)
      toast.error('Failed to calculate analytics')
    }
  }, [decisions])

  // Render logic...
}
```

**Test Scenarios:**
1. **No decisions:** Empty state displays
2. **Some decisions, none reviewed:** Basic stats only, no calibration
3. **Many decisions with reviews:** Full analytics display
4. **Edge cases:**
   - All decisions have confidence = 10
   - All decisions have confidence = 0
   - Mix of emotional flags
   - Mix of tags
   - Single decision
   - 100+ decisions (performance test)

**Verification Checklist:**
- [ ] Analytics page loads quickly (<1 second)
- [ ] All calculations are accurate
- [ ] No errors in console
- [ ] Handles edge cases gracefully
- [ ] Empty state works
- [ ] Loading state works
- [ ] Matches v0 feature set 100%
- [ ] All visualizations display correctly
- [ ] Responsive layout works
- [ ] Performance is acceptable with large datasets

---

## Testing Checklist

### Chat Feature Complete When:
- [ ] Can create new chat sessions
- [ ] Can view chat history in sidebar
- [ ] Can switch between sessions
- [ ] Can delete sessions with "DELETE" confirmation
- [ ] Can rename sessions
- [ ] Can send messages and receive streaming responses
- [ ] Messages persist to database
- [ ] Can browse and download Ollama models
- [ ] Can switch between installed models
- [ ] Model download progress displays
- [ ] Voice input button displays correctly
- [ ] Suggested prompts appear on empty chat
- [ ] Suggested prompts populate input on click
- [ ] Layout matches v0 design
- [ ] Sidebar shows session metadata (time, count, linked decision)
- [ ] Context indicator shows decision count
- [ ] Enter sends message
- [ ] Shift+Enter adds new line
- [ ] Auto-scroll works
- [ ] Can abort message generation
- [ ] All data persists across app restart
- [ ] Search filters sessions
- [ ] Empty states work
- [ ] Loading states work

### Analytics Feature Complete When:
- [ ] All 4 key metric cards display
- [ ] Total decisions count is accurate
- [ ] Reviewed count and percentage are accurate
- [ ] Average confidence displays with progress bar
- [ ] Average outcome displays with progress bar
- [ ] Calibration analysis shows (when reviews exist)
- [ ] Brier Score calculates correctly
- [ ] Brier Score displays with explanation
- [ ] Overconfidence ratio calculates correctly
- [ ] Calibration curve displays accurately
- [ ] Calibration curve shows confidence vs accuracy
- [ ] Recommendation text displays with color coding
- [ ] Decision quality scores calculate correctly
- [ ] Average quality score displays
- [ ] Grade distribution (A-F) displays
- [ ] Unreviewed alert shows when applicable
- [ ] Unreviewed alert links to reviews page
- [ ] Decisions by month chart displays
- [ ] Chart shows last 6 months
- [ ] Emotional patterns show all 8 flags
- [ ] Emotional patterns show count, confidence, outcome
- [ ] Outcome vs confidence indicator works
- [ ] Tag patterns show top 8 tags
- [ ] Tag patterns show count, confidence, outcome
- [ ] Empty state displays when no decisions
- [ ] Loading state displays
- [ ] All calculations match v0 implementation
- [ ] Layout matches v0 design exactly
- [ ] Responsive on different screen sizes
- [ ] Performance < 1 second load time
- [ ] No console errors
- [ ] Handles edge cases (no reviews, single decision, etc.)

---

## Critical Files Reference

### Current v2 Implementation
```
✅ /Users/sinameraji/Craft/decision-journal-redesign/v2/src/types/chat.ts (DONE)
✅ /Users/sinameraji/Craft/decision-journal-redesign/v2/src/store/chat-slice.ts (DONE)
✅ /Users/sinameraji/Craft/decision-journal-redesign/v2/src/store/index.ts (UPDATED)
/Users/sinameraji/Craft/decision-journal-redesign/v2/src/pages/chat.tsx (needs rewrite)
/Users/sinameraji/Craft/decision-journal-redesign/v2/src/pages/analytics.tsx (needs rewrite)
/Users/sinameraji/Craft/decision-journal-redesign/v2/src/services/llm/ollama-service.ts (already working)
/Users/sinameraji/Craft/decision-journal-redesign/v2/src/services/database/sqlite-service.ts (already working)
```

### v1 Backend Reference (Chat)
```
/Users/sinameraji/Craft/decision_journal/src/components/chat/ChatHistorySidebar.tsx
/Users/sinameraji/Craft/decision_journal/src/components/chat/ChatSessionItem.tsx
/Users/sinameraji/Craft/decision_journal/src/components/chat/SessionActionsMenu.tsx
/Users/sinameraji/Craft/decision_journal/src/components/chat/ModelSelectorModal.tsx
/Users/sinameraji/Craft/decision_journal/src/components/chat/ModelSelectorButton.tsx
/Users/sinameraji/Craft/decision_journal/src/components/chat/ModelListItem.tsx
/Users/sinameraji/Craft/decision_journal/src/components/chat/OllamaSetup.tsx
/Users/sinameraji/Craft/decision_journal/src/store/chat-slice.ts (COPIED, adapted for v2)
/Users/sinameraji/Craft/decision_journal/src/types/chat.ts (COPIED)
/Users/sinameraji/Craft/decision_journal/src/utils/chat-context-builder.ts
```

### v0 UI Reference (Chat & Analytics)
```
/Users/sinameraji/Craft/decision-journal-redesign/app/chat/page.tsx
/Users/sinameraji/Craft/decision-journal-redesign/components/model-selector-modal.tsx
/Users/sinameraji/Craft/decision-journal-redesign/components/voice-input-button.tsx
/Users/sinameraji/Craft/decision-journal-redesign/src/pages/AnalyticsPage.tsx
/Users/sinameraji/Craft/decision-journal-redesign/src/services/analytics/analytics-service.ts
/Users/sinameraji/Craft/decision-journal-redesign/src/types/analytics.ts
```

---

## Progress Summary

**Completed:**
- ✅ Phase 10A: Chat types verified (30 min)
- ✅ Phase 10B: Chat state management created (2 hrs)

**Current Status:**
- Build: ✅ Successful (489.00 KB JS, 146.99 KB gzipped)
- Tests: ⏸️  Pending (no tests written yet)
- Commits: 🔴 Not committed yet

**Remaining Work:**
- 🔴 Phase 10C: Chat UI Part 1 (2-3 hrs)
- 🔴 Phase 10D: Chat UI Part 2 (2-3 hrs)
- 🔴 Phase 10E: Chat UI Part 3 (1-2 hrs)
- 🔴 Phase 10F: Integration (2-3 hrs)
- 🔴 Phase 11A: Analytics Service (3-4 hrs)
- 🔴 Phase 11B: Analytics UI (4-5 hrs)
- 🔴 Phase 11C: Analytics Integration (1-2 hrs)

**Estimated Time Remaining:** 16-22 hours

---

## Next Steps

1. **Commit current progress** (Phase 10A & 10B)
2. **Continue with Phase 10C** (Chat UI components Part 1)
3. **Test each phase** before moving to next
4. **Commit after each major phase** (10C, 10D, 10F, 11A, 11B, 11C)
5. **Final testing** of complete features
6. **Verify against checklists**
7. **Proceed to remaining phases** (Reviews, Settings, Search)

---

## Success Criteria

**Chat Feature:**
1. Matches v0 visual design 100%
2. Implements v1 backend functionality 100%
3. All chat workflows work end-to-end
4. Data persists correctly to SQLite
5. Ollama integration fully functional
6. Model management works (browse, download, switch)
7. Session management works (create, load, delete, rename)
8. No console errors
9. Performance is acceptable

**Analytics Feature:**
1. Matches v0 implementation 100%
2. All calculations accurate (Brier Score, quality scores, etc.)
3. All visualizations display correctly
4. Calibration analysis works
5. Quality scoring works (A-F grades)
6. Emotional/tag pattern analysis works
7. Handles all edge cases gracefully
8. Performance is acceptable (<1 second load)
9. No console errors
10. Responsive design works

Both features must be production-ready before proceeding to Phase 12 (Reviews Page).
