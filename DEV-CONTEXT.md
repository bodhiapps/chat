# Chat App Development Context

## Project Overview
React 19 chat application with local LLM integration via bodhi-js-react SDK. Features conversation persistence using IndexedDB, collapsible sidebar, and full E2E test coverage.

**Live App**: `npm run dev` → http://localhost:5173/chat/

## Tech Stack
- **Frontend**: React 19 + TypeScript (strict) + Vite 7
- **Styling**: Tailwind CSS v4 + OKLCH colors
- **UI**: shadcn/ui (Radix UI primitives)
- **LLM**: bodhi-js-react SDK for local model chat
- **Persistence**: Dexie (IndexedDB wrapper)
- **Testing**: Vitest (unit) + Playwright (E2E)

## Architecture

### Component Hierarchy
```
App.tsx (BodhiProvider wrapper)
  └── Layout.tsx (ChatProvider wrapper)
      ├── Header.tsx (auth, settings, model selector)
      └── ChatContainer.tsx
          ├── ConversationSidebar.tsx (conversation list, new/delete)
          ├── MessageList.tsx (chat history display)
          └── InputArea.tsx (message input + send)
```

### State Management
- **ChatContext** (`src/context/ChatContext.tsx`): Core chat state, message persistence, conversation management
- **useChat** (`src/hooks/useChat.ts`): Chat logic - messages, streaming, model selection
- **usePersistence** (`src/hooks/usePersistence.ts`): IndexedDB operations via Dexie
- **useBodhi** (from bodhi-js-react): Auth state, client instance

### Key Patterns
- **Single ChatProvider**: Context wraps Layout, not ChatContainer (prevents duplicate contexts)
- **State-based E2E**: Use `data-teststate`, `data-test-*` attributes instead of DOM polling
- **Streaming tracking**: Save assistant messages after streaming completes via `prevStreamingState`
- **Auto-load**: Latest conversation loads on mount
- **Path alias**: `@/` → `./src/`

## Recent Accomplishments

### Iteration 1: Core Features
- ✅ Basic chat with streaming responses
- ✅ Model selection from local models
- ✅ OAuth authentication via Keycloak
- ✅ Collapsible sidebar

### Iteration 2: Persistence (COMPLETED)
- ✅ IndexedDB schema with conversations + messages tables
- ✅ Save messages on send (user) and after streaming (assistant)
- ✅ Auto-load latest conversation on mount
- ✅ Create new conversation on first message
- ✅ Switch between conversations
- ✅ Delete conversations
- ✅ Persist across page refresh
- ✅ E2E tests covering all persistence flows

### Critical Bug Fixes
1. **Duplicate ChatProvider**: Removed from ChatContainer, now only in Layout
2. **React state mutation**: Fixed `loadConversation` to use `setMessages` instead of `push`
3. **Streaming state tracking**: Added `prevStreamingState` to save assistant messages after streaming completes
4. **Auto-load infinite loop**: Fixed useEffect dependencies

## Development Methodology

### Planning Approach
1. Use `EnterPlanMode` for non-trivial features
2. Break work into phases with clear deliverables
3. Get user approval before implementation
4. Use kebab-case identifiers for phases (Phase setup-db vs Phase 1)

### Implementation Guidelines
- **Read before edit**: Always read files before modifying
- **No over-engineering**: Only implement requested features
- **Prefer editing**: Edit existing files rather than creating new ones
- **No unnecessary comments**: Code should be self-documenting
- **No backwards-compatibility hacks**: Delete unused code completely

### Testing Conventions

#### E2E Tests (Playwright)
- **State-based waits**: Use `data-teststate`, `data-test-message-count`, `data-test-conversation-count`
- **No timeout overrides**: Let global config handle timeouts (exception: LLM streaming at 120s)
- **No inline waits**: Use `data-test-*` attributes instead of `waitForTimeout`
- **Deterministic**: No if-else, no try-catch
- **data-testid selectors**: Stable, won't change with styling
- **Page objects**: `e2e/pages/ChatPage.ts`, `e2e/pages/SetupModalHelper.ts`

