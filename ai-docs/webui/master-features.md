# llama.cpp WebUI - Master Features List

> Reverse-engineered from llama.cpp webui for implementation in bodhiapps/chat

## Implementation Progress

| Feature | Status | Implementation Notes |
|---------|--------|---------------------|
| **Model Selection** | 🔄 Basic | List + select + refresh working; missing: auto-load, capabilities, model info dialog |
| **Chat Interface** | 🔄 Partial | Streaming + markdown + thinking blocks + auto-scroll + gen params working; missing: token stats, message actions (copy/edit/delete) |
| **Markdown Rendering** | ✅ Implemented | GFM + syntax highlighting + KaTeX + code enhancements (2026-01-13) |
| **File Attachments** | ❌ Not Started | No file upload/attachment capabilities |
| **Tool Calls** | ❌ Schema Only | `MessageExtra.tool_calls` field exists; no display UI |
| **Keyboard Shortcuts** | 🔄 Basic | Enter to send, Shift+Enter for newline; missing: Ctrl+K, Shift+Ctrl+O |
| **Settings** | ✅ Implemented | 4-tab dialog (General, Sampling, Penalties, Display) with localStorage persistence via SettingsContext |
| **Persistence** | ✅ Full | Dexie + user-scoped + CRUD + pin + search + quota handling all working |

**Legend**: ✅ Fully Implemented | 🔄 Partially Implemented | ❌ Not Implemented

---

## Document Index

- [Libraries & Dependencies](./libraries.md)
- [API Reference](./api-reference.md)
- [01. Model Selection](./01-model-selection.md)
- [02. Chat Interface](./02-chat.md)
- [03. File Attachments](./03-attachments.md)
- [04. Tool Calls](./04-tools.md)
- [05. Keyboard Shortcuts](./05-shortcuts.md)
- [06. Settings](./06-settings.md)
- [07. Persistence](./07-persistence.md)

---

## Core Features (Priority Order)

### 1. Model Selection
**Status**: Core
**Doc**: [01-model-selection.md](./01-model-selection.md)

- List available models
- Select model for conversation
- View model details (context size, modalities, metadata)
- Capability detection (vision, audio)
- Auto-loading models on request

### 2. Chat Interface
**Status**: 🔄 Partially Implemented
**Doc**: [02-chat.md](./02-chat.md)

**Implemented**:
- ✅ Streaming text responses via SSE (see [API Reference](./api-reference.md))
- ✅ Abort generation (save partial response)
- ✅ Auto-scroll with user-scroll detection (50px threshold)
- ✅ Settings to disable auto-scroll entirely
- ✅ Regenerate and retry message functionality
- ✅ Theme support (light/dark/system via ThemeProvider)
- ✅ Generation parameters from settings applied to API (temperature, top_p, top_k, min_p, max_tokens, penalties)
- ✅ System message injection from settings
- ✅ Full GitHub Flavored Markdown with syntax highlighting (2026-01-13)
- ✅ LaTeX/math rendering via KaTeX (2026-01-13)
- ✅ Reasoning/thinking blocks (collapsible, `showThoughtInProgress` setting) (2026-01-13)
- ✅ Auto-grow textarea with Shift+Enter for newlines (2026-01-13)
- ✅ Code block enhancements (language badge, copy button, HTML preview) (2026-01-13)

**Not Implemented**:
- ❌ Message actions (copy message, edit, delete, continue generation)
- ❌ Token statistics display (tokens/sec, processing time)
- ⏸️ Incremental rendering with stable block caching (deferred)

### 3. File Attachments
**Status**: Core
**Doc**: [03-attachments.md](./03-attachments.md)

- Image attachments (5 formats: JPEG, PNG, GIF, WebP, SVG → auto-convert to PNG)
- PDF attachments (text extraction OR image conversion for vision models)
- Audio attachments (MP3, WAV, WebM)
- Audio recording (microphone button with MediaRecorder)
- Text file attachments (25+ formats with syntax detection)
- Drag-and-drop, paste, and button upload
- Capability validation (see [Model Selection](./01-model-selection.md))
- File preview with full-size dialog

### 4. Tool Calls
**Status**: Core
**Doc**: [04-tools.md](./04-tools.md)

- Display tool_calls in assistant messages
- Format tool call JSON
- Show tool results

### 5. Keyboard Shortcuts
**Status**: Core
**Doc**: [05-shortcuts.md](./05-shortcuts.md)

- Conversation search (Ctrl/Cmd+K)
- New chat (Shift+Ctrl/Cmd+O)
- Focus input
- Navigation shortcuts

### 6. Settings
**Status**: ✅ Implemented (2026-01-12)
**Doc**: [06-settings.md](./06-settings.md)

