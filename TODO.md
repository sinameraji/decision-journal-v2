# Decision Journal v2 - TODO & Progress Tracker

**Migration from Next.js to Tauri v2**
**Started:** December 1, 2024
**Estimated Timeline:** 12-13 days

---

## ✅ Phase 1: Foundation (Day 1) - COMPLETED

### Project Setup
- [x] Create Vite + React + TypeScript project
- [x] Initialize Tauri v2.9.4
- [x] Copy `src-tauri/` directory from v1 decision_journal
- [x] Install Tauri CLI and plugins

### Dependencies
- [x] Install Tauri plugins (sql, dialog, fs, notification, shell)
- [x] Install TanStack Router + devtools
- [x] Install Zustand 5.0.8
- [x] Install Tailwind CSS v4.1.17 + PostCSS
- [x] Install Radix UI components (17+ packages)
- [x] Install React Hook Form + Zod
- [x] Install utilities (lucide-react, date-fns, uuid, sonner)

### Project Structure
- [x] Create `src/components/ui/` directory
- [x] Create `src/components/new-decision/` directory
- [x] Create `src/components/layouts/` directory
- [x] Create `src/pages/` directory
- [x] Create `src/services/database/` directory
- [x] Create `src/services/llm/` directory
- [x] Create `src/store/` directory
- [x] Create `src/types/`, `src/hooks/`, `src/lib/` directories
- [x] Create `public/fonts/` subdirectories for 3 fonts

### Configuration
- [x] Set up `vite.config.ts` with @ path alias
- [x] Configure `tsconfig.app.json` with path mappings
- [x] Create basic `routes.tsx` with TanStack Router
- [x] Update `App.tsx` with RouterProvider
- [x] Create `src/styles/globals.css` with color variables
- [x] Create `tailwind.config.js`
- [x] Create `postcss.config.js` for Tailwind v4
- [x] Add Tauri scripts to `package.json`

### Verification
- [x] Test `npm run tauri:dev` opens desktop window
- [x] Verify Rust backend compiles successfully
- [x] Verify basic routing works
- [x] Verify index page displays correctly

**Commit:** `0ad74e3` - Initial commit: Phase 1 Foundation complete

---

## ✅ Phase 2: Styling & Theme (Day 1-2) - COMPLETED

### Font Setup
- [x] Created @font-face declarations for 3 fonts (14 font files total)
- [x] Libre Baskerville (serif): weights 400, 700 - woff2 + woff
- [x] IBM Plex Mono (monospace): weights 400, 500 - woff2 + woff
- [x] Lora (serif alternative): weights 400, 500, 600 - woff2 + woff
- [x] Created FONTS.md with download instructions
- [x] Updated `tailwind.config.js` with font families
- [ ] ⚠️ **TODO:** Download actual font files (see FONTS.md)

