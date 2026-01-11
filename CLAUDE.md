# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
npm run dev        # Start dev server at http://localhost:5173/chat/
npm run build      # TypeScript check + production build
npm run preview    # Preview production build
```

### Code Quality
```bash
npm run check      # Run lint + typecheck (strict, no warnings allowed)
npm run check:fix  # Auto-fix lint issues + typecheck
npm run lint       # ESLint + Prettier check only
npm run lint:fix   # Auto-fix ESLint + Prettier issues
npm run typecheck  # TypeScript type checking only
```

### Testing
```bash
npm test                    # Run all unit tests (Vitest)
npm run test:watch          # Run unit tests in watch mode
npm run test:coverage       # Generate coverage report
npm run e2e                 # Run E2E tests (Playwright, headed mode)
npm run e2e:ui              # Interactive Playwright UI
npm run ci:test:e2e         # Run E2E tests (headless, CI mode)

# Run single test
npx vitest run src/path/to/file.test.tsx
npx playwright test e2e/test-name.spec.ts
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript (strict mode) + Vite 7
- **Styling**: Tailwind CSS v4 (via Vite plugin) + OKLCH colors
- **UI Components**: shadcn/ui (built on Radix UI)
- **LLM Integration**: bodhi-js-react SDK for local LLM chat
- **Testing**: Vitest (unit) + Playwright (E2E)

### Component Structure
```
App.tsx (BodhiProvider wrapper)
  └── Layout.tsx
      ├── Header.tsx (auth, settings, model selector)
      └── ChatContainer.tsx (ChatProvider wrapper)
          ├── MessageList.tsx (displays chat history)
          └── InputArea.tsx (message input + send button)
```

### State Management
- **ChatContext** (`src/context/ChatContext.tsx`): Provides chat state via React Context
- **useChat** hook (`src/hooks/useChat.ts`): Core chat logic - message history, streaming, model management
- **useBodhi** hook (from bodhi-js-react): Auth state, client instance, setup modal

### Key Patterns
- **Path alias**: `@/` maps to `./src/` (configured in tsconfig + vite.config)
- **shadcn/ui**: Components in `src/components/ui/`, add via `npx shadcn@latest add <component>`
- **Base path**: App deployed to `/chat/` (configured in vite.config + BodhiProvider)
- **Auth flow**: OAuth via BodhiProvider → Keycloak redirect → token management
- **Streaming**: Chat responses use SSE streaming via `client.chat.completions.create({ stream: true })`

## E2E Testing Setup

### Prerequisites
1. Copy environment template:
   ```bash
   cp e2e/.env.test.example e2e/.env.test.local
   ```
2. Fill in required credentials in `e2e/.env.test.local`:
   - `INTEG_TEST_CLIENT_ID` / `INTEG_TEST_CLIENT_SECRET` (resource client)
   - `INTEG_TEST_USERNAME` / `INTEG_TEST_PASSWORD` (test user for OAuth)
   - `INTEG_TEST_AUTH_URL` / `INTEG_TEST_AUTH_REALM` (auth server config)

3. Download test model (required for E2E):
   ```bash
   make download-model
   ```
   Downloads `google_gemma-3-1b-it-Q4_K_M.gguf` to `test_hf_home/`

### E2E Architecture
- **BodhiServerManager**: Spawns embedded bodhi server at port 22222 for tests
- **global-setup.ts**: Starts server before tests, stops after
- **Page Objects**: `e2e/pages/ChatPage.ts`, `e2e/pages/SetupModalHelper.ts`
- Tests use `data-testid` selectors for stability

## Testing Conventions

### E2E Tests (Playwright)
- Use `data-testid` attributes and `getByTestId()` selector
- Avoid CSS/DOM selectors that change over time
- Tests should be deterministic (no if-else, no try-catch)
- Let errors throw and fail the test naturally
- Use `console.log` for error scenarios only (not normal flow)
- Do not use inline timeouts - they hide inefficiency in test/app setup
  - Timeouts mask problems rather than fixing root cause
  - If test needs longer wait, investigate why (slow app startup, inefficient test setup)
  - Exception: inherently long operations like LLM streaming where delay is unavoidable
  - Global timeouts in `playwright.config.ts` are appropriate, inline overrides are red flags

### Unit Tests (Vitest)
- Follow `assert_eq(expected, actual)` convention (JUnit style)
- No if-else or try-catch in test logic
- Tests should be simple and deterministic