Example E2E pattern:
```typescript
// BAD - DOM polling
const messages = await page.locator('[data-testid="message-user"]').all();
expect(messages.length).toBe(2);

// GOOD - State-based
await page.locator('[data-testid="chat-area"][data-test-message-count="2"]').waitFor();
```

#### Unit Tests (Vitest)
- Convention: `assert_eq(expected, actual)` (JUnit style)
- No if-else or try-catch in tests
- Use `console.log` for error scenarios only

### Key Files Reference

**Core Logic**:
- `src/context/ChatContext.tsx` - Central state, persistence orchestration
- `src/hooks/useChat.ts` - Chat operations, streaming, model management
- `src/hooks/usePersistence.ts` - IndexedDB wrapper via Dexie
- `src/db/schema.ts` - Dexie database schema

**Components**:
- `src/components/chat/MessageList.tsx` - Displays messages, auto-scrolls, tracks `data-test-message-count`
- `src/components/chat/MessageBubble.tsx` - Individual message, has `data-test-index`
- `src/components/chat/ConversationSidebar.tsx` - Conversation list, tracks `data-test-conversation-count`
- `src/components/chat/InputArea.tsx` - Message input, model selector

**Tests**:
- `e2e/chat-flow.spec.ts` - Full flow: setup → auth → chat → persistence
- `e2e/pages/ChatPage.ts` - Page object with state-based wait helpers

## Data Attributes for E2E

### Component States (`data-teststate`)
```typescript
// Chat area states
"idle"                 // Ready for interaction
"streaming"            // LLM generating response
"error"                // Error occurred

// Conversation sidebar states
"loading"              // Loading conversation list
"ready"                // List loaded

// Input area states
"ready"                // Can send message
"disabled"             // Cannot send (no model, streaming, etc)
```

### Test Data Attributes
```typescript
data-test-message-count={messages.length}           // MessageList
data-test-conversation-count={conversations.length} // ConversationSidebar
data-test-chat-id={conversationId}                  // ConversationItem, MessageList
data-test-index={index}                             // MessageBubble
```

## Debugging with Claude in Chrome MCP

### Setup
1. Ensure Claude in Chrome MCP is available
2. Start dev server: `npm run dev`
3. Navigate to http://localhost:5173/chat/

### Debugging Workflow

#### 1. Explore UI State
```typescript
// Use Task tool with Claude in Chrome to:
- Take screenshots of current state
- Read page accessibility tree
- Check data-teststate attributes
- Verify data-test-* counts match expected values
```

#### 2. Verify Persistence
```typescript
// Check IndexedDB directly in browser
javascript_tool: {
  action: "javascript_exec",
  text: `
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('ChatDB', 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const tx = db.transaction(['conversations'], 'readonly');
    const store = tx.objectStore('conversations');
    const conversations = await new Promise(resolve => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
    });

    conversations
  `
}
```

#### 3. Check Message Flow
```typescript
// Verify message count increases
read_page: Check current data-test-message-count
// Send message via UI
computer: type message, click send
// Wait for streaming to complete
read_page: Verify data-teststate="idle" and message count increased
```

#### 4. Debug State Issues
```typescript
// Check if ChatContext state is correct
javascript_tool: {
  text: `
    // Access React DevTools
    const root = document.querySelector('#root');
    const fiber = root._reactRootContainer._internalRoot.current;
    // Navigate to ChatProvider
    // Check messages, currentConversationId, isStreaming
  `
}
```

### Common Debugging Scenarios

**Messages not persisting**:
1. Check `data-test-message-count` updates after send
2. Verify `data-teststate` goes "idle" → "streaming" → "idle"
3. Check IndexedDB messages table has entries
4. Verify `currentConversationId` is set

**Sidebar not updating**:
1. Check `data-test-conversation-count` attribute
2. Verify `data-teststate="ready"` (not stuck on "loading")
3. Check conversation items have `data-test-chat-id`