**Architecture**:
- **Storage**: Per-user IndexedDB persistence (Dexie userSettings table)
- **Context**: SettingsProvider with userId-scoped isolation
- **Theme**: ThemeProvider with system preference detection
- **Integration**: Generation params applied to chat.completions.create API
- **UI**: 4-tab dialog (General, Sampling, Penalties, Display)

**Implemented Features**:
- ✅ Generation parameters (10 params): temperature, top_p, top_k, min_p, typ_p, max_tokens, repeat_last_n, repeat_penalty, presence_penalty, frequency_penalty
- ✅ Theme selection (light/dark/system) with real-time switching
- ✅ System message injection into all conversations
- ✅ Display options: disableAutoScroll, alwaysShowSidebarOnDesktop, autoShowSidebarOnNewChat, showThoughtInProgress, renderUserContentAsMarkdown
- ✅ Auto-save on every setting change
- ✅ Numeric validation with VALIDATION_RANGES (min/max/step)
- ✅ Deep merge for partial updates
- ✅ E2E test coverage (SettingsSection page object + settings.spec.ts)

**Implementation Files**:
- `src/components/settings/SettingsDialog.tsx` (4-tab dialog)
- `src/components/settings/GeneralTab.tsx` (theme + systemMessage)
- `src/components/settings/SamplingTab.tsx` (6 generation params with sliders)
- `src/components/settings/PenaltiesTab.tsx` (4 penalty params with sliders)
- `src/components/settings/DisplayTab.tsx` (5 boolean switches)
- `src/components/theme-provider.tsx` (theme system with localStorage sync)
- `src/context/SettingsContext.tsx` (provider with theme integration)
- `src/hooks/useSettings.ts` (persistence + validation logic)
- `src/lib/settings-defaults.ts` (DEFAULT_SETTINGS + VALIDATION_RANGES)
- `src/db/schema.ts` (userSettings table: userId, settings JSON, lastModified)
- `e2e/pages/SettingsSection.ts` (page object for E2E)
- `e2e/settings.spec.ts` (5 E2E scenarios)

**Display Settings** (updated 2026-01-13):
- ✅ `showThoughtInProgress` - Control thinking block auto-expand
- ✅ `renderUserContentAsMarkdown` - Render user messages as markdown

**Deferred Features**:
- ⏸️ Server defaults synchronization (requires backend /props endpoint enhancement)
- ⏸️ Import/export settings as JSON
- ⏸️ Reset buttons (resetAllToDefaults() exists but no UI)
- ⏸️ "Custom" badges for overridden params
- ⏸️ API key configuration
- ⏸️ Advanced samplers (dynatemp, XTC, DRY)
- ⏸️ Custom parameters JSON field
- ⏸️ Additional display options (showMessageStats, keepStatsVisible)

### 7. Persistence
**Status**: Core
**Doc**: [07-persistence.md](./07-persistence.md)

- IndexedDB storage (Dexie ORM, database: `LlamacppWebui`)
- Conversation CRUD operations with transaction safety
- Message tree structure (parent-child relationships for branching)
- Import/export conversations as JSON (single or bulk)
- Message history with full conversation state
- Cascading delete (conversation → messages)
- Search conversations (title + full-text)

---

## Additional Core Features

### Conversation Management
**Related docs**: [Persistence](./07-persistence.md), [Shortcuts](./05-shortcuts.md)

- Auto-generate conversation titles from first message
- Conversation list in sidebar (sorted by lastModified)
- Search conversations (full-text message content + title with toggle)
- Rename conversations (Ctrl/Cmd+Shift+E)
- Delete conversations with confirmation
- Conversation deep linking

### Code & Markdown
**Status**: ✅ Implemented (2026-01-13)
**Related docs**: [Chat](./02-chat.md), [Libraries](./libraries.md)

- ✅ Full GitHub Flavored Markdown support (remark-gfm: tables, strikethrough, task lists)
- ✅ Syntax highlighting (highlight.js with 25+ languages)
- ✅ LaTeX/math rendering (KaTeX with display/inline modes)
- ✅ HTML preview for code blocks (sandboxed iframe dialog)
- ✅ Copy code button per block
- ✅ Language badge on code blocks
- ⏸️ Incremental rendering with stable block caching (deferred)

**Implementation Files**:
- `src/components/markdown/MarkdownContent.tsx`
- `src/components/markdown/ThinkingBlock.tsx`
- `src/components/markdown/CodePreviewDialog.tsx`
- `src/lib/markdown/processor.ts`
- `src/lib/markdown/enhance-code-blocks.ts`
- `src/lib/markdown/latex-protection.ts`