### Color System
- [x] Copied complete color system from v0 `app/globals.css`
- [x] Warm earthy palette preserved (beige #f5f1e6, brown #a67c52)
- [x] Set up dark mode color variables
- [x] All semantic colors configured (primary, secondary, muted, accent, etc.)
- [x] Sidebar-specific colors
- [x] Chart colors (5 variants)
- [x] Shadow system

### Global Styles
- [x] Finalized `globals.css` with all CSS variables
- [x] Added base styles for body, typography
- [x] Created visual test page for colors and fonts

### Verification
- [x] Color system working correctly
- [x] CSS variables resolve properly
- [x] Dark mode structure in place
- [x] Typography test page created
- [ ] ⚠️ Fonts will load once files are downloaded (see FONTS.md)

**Commit:** `65b77e7` - feat: Complete Phase 2 - Styling & Theme System

---

## 📦 Phase 3: UI Component Library (Day 2)

### Copy shadcn/ui Components from v0
- [ ] Copy all 57 components from `decision-journal-redesign/components/ui/`
  - [ ] accordion, alert-dialog, alert, aspect-ratio, avatar
  - [ ] badge, breadcrumb, button, calendar, card
  - [ ] carousel, chart, checkbox, collapsible, command
  - [ ] context-menu, dialog, drawer, dropdown-menu
  - [ ] form, hover-card, input, input-otp, label
  - [ ] menubar, navigation-menu, pagination, popover
  - [ ] progress, radio-group, resizable, scroll-area
  - [ ] select, separator, sheet, sidebar, skeleton
  - [ ] slider, sonner, switch, table, tabs
  - [ ] textarea, toast, toaster, toggle-group, toggle
  - [ ] tooltip

### Copy Additional Components from v0
- [ ] Copy `decision-card.tsx`
- [ ] Copy `empty-state.tsx`
- [ ] Copy `theme-toggle.tsx`
- [ ] Copy `voice-input-button.tsx`
- [ ] Copy `model-selector-modal.tsx`
- [ ] Copy `custom-select.tsx`

### Test Components
- [ ] Import a few components in index page
- [ ] Verify Button renders correctly
- [ ] Test Dialog open/close
- [ ] Verify no missing dependencies

**Target Commit:** Phase 3 complete - UI component library

---

## 🗄️ Phase 4: Database & Services (Day 2-3)

### Copy Type Definitions from v1
- [ ] Copy `src/types/decision.ts` from decision_journal
- [ ] Copy `src/types/chat.ts`
- [ ] Copy `src/types/preferences.ts`
- [ ] Verify all types import correctly

### Copy Utility Functions
- [ ] Copy `src/utils/platform.ts` (isDesktop, isBrowser helpers)
- [ ] Copy `src/lib/utils.ts` (cn helper, etc.)

### Copy Database Service
- [ ] Copy `src/services/database/sqlite-service.ts` (1,086 lines)
- [ ] Verify all Tauri plugin imports work
- [ ] Test database initialization

### Copy AI Service
- [ ] Copy `src/services/llm/ollama-service.ts`
- [ ] Verify Ollama connection logic
- [ ] Test service initialization

### Database Testing
- [ ] Add database init call in `App.tsx`
- [ ] Create test decision via browser console
- [ ] Verify decision persists in SQLite
- [ ] Check database file location on macOS
- [ ] Test Ollama connection (if service running)

**Target Commit:** Phase 4 complete - Database & services layer

---

## ✅ Phase 5: State Management (Day 3) - COMPLETED

### Zustand Store Setup
- [x] Create `src/store/index.ts` with store creation
- [x] Configure persist middleware
- [x] Set up store partitioning (decisions + UI slices)

### Decisions Slice
- [x] Create `src/store/decisions-slice.ts`
- [x] Implement `loadDecisions()` action
- [x] Implement `createDecision()` action
- [x] Implement `updateDecision()` action
- [x] Implement `deleteDecision()` action
- [x] Implement `loadDecision()` action for single decision
- [x] Implement `searchDecisions()` action with filters
- [x] Wire all actions to sqliteService

### UI Slice
- [x] Create `src/store/ui-slice.ts`
- [x] Add theme state (light/dark/system)
- [x] Add sidebar open state
- [x] Add search query state
- [x] Add view mode state (grid/list)
- [x] Add active filters state
- [x] Implement setTheme action with DOM updates
- [x] Implement toggleSidebar action
- [x] Add user preferences state

### Store Testing
- [x] Fixed type imports (verbatimModuleSyntax compatibility)
- [x] Fixed method names (getDecisions vs getAllDecisions)
- [x] Fixed timestamp fields (created_at/updated_at vs createdAt/updatedAt)
- [x] Build successful: 271.88KB JS, 84.51KB CSS (gzipped: 85.92KB JS, 14.51KB CSS)
- [x] All TypeScript errors resolved

**Commit:** Phase 5 complete - Zustand state management wired to SQLite

---

## 🎨 Phase 6: Layout Components (Day 3-4)

### Root Layout
- [ ] Create `src/components/layouts/RootLayout.tsx`
- [ ] Add Sidebar component slot
- [ ] Add SearchHeader component slot
- [ ] Add main content area with `<Outlet />`
- [ ] Add footer
- [ ] Add Toaster for notifications
- [ ] Add CommandPalette

### Adapt Sidebar from v0
- [ ] Copy `components/sidebar.tsx` from decision-journal-redesign
- [ ] Replace `import Link from "next/link"` with TanStack Router Link
- [ ] Replace `usePathname()` with `useLocation().pathname`
- [ ] Update navigation items with correct routes
- [ ] Wire to Zustand store for state
- [ ] Test navigation between routes

### Adapt SearchHeader from v0
- [ ] Copy `components/search-header.tsx`
- [ ] Remove Next.js imports
- [ ] Update to use TanStack Router navigation
- [ ] Wire to Zustand store
- [ ] Test search functionality

### Adapt CommandPalette from v0
- [ ] Copy `components/command-palette.tsx`
- [ ] Replace `useRouter()` with `useNavigate()`
- [ ] Update all navigation calls
- [ ] Test ⌘K shortcut
- [ ] Test command execution

### Layout Testing
- [ ] Verify sidebar renders
- [ ] Test sidebar navigation
- [ ] Verify active route highlighting
- [ ] Test command palette opens
- [ ] Test theme toggle
- [ ] Verify footer displays

**Target Commit:** Phase 6 complete - App shell & navigation

---

## 🏠 Phase 7: Home Page (Day 4)

### Index Page Component
- [ ] Create `src/pages/index.tsx`
- [ ] Import DecisionCard component
- [ ] Import EmptyState component
- [ ] Add page header with title and count
- [ ] Add "New Decision" button linked to `/new`
- [ ] Map over decisions from store
- [ ] Show EmptyState when no decisions

### Update Routes
- [ ] Add indexRoute to `routes.tsx` (already done)
- [ ] Verify route registration

### Connect to Store
- [ ] Use `useStore(state => state.decisions)`
- [ ] Use `useStore(state => state.loadDecisions)`
- [ ] Call loadDecisions on mount

### Testing
- [ ] Verify decisions list renders
- [ ] Test decision card displays correct data
- [ ] Test clicking card navigates (even if detail page empty)
- [ ] Test empty state shows with no data
- [ ] Test "New Decision" button navigation

**Target Commit:** Phase 7 complete - Home page with decisions list

---

## ✏️ Phase 8: New Decision Page (Day 5-6)

### Copy Form Components from v0
- [ ] Copy `components/new-decision/situation-tab.tsx`
- [ ] Copy `components/new-decision/alternatives-tab.tsx`
- [ ] Copy `components/new-decision/decision-tab.tsx`
- [ ] Copy `components/new-decision/mental-context-tab.tsx`
- [ ] Copy `components/new-decision/metadata-tab.tsx`
- [ ] Copy `components/new-decision/form-field.tsx`

### Create New Decision Page
- [ ] Create `src/pages/new.tsx`
- [ ] Set up multi-step form state
- [ ] Wire 5 tab components
- [ ] Add navigation between steps
- [ ] Add form validation with Zod
- [ ] Wire form submission to store.createDecision()
- [ ] Add navigation to home after submit

### Add Route
- [ ] Create newRoute in `routes.tsx`
- [ ] Test route navigation

### Testing
- [ ] Test all 5 steps render
- [ ] Test navigation between steps
- [ ] Test form validation
- [ ] Test decision submission
- [ ] Verify redirect after submit
- [ ] Verify new decision in database
- [ ] Verify new decision appears in home list

**Target Commit:** Phase 8 complete - New decision multi-step form

---

## 📄 Phase 9: Decision Detail Page (Day 6)

### Create Detail Page
- [ ] Create `src/pages/decision.$id.tsx`
- [ ] Get ID from params: `useParams({ from: '/decision/$id' })`
- [ ] Fetch decision: `useStore(state => state.getDecision(id))`
- [ ] Display all decision fields in readable layout
- [ ] Add back button
- [ ] Add edit button (future feature)

### Add Route
- [ ] Create decisionDetailRoute in `routes.tsx` with path `/decision/$id`
- [ ] Test dynamic routing

### Update Decision Card
- [ ] Make DecisionCard link to `/decision/${decision.id}`
- [ ] Test navigation from home to detail

### Testing
- [ ] Click decision card opens detail page
- [ ] All fields display correctly
- [ ] Back navigation returns to home
- [ ] 404 state for invalid ID

**Target Commit:** Phase 9 complete - Decision detail page

---

## 💬 Phase 10: Chat Page (Day 7-8)

### Copy Chat Implementation from v1
- [ ] Copy `src/pages/ChatPage.tsx` from decision_journal
- [ ] Adapt imports to v2 structure
- [ ] Update path aliases (@/ instead of ../)

### Ollama Connection Check
- [ ] Add `ollamaService.isRunning()` check
- [ ] Display error message if Ollama not running
- [ ] Add "Retry Connection" button
- [ ] Show setup instructions

### Model Selector
- [ ] Copy ModelSelectorModal from v0
- [ ] Update imports for v2
- [ ] Wire to Ollama service
- [ ] Test model switching

### Chat Features
- [ ] Test chat session creation
- [ ] Test sending messages
- [ ] Test streaming responses
- [ ] Test message persistence
- [ ] Test chat history in sidebar
- [ ] Test context linking to decisions

### Add Route
- [ ] Create chatRoute in `routes.tsx`
- [ ] Test navigation to chat

### Testing
- [ ] Verify chat sessions list
- [ ] Test creating new chat
- [ ] Test messages stream correctly
- [ ] Verify data persists on app restart
- [ ] Test model selector modal
- [ ] Test context awareness

**Target Commit:** Phase 10 complete - AI chat interface

---

## 📊 Phase 11: Analytics Page (Day 8)

### Copy Analytics Implementation from v1
- [ ] Copy `src/pages/AnalyticsPage.tsx` from decision_journal
- [ ] Adapt imports to v2

### Analytics Store Methods
- [ ] Create `getAnalytics()` selector in decisions-slice
- [ ] Implement total decisions count
- [ ] Implement average confidence calculation
- [ ] Implement emotional patterns aggregation
- [ ] Implement tag distribution calculation
- [ ] Implement decision outcomes analysis

### Analytics UI
- [ ] Display stats cards
- [ ] Display emotional patterns list
- [ ] Display tag categories
- [ ] Add charts if using recharts (optional)

### Add Route
- [ ] Create analyticsRoute in `routes.tsx`
- [ ] Test navigation

### Testing
- [ ] Stats display correctly
- [ ] Calculations are accurate
- [ ] Charts render (if implemented)
- [ ] Empty state for no data

**Target Commit:** Phase 11 complete - Analytics dashboard

---

## 📅 Phase 12: Reviews Page (Day 9)

### Copy Reviews Implementation from v1
- [ ] Copy `src/pages/ReviewsPage.tsx` from decision_journal
- [ ] Adapt imports to v2

### Review Store Methods
- [ ] Add `getDueReviews()` action to store
- [ ] Add `completeReview()` action
- [ ] Wire to sqliteService review methods

### Review Workflow
- [ ] List due reviews
- [ ] Create review detail view
- [ ] Add review form (actual outcome, rating, lessons)
- [ ] Wire form submission
- [ ] Update decision with review data
- [ ] Mark review as completed

### Add Route
- [ ] Create reviewsRoute in `routes.tsx`
- [ ] Create reviewDetailRoute if needed
- [ ] Test navigation

### Testing
- [ ] Due reviews list displays
- [ ] Can click to review a decision
- [ ] Review form works
- [ ] Updates decision correctly
- [ ] Review marked as complete

**Target Commit:** Phase 12 complete - Reviews system

---

## ⚙️ Phase 13: Settings & Search Pages (Day 9-10)

### Settings Page
- [ ] Create `src/pages/settings.tsx`
- [ ] Add Ollama model selection
- [ ] Add theme preference selector
- [ ] Add notification settings toggle
- [ ] Wire to preferences store/database
- [ ] Test settings persistence

### Search Page
- [ ] Create `src/pages/search.tsx`
- [ ] Copy SearchResultsPage from v1 if exists
- [ ] Implement `searchDecisions()` in store
- [ ] Wire to sqliteService.getDecisions({ search: query })
- [ ] Add tag filters
- [ ] Add date range filters
- [ ] Display search results
- [ ] Show empty state for no results

### Add Routes
- [ ] Create settingsRoute in `routes.tsx`
- [ ] Create searchRoute in `routes.tsx`
- [ ] Test navigation

### Wire SearchHeader
- [ ] Connect search input to navigation
- [ ] Pass query to search page

### Testing
- [ ] Settings save and load correctly
- [ ] Search input works
- [ ] Results page shows matches
- [ ] Filters work correctly
- [ ] Empty state displays

**Target Commit:** Phase 13 complete - Settings & search

---

## ✨ Phase 14: Polish & Performance (Day 11-12)

### Route Preloading
- [ ] Add `preload="intent"` to all navigation Links
- [ ] Test hover preloading
- [ ] Verify instant navigation

### Loading States
- [ ] Add skeleton screens for async data
- [ ] Add spinners for form submissions
- [ ] Add loading states to all async operations
- [ ] Test loading UX

### Error Handling
- [ ] Add error boundaries for each route
- [ ] Add error states for failed operations
- [ ] Add retry mechanisms
- [ ] Test error scenarios

### Keyboard Shortcuts
- [ ] Copy `useKeyboardShortcuts.ts` from v1 if exists
- [ ] Wire shortcuts to pages
- [ ] Test all shortcuts work

### Dark Mode Testing
- [ ] Test all pages in dark mode
- [ ] Verify colors work correctly
- [ ] Fix any contrast issues

### Code Cleanup
- [ ] Remove all console.logs
- [ ] Remove unused imports
- [ ] Remove commented-out code
- [ ] Fix ESLint warnings

### Performance Testing
- [ ] Run `npm run build`
- [ ] Check bundle size (target < 500KB gzipped)
- [ ] Check per-route chunks (target < 100KB each)
- [ ] Verify route transitions < 20ms

**Target Commit:** Phase 14 complete - Polish & performance optimization

---

## 🚀 Phase 15: Build & Distribution (Day 12-13)

### App Metadata
- [ ] Update app name in `tauri.conf.json`
- [ ] Update version number
- [ ] Update bundle identifier
- [ ] Add app description

### App Icons
- [ ] Generate icons: `npm run tauri icon path/to/icon.png`
- [ ] Verify icons generated in `src-tauri/icons/`

### Production Build
- [ ] Run `npm run tauri:build`
- [ ] Verify build completes without errors
- [ ] Check build output location

### Installation Testing (macOS)
- [ ] Open DMG from `src-tauri/target/release/bundle/dmg/`
- [ ] Install app
- [ ] Launch app
- [ ] Test all features in installed app
- [ ] Verify database persists correctly
- [ ] Verify fonts load correctly
- [ ] Test Ollama connection

### Cross-Platform Builds (Optional)
- [ ] Build for Windows (if needed)
- [ ] Build for Linux (if needed)

**Target Commit:** Phase 15 complete - Production build & distribution

---

## 🎯 Future Enhancements (Post-MVP)

### Features to Consider Later
- [ ] Auto-updater integration
- [ ] Export/import decisions as JSON
- [ ] PDF export for decisions
- [ ] Decision templates
- [ ] Advanced analytics with charts
- [ ] Custom review schedules
- [ ] Tags management UI
- [ ] Search filters UI
- [ ] Backup/restore functionality
- [ ] Multi-window support
- [ ] System tray integration
- [ ] Notification system for reviews
- [ ] Encryption for sensitive decisions
- [ ] Cloud sync (optional, privacy-focused)

### Technical Improvements
- [ ] Add unit tests (Vitest)
- [ ] Add component tests (Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Set up CI/CD pipeline
- [ ] Add database migrations system
- [ ] Optimize bundle size further
- [ ] Add error reporting (Sentry, etc.)
- [ ] Add analytics (local only)

---

## 📋 Current Status

**Phase Completed:** 5/15
**Progress:** 33.3%
**Current Phase:** Phase 6 - Layout Components
**Next Milestone:** Create RootLayout with Sidebar and SearchHeader

**Latest Commit:** `65b77e7` - feat: Complete Phase 2 - Styling & Theme System
**Last Updated:** December 1, 2024

---

## 📝 Notes

### Key Decisions Made
- **Routing:** TanStack Router (16ms transitions, type-safe)
- **State:** Zustand (proven from v1, simple API)
- **Styling:** Tailwind v4 + warm earthy palette from v0
- **Fonts:** Local bundling (offline support)
- **Database:** Desktop-only SQLite (no browser fallback)
- **AI:** Ollama with local gemma3:1b model

### Important Files to Reference
- **Migration Plan:** `/Users/sinameraji/.claude/plans/snuggly-kindling-dolphin.md`
- **v0 Source:** `/Users/sinameraji/Craft/decision-journal-redesign/`
- **v1 Source:** `/Users/sinameraji/Craft/decision_journal/`

### Common Commands
```bash
# Development
npm run dev              # Vite only (browser mode)
npm run tauri:dev        # Full Tauri desktop mode

# Build
npm run build            # Build frontend
npm run tauri:build      # Build desktop app

# Git
git status
git add .
git commit -m "message"
git log --oneline

# Tauri
npm run tauri icon path/to/icon.png  # Generate app icons
```

---

**Remember:** Keep this file updated as you complete tasks! 🚀