**Context not shared**:
1. Verify single `ChatProvider` in Layout.tsx (not in ChatContainer)
2. Check components use `useChatContext()` correctly

## Commands Quick Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run check            # Lint + typecheck (strict, no warnings)
npm run check:fix        # Auto-fix + typecheck
npm run lint             # ESLint + Prettier check
npm run lint:fix         # Auto-fix formatting

# Testing
npm test                 # Unit tests
npm run test:watch       # Unit tests watch mode
npm run e2e              # E2E tests (headed)
npm run e2e:ui           # Playwright UI mode
npm run ci:test:e2e      # E2E headless (CI)

# Single test
npx vitest run src/path/to/file.test.tsx
npx playwright test e2e/chat-flow.spec.ts
```

## Next Development Areas (Suggestions)

### Priority 1: Polish
- [ ] Conversation title editing
- [ ] Search/filter conversations
- [ ] Message timestamps
- [ ] Error handling improvements
- [ ] Loading states polish

### Priority 2: Features
- [ ] Export conversation (markdown, JSON)
- [ ] System prompts / conversation templates
- [ ] Message regeneration
- [ ] Copy message to clipboard
- [ ] Conversation folders/tags

### Priority 3: Advanced
- [ ] Multi-model conversation (switch mid-chat)
- [ ] Conversation branching
- [ ] Message editing with regeneration
- [ ] Conversation sharing/import
- [ ] RAG / document upload

## Important Reminders

1. **Never use waitForTimeout**: Use `data-teststate` or `data-test-*` instead
2. **Single ChatProvider**: Only in Layout, not ChatContainer
3. **Save after streaming**: Track `prevStreamingState` to save when streaming completes
4. **Use setMessages**: Never mutate `chat.messages` directly
5. **State immutability**: Always use setter functions for React state
6. **Read before edit**: Always read files before modifying
7. **No estimates**: Don't provide time estimates unless asked
8. **Concise reports**: Sacrifice grammar for conciseness in final reports

## Project Files Structure

```
/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx       # Main chat wrapper
│   │   │   ├── MessageList.tsx         # Message display + scroll
│   │   │   ├── MessageBubble.tsx       # Individual message
│   │   │   ├── ConversationSidebar.tsx # Conversation list
│   │   │   ├── ConversationItem.tsx    # Single conversation
│   │   │   └── InputArea.tsx           # Input + send
│   │   ├── ui/                         # shadcn components
│   │   ├── Layout.tsx                  # App layout + ChatProvider
│   │   └── Header.tsx                  # Auth + settings
│   ├── context/
│   │   └── ChatContext.tsx             # Core state management
│   ├── hooks/
│   │   ├── useChat.ts                  # Chat operations
│   │   ├── usePersistence.ts           # IndexedDB wrapper
│   │   └── useSidebar.ts               # Sidebar collapse state
│   ├── db/
│   │   └── schema.ts                   # Dexie schema
│   └── App.tsx                         # Root component
├── e2e/
│   ├── pages/
│   │   ├── ChatPage.ts                 # Page object
│   │   └── SetupModalHelper.ts         # Setup modal helper
│   └── chat-flow.spec.ts               # Main E2E test
└── CLAUDE.md                           # Project-specific instructions
```

## Usage Examples for Next Session

### Starting Development
```
I want to continue development on the chat app. I've read DEV-CONTEXT.md.

Next feature to implement: [describe feature]

Please use EnterPlanMode to explore the codebase and create an implementation plan.
```

### Debugging Issue
```
The chat app has an issue: [describe issue]

Steps to reproduce:
1. [step 1]
2. [step 2]

Expected: [expected behavior]
Actual: [actual behavior]

Please use Claude in Chrome to debug this interactively.
```

### Adding Tests
```
I need E2E tests for: [feature]

Requirements:
- Use state-based waits with data-test-* attributes
- No timeout overrides except for LLM streaming
- Follow existing ChatPage patterns

Please implement following the testing conventions in DEV-CONTEXT.md.
```