**E2E Tests**: `e2e/markdown-rendering.spec.ts`

### URL Deep Linking
- Pre-fill prompt via ?q= parameter
- Pre-select model via ?model= parameter

### Error Handling
- Toast notifications for errors
- Detailed error states
- Retry mechanisms

### Accessibility
- Keyboard navigation
- Focus management
- Basic screen reader support

### Responsive Design
- Mobile-friendly interface
- Desktop optimization
- Adaptive layouts

### Theme System
**Status**: ✅ Implemented (2026-01-12)
**Related**: [Settings](./06-settings.md), [Chat](./02-chat.md)

- Theme provider with light/dark/system modes
- System preference detection via `prefers-color-scheme` media query
- localStorage persistence (key: `ui-theme`)
- Real-time theme switching without reload
- Theme variables applied throughout UI (bg-muted, text-foreground, text-muted-foreground, border-border, bg-primary, etc.)
- Components updated: Header, MessageList, MessageBubble, ConversationItem, ConversationSidebar, SearchModal, InputArea

---

## Deferred Features

### Voice Input
**Status**: Deferred
**Spec**: [03-attachments.md](./03-attachments.md) (Audio Recording section)

Audio recording for speech-to-text via audio-capable models. Infrastructure exists (MediaRecorder API, WAV conversion), but UI integration is experimental.

### Continue Generation
**Status**: Future/Experimental
**Spec**: [02-chat.md](./02-chat.md#continue-generation)

Extend assistant responses with continue button. Requires `enableContinueGeneration` setting. Adds special continuation message to context.

### Message Branching
**Status**: Deferred
**Spec**: [07-persistence.md](./07-persistence.md#tree-structure)

Conversation tree with branch navigation (edit/regenerate creates branches). Database schema supports full tree structure (parent-child relationships, currNode tracking), but UI for branch navigation not implemented.

---

## Implementation Notes

### Technology Stack
- **Frontend**: React (replacing Svelte)
- **State Management**: React hooks (replacing Svelte stores)
- **UI Components**: shadcn/ui (already in use)
- **Styling**: Tailwind CSS v4
- **API Client**: bodhi-js
- **Persistence**: Dexie (IndexedDB)

### Key Libraries
See [libraries.md](./libraries.md) for complete mapping of Svelte → React equivalents

### API Compatibility
See [api-reference.md](./api-reference.md) for bodhi-js API schemas (OpenAI-compatible)

---

## Documentation Completeness

All 10 documentation files have been created with comprehensive functional requirements:

| Document | Status | Key Features Documented |
|----------|--------|-------------------------|
| master-features.md | ✅ Complete | Master inventory with cross-references |
| libraries.md | ✅ Complete | Svelte → React mapping with usage references |
| api-reference.md | ✅ Complete | Full OpenAI-compatible API schemas |
| 01-model-selection.md | ✅ Complete | Model listing, auto-loading, capabilities |
| 02-chat.md | ✅ Complete | Streaming SSE, markdown, reasoning, actions |
| 03-attachments.md | ✅ Complete | All file types, uploads, capability validation |
| 04-tools.md | ✅ Complete | Tool call display and formatting |
| 05-shortcuts.md | ✅ Complete | Keyboard navigation shortcuts |
| 06-settings.md | ✅ Complete | 44+ parameters, themes, persistence |
| 07-persistence.md | ✅ Complete | IndexedDB schema, CRUD, import/export |

**Total**: 10 comprehensive functional specification documents ready for React + bodhi-js implementation.

---

## Revision Notes

**Latest Update**: Documentation revised for AI-optimization (January 2026)
- Reduced code-to-prose ratio from ~31% to 10-20%
- Added User Stories and GIVEN/WHEN/THEN acceptance criteria to all feature docs
- Introduced `$webui-folder` convention for source references
- Replaced implementation code with functional descriptions and pseudocode
- Flagged Svelte patterns with React adaptation notes
- Created `_template.md` and `_guidelines.md` for doc standards

**Documentation Status**: All 10 docs optimized for AI/LLM consumption with clear functional requirements.

---

## Recent Updates

### 2026-01-13: Markdown Rendering Implementation

Completed full markdown rendering feature. See [Code & Markdown](#code--markdown) section for implementation details.

Key additions:
- GFM markdown, syntax highlighting, KaTeX math rendering
- Thinking/reasoning blocks with `showThoughtInProgress` setting
- Auto-grow textarea with Shift+Enter for newlines
- Code block enhancements (language badge, copy button, HTML preview)
- E2E tests: `e2e/markdown-rendering.spec.ts`

---

_Documentation completed: All phases finished with cross-references and complete feature inventory._
