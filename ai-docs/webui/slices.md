# Feature Implementation Slices

> **Implementation Strategy**: End-to-end feature slices crossing multiple components
> **Target**: ~1 day per slice | Foundation-first priority | E2E tests included

---

## Overview

This document outlines 5 implementation slices to achieve feature parity with llama.cpp webui. Each slice represents a complete vertical feature crossing backend, frontend, and tests.

**Reference Implementation Base Path**:
`/Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

---

## Slice settings-dialog: Settings Infrastructure

### Feature Description

Settings dialog provides configuration for ~20 generation parameters, UI behavior, theme, with localStorage persistence and server default synchronization.

### Key Requirements

**Settings UI**:
- Dialog component with 4 tabs (General, Sampling, Penalties, Display)
- Form fields: text inputs, number inputs, checkboxes, select dropdown
- Auto-save to localStorage on change
- "Custom" badge on user-overridden params vs server defaults
- Inline reset button per parameter

**Parameters (~20 moderate depth)**:
- **General Tab** (3): `theme` (system/light/dark), `systemMessage` (string), `apiKey` (string)
- **Sampling Tab** (6): `temperature` (0.8), `top_p` (0.95), `top_k` (40), `min_p` (0.05), `typ_p` (1.0), `max_tokens` (-1)
- **Penalties Tab** (4): `repeat_last_n` (64), `repeat_penalty` (1.0), `presence_penalty` (0.0), `frequency_penalty` (0.0)
- **Display Tab** (7): `showMessageStats`, `showThoughtInProgress`, `disableAutoScroll`, `renderUserContentAsMarkdown`, `alwaysShowSidebarOnDesktop`, `autoShowSidebarOnNewChat`, `pasteLongTextToFileLen` (2500)

**Storage**:
- localStorage key: `BodhiChat.settings` (config JSON)
- localStorage key: `BodhiChat.userOverrides` (array of keys user customized)
- Settings Context for React state management

**Server Synchronization**:
- Backend: Extend `/props` endpoint to include `default_generation_settings.params`
- Frontend: Fetch defaults on app init, merge with user overrides
- Compare values with server defaults (6-decimal precision for floats)
- Preserve user overrides across server sync

**Theme System**:
- Use next-themes for light/dark/system mode
- Theme toggle in General tab
- Apply theme immediately on change

**Validation**:
- Numeric range validation (e.g., temperature 0.0-2.0)
- Show error message below invalid fields
- Disable save on validation errors

### Dependencies

- Uses existing ChatContext pattern for state
- Settings applied to `useChat` hook in API request body
- Display settings affect MessageList, MessageBubble components
- Backend work to expose props endpoint data

### Reference Files

| Aspect | File Path |
|--------|-----------|
| Settings config | `src/lib/constants/settings-config.ts` (lines 1-47: defaults, 49-117: tooltips) |
| Settings store | `src/lib/stores/settings.svelte.ts` (localStorage sync, server sync) |
| Dialog UI | `src/lib/components/app/dialogs/SettingsDialog.svelte` |
| Parameter sync | `src/lib/services/parameter-sync.ts` |

### E2E Test Requirements

- Open settings → Change temperature → Close → Reopen → Verify persisted
- Reset parameter → Verify default restored, badge removed
- Toggle theme → Verify UI updates immediately
- Server default sync → Override preserved on reload
- Validation error → Enter invalid number → Verify error shown

---

## Slice markdown-rendering: Markdown & Code Rendering

### Feature Description

Render assistant message content with full markdown support (GFM, math, code highlighting), streaming-optimized with incremental rendering and block caching.

### Key Requirements

**Markdown Features**:
- GitHub Flavored Markdown (tables, strikethrough, autolinks)
- Syntax highlighting for code blocks (highlight.js or shiki)
- KaTeX for LaTeX math equations (inline `$...$` and block `$$...$$`)
- Copy button on code blocks
- HTML preview button for HTML code blocks (optional)

**Streaming Optimization**:
- Incremental rendering during streaming
- Block-level caching (parse full blocks, not char-by-char)
- Buffer incomplete blocks until delimiter reached
- Re-render only changed blocks

**Reasoning/Thinking Blocks**:
- Display `MessageExtra.reasoning_content` in collapsible block
- Expand/collapse toggle with icon
- Auto-expand if `showThoughtInProgress` setting enabled
- Render reasoning content as markdown

**Code Block Enhancement**:
- Language label in header
- Copy button with toast confirmation
- Line numbers (optional via setting)
- Syntax highlighting for 50+ languages

**Processing Pipeline**:
```
Raw markdown → remark (parse) → remark-gfm (GFM) → remark-math (math)
→ remark-rehype (AST to HTML) → rehype-katex (math render)
→ rehype-highlight (code syntax) → rehype-stringify (HTML string)
```

**User Message Markdown**:
- Conditional rendering based on `renderUserContentAsMarkdown` setting
- Apply same markdown processing to user messages if enabled

### Dependencies

- Depends on Slice settings-dialog for `showThoughtInProgress`, `renderUserContentAsMarkdown` settings
- Uses existing `MessageExtra.reasoning_content` schema field
- Replaces current plain text content display in MessageBubble

### Reference Files

| Aspect | File Path |
|--------|-----------|
| Code block enhancement | `src/lib/markdown/enhance-code-blocks.ts` (copy button, preview, language label) |
| Literal HTML handler | `src/lib/markdown/literal-html.ts` (preserve raw HTML in markdown) |
| Table restorer | `src/lib/markdown/table-html-restorer.ts` (fix GFM table rendering) |
| Link enhancement | `src/lib/markdown/enhance-links.ts` (external link icons, target blank) |
| Markdown component | `src/lib/components/app/misc/MarkdownContent.svelte` |

### NPM Dependencies

Install:
```bash
npm install remark remark-gfm remark-breaks remark-math remark-rehype rehype-katex rehype-highlight rehype-stringify unified unist-util-visit highlight.js katex
```

### E2E Test Requirements

- Send message with GFM table → Verify table renders correctly
- Send message with code block → Verify syntax highlighting applied
- Click copy button → Verify clipboard contains code
- Send message with math → Verify LaTeX rendered
- Stream message with incomplete block → Verify buffering until complete
- Reasoning content present → Verify collapsible block shown

---

## Slice message-actions: Message Actions

### Feature Description

User actions on messages: copy content, edit in-place (no branching), delete with confirmation.

### Key Requirements

**Copy Message**:
- Copy button appears on hover over message bubble
- Copies message content to clipboard
- Toast confirmation: "Message copied"
- Works for both user and assistant messages

**Edit Message**:
- Edit button on user messages only
- Click → Enter edit mode with textarea pre-filled
- Save → Overwrites existing message content
- Cancel → Revert to original
- On save: Truncate conversation after edited message, regenerate response

**Delete Message**:
- Delete button appears on hover
- Click → Show confirmation dialog
- Confirm → Delete message and all subsequent messages
- Cannot delete if it's the only message (show warning)

**UI Pattern**:
- Hover over message → Show action bar with icon buttons
- Action bar positioned top-right of message bubble
- Icons: Copy, Edit (user only), Delete
- Smooth fade-in/out on hover

**Edit Flow**:
```
1. Click Edit → Replace MessageBubble with textarea
2. User modifies text
3. Click Save → Update message in DB, clear subsequent messages
4. Trigger regenerate if it was user message followed by assistant
```

**Delete Flow**:
```
1. Click Delete → Open confirmation dialog
2. User confirms → Delete from DB
3. If assistant message: also delete parent user message
4. Update UI immediately
```

### Dependencies

- Depends on existing persistence layer (`usePersistence` hook)
- Uses existing message schema (no DB changes needed)
- Edit triggers regenerate via existing `useChat.retryMessage` pattern

### Reference Files

| Aspect | File Path |
|--------|-----------|
| Message actions | `src/lib/components/app/ChatMessages/*.svelte` (action buttons) |
| Branching controls | `src/lib/components/app/ChatMessageBranchingControls.svelte` (edit UI pattern) |

### E2E Test Requirements

- Hover over message → Verify action buttons appear
- Click copy → Verify clipboard content matches
- Edit user message → Save → Verify content updated, subsequent messages cleared
- Delete message → Confirm → Verify message removed from UI and DB
- Delete middle message → Verify all subsequent messages also deleted

---

## Slice file-attachments: File Attachments

### Feature Description

Upload and attach images, text files, PDFs to messages with preview, drag-drop, paste support, and model capability validation.

### Key Requirements

**Supported File Types**:
- **Images**: JPEG, PNG, GIF, WebP, SVG (convert to PNG)
- **Text Files**: .txt, .md, .json, .js, .ts, .py, .java, .cpp, .html, .css, .xml, .yaml, and 15+ more
- **PDFs**: Extract text OR render as images (based on `pdfAsImage` setting)

**Upload Methods**:
- Click "Attach" button → File picker
- Drag-and-drop files onto chat area
- Paste image from clipboard (Ctrl/Cmd+V)
- Paste long text (>2500 chars) → Auto-convert to .txt file (based on `pasteLongTextToFileLen` setting)

**File Processing**:
- Images → Base64 data URL, generate thumbnail
- Text files → Read as UTF-8 string
- PDFs → Extract text via pdfjs-dist, OR convert pages to images
- SVG/WebP → Convert to PNG for compatibility

**Attachment Display**:
- Thumbnail grid below textarea (before send)
- Each thumbnail shows: filename, size, preview image (or file icon)
- Remove button (X) on each thumbnail
- Click thumbnail → Open full preview dialog

**Model Capability Validation**:
- Fetch model capabilities from `/v1/models/{id}` endpoint
- Check for vision support (image attachments)
- Check for audio support (audio attachments, deferred)
- Show warning if attaching incompatible file type for selected model

**API Request Format**:
- Images: `{"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}`
- Text files: Inline as user message prefix with filename marker
- Store attachments in `MessageExtra` field for persistence

**Drag-Drop UX**:
- Global drop zone overlay when dragging files over window
- Visual highlight on drop target
- Accept multiple files in one drop

### Dependencies

- Depends on Slice settings-dialog for `pdfAsImage`, `pasteLongTextToFileLen` settings
- Extends existing message schema (`MessageExtra` already has structure for attachments)
- Model selection must check capabilities before allowing send

### Reference Files

| Aspect | File Path |
|--------|-----------|
| File processing | `src/lib/utils/process-uploaded-files.ts` (base64, text, PDF) |
| PDF processing | `src/lib/utils/pdf-processing.ts` (text extraction, image rendering) |
| SVG conversion | `src/lib/utils/svg-to-png.ts` |
| WebP conversion | `src/lib/utils/webp-to-png.ts` |
| Attachment UI | `src/lib/components/app/ChatAttachments/*.svelte` |
| Drag-drop handler | `src/lib/components/app/ChatScreen/ChatScreen.svelte` (drop zone) |

### NPM Dependencies

Install:
```bash
npm install pdfjs-dist
```

### E2E Test Requirements

- Click attach → Select image → Verify thumbnail appears
- Drag image onto chat → Verify thumbnail appears
- Paste image → Verify thumbnail appears
- Remove attachment → Verify removed from UI
- Send with image → Verify API request includes base64 data URL
- Attach PDF → Verify text extracted (or images generated based on setting)
- Select model without vision → Attach image → Verify warning shown

---

## Slice keyboard-shortcuts: Keyboard Shortcuts

### Feature Description

Global keyboard shortcuts for common actions with cross-platform modifier detection.

### Key Requirements

**Shortcuts**:
- `Ctrl/Cmd+K` → Open search modal (focus search input)
- `Ctrl/Cmd+Shift+O` → New chat (clear messages, start fresh)
- `Ctrl/Cmd+Shift+E` → Rename current conversation (inline edit)
- `Shift+Enter` → Insert newline in textarea (no send)
- `Escape` → Exit search mode, cancel edit, close modals

**Cross-Platform Detection**:
- Mac: Use `Cmd` (metaKey)
- Windows/Linux: Use `Ctrl` (ctrlKey)
- Helper: `const isModifier = event.ctrlKey || event.metaKey;`

**Implementation**:
- Global `keydown` event listener in Layout/App component
- Prevent default browser behavior where needed
- Shortcuts work anywhere in app (except when typing in textarea)
- Textarea exceptions: Only Shift+Enter and Escape work in textarea

**Keyboard Handler Pattern**:
```typescript
function handleGlobalKeydown(event: KeyboardEvent) {
  const isModifier = event.ctrlKey || event.metaKey;

  if (isModifier && event.key === 'k') {
    event.preventDefault();
    openSearchModal();
  }

  if (isModifier && event.shiftKey && event.key === 'O') {
    event.preventDefault();
    startNewConversation();
  }

  // ... more shortcuts
}
```

**Focus Management**:
- After Ctrl+K, focus search input
- After new chat, focus message textarea
- After rename, focus conversation title input

**User Feedback**:
- Show keyboard shortcut hints in tooltips (e.g., "Search (Ctrl+K)")
- Optional: Keyboard shortcuts help dialog (Ctrl+/)

### Dependencies

- Depends on existing search modal, conversation management
- Integrates with InputArea for Shift+Enter behavior
- No new UI components required (modifies existing event handlers)

### Reference Files

| Aspect | File Path |
|--------|-----------|
| Global shortcuts | `src/routes/+layout.svelte` (lines 42-66: handleKeydown) |

### E2E Test Requirements

- Press Ctrl/Cmd+K → Verify search modal opens, input focused
- Press Ctrl/Cmd+Shift+O → Verify new chat started, messages cleared
- Press Ctrl/Cmd+Shift+E → Verify conversation title edit mode
- Type in textarea, press Shift+Enter → Verify newline inserted, no send
- Open search, press Escape → Verify search closed
- Test both Mac (Cmd) and non-Mac (Ctrl) modifiers

---

## Implementation Order Rationale

1. **settings-dialog** first: Provides foundation for all subsequent slices (display options, theme, generation params)
2. **markdown-rendering** second: High user-facing impact, uses settings from Slice 1
3. **message-actions** third: Moderate complexity, enhances existing message UI
4. **file-attachments** fourth: Complex feature, uses settings from Slice 1, builds on message rendering from Slice 2
5. **keyboard-shortcuts** last: Ties together all features with keyboard navigation, depends on all previous slices being complete

---

## Notes

- All slices include E2E test coverage per acceptance criteria
- Backend work (props endpoint extension) included in Slice settings-dialog
- Message branching (tree structure) explicitly deferred (using simple edit-in-place instead)
- Deferred features: Audio recording, continue generation, advanced DRY/XTC samplers

_Created: 2026-01-12_
