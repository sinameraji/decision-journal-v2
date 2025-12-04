# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Decision Journal is a Tauri v2 desktop application (macOS-focused) that helps users make better decisions using the Farnam Street methodology. It combines React 19 + TypeScript + Vite for the frontend with Rust/Tauri for the native backend, SQLite for local storage, and integrates with local Ollama LLM for AI-powered decision coaching.

## Development Commands

```bash
# Frontend development
npm run dev              # Start Vite dev server
npm run build            # Build frontend (TypeScript + Vite)
npm run lint             # Run ESLint

# Tauri/Desktop development
npm run tauri:dev        # Run Tauri in dev mode (also starts frontend)
npm run tauri:build      # Build production desktop app

# Direct Tauri CLI access
npm run tauri <command>  # Access Tauri CLI directly
```

## Architecture

### Frontend Stack
- **React 19** with TypeScript (strict mode enabled)
- **TanStack Router** for file-based routing (routes defined in `src/routes.tsx`)
- **Zustand** for state management with persistence (middleware pattern with slices)
- **Radix UI** + **Tailwind CSS 4** for UI components
- **React Hook Form** + **Zod** for form validation

### Backend Stack
- **Tauri v2.9+** (Rust-based native backend)
- **SQLite** via `@tauri-apps/plugin-sql` (local database, no backend required)
- **Ollama** integration for local LLM (http://localhost:11434)

### Key Architectural Patterns

#### State Management (Zustand Slices)
State is organized into domain slices in `src/store/`:
- `decisions-slice.ts` - Decision CRUD and filtering
- `chat-slice.ts` - Chat sessions, messages, Ollama model management
- `preferences-slice.ts` - User preferences, onboarding, permissions
- `ui-slice.ts` - UI state (theme, font size, sidebar)
- `updater-slice.ts` - App update management

All slices are combined in `src/store/index.ts` with persistence middleware. Only UI preferences and user settings are persisted to localStorage; decisions and chat data live in SQLite.

#### Database Layer
- `src/services/database/sqlite-service.ts` - Main SQLite service
- `src/services/database/sqlite-stub.ts` - Browser stub for development
- Auto-initializes on desktop via `isDesktop()` check from `src/utils/platform.ts`
- Schema includes: `decisions`, `alternatives`, `review_schedules`, `chat_sessions`, `chat_messages`, `user_preferences`

#### LLM Integration
- `src/services/llm/ollama-service.ts` - Ollama API client
- Expects Ollama running on http://localhost:11434
- CSP configured in `src-tauri/tauri.conf.json` to allow localhost connections
- Default model: `gemma3:1b`
- `src/utils/chat-context-builder.ts` - Builds decision context for LLM prompts

#### Routing
Routes are centralized in `src/routes.tsx`:
- `/` - Decision list (index)
- `/new` - Create new decision
- `/decision/$id` - View decision details
- `/decision/$id/review` - Review workflow
- `/chat` - AI chat interface
- `/analytics` - Decision analytics dashboard
- `/reviews` - Scheduled reviews
- `/search` - Advanced search with filters
- `/settings` - App settings

Pages are in `src/pages/` directory.

#### Tauri Plugins
Initialized in `src-tauri/src/lib.rs`:
- `tauri-plugin-shell` - Shell command execution
- `tauri-plugin-notification` - Native notifications
- `tauri-plugin-dialog` - File dialogs
- `tauri-plugin-fs` - File system access
- `tauri-plugin-sql` - SQLite database
- `tauri-plugin-updater` - Auto-update functionality
- `tauri-plugin-log` (debug only) - Logging

### Decision Data Model

Core types in `src/types/decision.ts`:
- `Decision` - Main decision entity with situation, problem statement, alternatives, outcomes
- `Alternative` - Decision option with pros/cons, effort, cost, reversibility
- `ReviewSchedule` - Scheduled reviews (1week, 1month, 3months, 1year)
- `EmotionalFlag` - Mental state tracking (regret, FOMO, fear, anxiety, etc.)

Follows Farnam Street methodology:
1. Capture situation and problem statement
2. Document mental/physical state and emotional flags
3. List alternatives with pros/cons
4. Project best/worst case scenarios
5. Record confidence level (1-10)
6. Schedule future reviews
7. Later: document actual outcome and lessons learned

### Export/Import System

Services in `src/services/export/`:
- `export-service.ts` - Main export orchestrator (JSON, PDF, ZIP)
- `file-save-service.ts` - Tauri file dialogs
- `print-service.ts` - PDF generation with jsPDF
- `zip-service.ts` - Archive creation with JSZip

## Important Implementation Notes

### Platform Detection
Always use `isDesktop()` from `src/utils/platform.ts` to check if running in Tauri vs browser. SQLite and Tauri APIs only work when `isDesktop()` returns true.

### CSP Configuration
Content Security Policy in `src-tauri/tauri.conf.json` allows:
- `http://localhost:*` - For Ollama API (LLM)
- `http://127.0.0.1:*` - Alternative localhost
- `ipc:` - Tauri IPC protocol
- `asset:` - Asset protocol for local files

If adding new localhost services, update CSP accordingly.

### Database Migrations
Schema is defined inline in `sqlite-service.ts` initialize method. When adding tables or columns:
1. Add new schema SQL
2. Handle migration with `ALTER TABLE` or version checks
3. Test both fresh installs and upgrades

### Ollama Model Management
- Models are downloaded/deleted via `chat-slice.ts` actions
- Download progress tracked in Zustand state
- Default models defined in `src/constants/ollama-models.ts`
- Always check `isRunning()` before making Ollama requests

### Form Validation
Decision form schema in `src/schemas/decision-form.schema.ts` uses Zod. When adding form fields:
1. Update Zod schema
2. Update Decision type in `src/types/decision.ts`
3. Update database schema if persisting
4. Add form field components in `src/components/new-decision/`

### Component Organization
- `src/components/ui/` - Base UI components (shadcn/ui style)
- `src/components/chat/` - Chat-specific components
- `src/components/decision/` - Decision-specific components
- `src/components/new-decision/` - Multi-tab decision creation form
- `src/components/search/` - Search filters and results
- `src/components/onboarding/` - Onboarding flow steps
- `src/components/common/` - Shared components
- `src/components/layouts/` - Layout wrappers

## Testing Notes

- No test suite currently configured
- Manual testing required for Tauri functionality
- Test both development (`npm run tauri:dev`) and production builds (`npm run tauri:build`)

## Build Configuration

- Minimum macOS version: 10.13 (configured in `src-tauri/tauri.conf.json`)
- App identifier: `com.sinameraji.decisionjournal`
- Bundle targets: macOS focused (targets: "all" but optimized for macOS)
- Auto-updater enabled pointing to GitHub releases

## Key Dependencies

Frontend:
- React 19.2.0 (latest)
- TanStack Router 1.139+
- Radix UI (complete component library)
- Tailwind CSS 4.1+
- Zustand 5.0+
- React Hook Form 7.66+
- Zod 4.1+

Tauri:
- @tauri-apps/api 2.9+
- All Tauri plugins at v2.x

LLM:
- Local Ollama server (external dependency)

## Common Patterns

### Adding a New Page
1. Create page component in `src/pages/<name>.tsx`
2. Add route in `src/routes.tsx` with `createRoute`
3. Add to route tree with `rootRoute.addChildren([...])`

### Adding Zustand State
1. Create or update slice in `src/store/<domain>-slice.ts`
2. Add types and actions to slice
3. Export selectors/actions in `src/store/index.ts`
4. Optionally add to `partialize` in index.ts for persistence

### Database Operations
All database operations go through `sqlite-service.ts`. Pattern:
```typescript
const db = await this.initialize()
const result = await db.execute('SQL', [params])
```

### Calling Ollama
Use `ollama-service.ts` methods:
```typescript
const isRunning = await ollamaService.isRunning()
const response = await ollamaService.chat(model, messages)
```

Always check `isRunning()` first and handle offline gracefully.
