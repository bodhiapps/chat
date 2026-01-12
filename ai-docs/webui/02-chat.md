# Feature: Chat Interface

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

> Priority: 2 | Status: Core Feature | **Implementation: 🔄 Basic**

---

## Overview

Chat interface enables real-time streaming conversations with AI models, supporting markdown rendering, reasoning blocks, code highlighting, and message management.

**Related docs**: [API Reference](./api-reference.md), [Settings](./06-settings.md), [Attachments](./03-attachments.md), [Model Selection](./01-model-selection.md)

**Current Status**: Streaming + retry + regenerate working; missing: markdown, syntax highlighting, stats, message actions

---

## User Stories

- 🔄 **As a user**, I can send text messages to the AI so that I can have conversations
  - ✅ Type message in textarea
  - ❌ Press Enter to send (Shift+Enter for newline) - _Only Enter works, no Shift+Enter_
  - ✅ See message immediately in chat history
  - ❌ Send with file attachments

- 🔄 **As a user**, I can see the AI's response stream in real-time so that I get immediate feedback
  - ✅ See tokens appear in real-time
  - ❌ View reasoning/thinking content separately (collapsible)
  - ❌ See generation progress (tokens, speed)
  - ✅ Stop generation mid-stream (saves partial)

- ❌ **As a user**, I can see formatted content (markdown, code, math) so that technical content is readable

- 🔄 **As a user**, I can copy, edit, regenerate, and delete messages so that I can manage my conversation
  - ❌ Copy message text
  - ❌ Edit user messages (preserves responses)
  - ❌ Edit assistant messages (option to regenerate)
  - ✅ Regenerate assistant responses
  - ❌ Delete individual messages
  - ❌ Continue generation (extend response)

- ❌ **As a user**, I can see reasoning/thinking content separately so that I understand the AI's thought process

- 🔄 **As a user**, the chat auto-scrolls during streaming so that I always see the latest content
  - ✅ Auto-scroll during generation
  - 🔄 Manual scroll disables auto-scroll - _Basic detection, no 10px threshold_
  - 🔄 Re-enable by scrolling to bottom

- **As a user**, I can scroll up to read earlier messages without disrupting streaming

---

## Functional Requirements

### Message Sending

**Behavior**: User types in textarea, presses Enter → message sent to API
- Textarea auto-grows (max 10 rows desktop, 5 rows mobile)
- Send button enabled only when text non-empty
- Message appears immediately in chat history
- Focus returns to textarea after send
- Shift+Enter creates newline (Enter sends)

**Edge Cases**:
- Empty message → Send button disabled
- Streaming in progress → Disable send, show stop button instead

### Streaming Response

**Behavior**: AI response streams token-by-token in real-time
- Tokens appear incrementally as received
- UI updates smoothly without blocking
- Reasoning content (if present) shown in collapsible "Thinking" block
- User can stop generation → partial response saved

**Edge Cases**:
- Connection lost → Show error, save partial, offer retry
- Context exceeded → Show clear error with token counts, prevent send
- Stream parse error → Skip malformed chunk, continue with rest

### Content Rendering

**Behavior**: Markdown content rendered with enhancements
- **Markdown**: GFM support (tables, strikethrough, task lists)
- **Math**: LaTeX inline (`$x^2$`) and block (`$$\sum$$`) via KaTeX
- **Code**: Syntax highlighting with language badge + copy button
- **Links**: Clickable, open in new tab
- **Incremental**: Stable blocks cached, only last block re-renders during streaming

**Edge Cases**:
- Malformed markdown → Render as plain text
- Unsupported language → Generic highlighting
- Math render error → Show raw LaTeX

### Message Actions

**Behavior**: User can manage individual messages
- **Copy**: Copy message text to clipboard
- **Edit** (user message): Inline textarea, preserves assistant responses
- **Regenerate** (assistant): Delete message + create new streaming response
- **Delete**: Remove message + all descendant messages (cascading)
- **Continue** (experimental): Extend incomplete assistant response

**Action Visibility**:
- Desktop: Show on message hover
- Mobile: Always visible

### Auto-Scroll

**Behavior**: Chat scrolls automatically during streaming
- Scroll to bottom every 100ms while streaming
- Detect user scroll up (>10px from bottom) → disable auto-scroll
- User scrolls to bottom → re-enable auto-scroll
- Smooth scroll animation

**Edge Cases**:
- User at bottom, new content arrives → scroll continues
- User scrolled up, stops generation → scroll remains disabled
- Manual scroll to bottom during generation → auto-scroll resumes

### Thinking Block

**Behavior**: Reasoning content displayed separately from main content
- Shows as collapsible block with brain icon
- Header: "Reasoning..." (streaming) or "Reasoning" (complete)
- Auto-collapses when main content arrives (if setting enabled)
- Initial state: expanded if `showThoughtInProgress` enabled

### Statistics Display

**Behavior**: Show generation metrics (optional via settings)
- **Live** (during generation): tokens, time, tokens/sec
- **Final** (after completion): total tokens (prompt + response + cache), time, avg speed
- Auto-switch from "Reading" phase to "Generation" phase
- Toggle visibility via `showMessageStats` setting

---

## Data Model

**Message Entity**:
- `id` (string): Unique message ID
- `role` (enum): user | assistant | system
- `content` (string): Message text
- `reasoning_content` (string, optional): Thinking/reasoning text
- `tool_calls` (array, optional): Tool invocations
- `timings` (object, optional): Generation statistics
- `parentId` (string, optional): Parent message ID (for branching)
- `createdAt` (timestamp): Message creation time

**Conversation State**:
- `isStreaming` (boolean): Whether response is currently streaming
- `streamingContent` (string): Accumulated content during stream
- `streamingReasoning` (string): Accumulated reasoning during stream
- `abortController` (AbortController): For stopping generation

**Storage**: Messages persisted to IndexedDB (see persistence doc)

---

## Acceptance Criteria

### Scenario: Send message and receive streaming response

- **GIVEN** user is on chat page with model selected
- **WHEN** user types message and presses Enter
- **THEN** message appears in chat history immediately
- **AND** API request sent with message content
- **WHEN** SSE response begins streaming
- **THEN** assistant message appears with content streaming token-by-token
- **AND** chat auto-scrolls to show latest content

### Scenario: Stop generation mid-stream

- **GIVEN** assistant message is streaming
- **WHEN** user clicks stop button
- **THEN** stream aborts immediately
- **AND** partial response is saved to database
- **AND** send button re-enabled

### Scenario: Markdown and code rendering

- **GIVEN** assistant message contains markdown and code
- **WHEN** content finishes streaming
- **THEN** markdown is rendered with proper formatting
- **AND** code blocks show syntax highlighting
- **AND** copy button appears on code blocks

### Scenario: Auto-scroll behavior

- **GIVEN** assistant message is streaming
- **WHEN** user does not scroll manually
- **THEN** chat auto-scrolls to bottom continuously
- **WHEN** user scrolls up to read earlier messages
- **THEN** auto-scroll disables
- **WHEN** user scrolls back to bottom
- **THEN** auto-scroll re-enables

### Scenario: Regenerate message

- **GIVEN** conversation has assistant message
- **WHEN** user clicks regenerate button
- **THEN** assistant message is deleted
- **AND** new streaming request initiated
- **AND** new message appears with fresh response

### Scenario: Edit user message

- **GIVEN** user message exists in conversation
- **WHEN** user clicks edit button
- **THEN** inline textarea appears with message content
- **WHEN** user modifies text and saves
- **THEN** message content updates
- **AND** all assistant responses are preserved (no regeneration)

### Scenario: Thinking block display

- **GIVEN** model response includes reasoning_content
- **WHEN** reasoning starts streaming
- **THEN** collapsible "Reasoning..." block appears
- **WHEN** regular content starts arriving
- **THEN** thinking block auto-collapses (if setting enabled)
- **AND** user can click to expand/collapse thinking block

### Scenario: Handle context exceeded error

- **GIVEN** user sends message
- **WHEN** API returns context exceeded error
- **THEN** error toast shows: "Message exceeds context ({n} tokens, limit: {limit})"
- **AND** message is NOT saved to database
- **AND** user can edit message or start new conversation

---

## API Integration

### Send Message: `POST /v1/chat/completions`

**Request**:
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | MessageContentPart[];
  }>;
  stream: true;
  return_progress: true;
  reasoning_format: 'auto';
  model?: string;
  temperature: 0.8;
  // ... other params from settings
}
```

**Streaming Response** (SSE format):
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"reasoning_content":"Let me think..."}}]}
data: {"choices":[{"delta":{"content":" world"}}],"timings":{...}}
data: [DONE]
```

**Abort**: Use `AbortController` signal in fetch request

---

## Reference Implementation

> **Svelte Source**: llama.cpp webui uses Svelte 5 runes for state management. Adapt to React patterns.

**Key Files**:
- `$webui-folder/src/lib/stores/chat.svelte.ts` - Chat state, streaming logic, message actions
- `$webui-folder/src/lib/services/chat.ts` - SSE parsing, API calls
- `$webui-folder/src/lib/components/app/chat/ChatMessages/ChatMessages.svelte` - Message list, auto-scroll
- `$webui-folder/src/lib/components/app/chat/ChatForm/ChatForm.svelte` - Input textarea, send button
- `$webui-folder/src/lib/components/app/misc/markdown/MarkdownRenderer.svelte` - Incremental markdown rendering

> **Note**: Svelte patterns (`$state`, `$derived`, `$effect`) should be adapted to React (`useState`, `useMemo`, `useEffect`).

### SSE Parsing Algorithm

```
1. Read stream chunks via ReadableStream
2. Decode bytes to text, accumulate in buffer
3. Split buffer by newlines, keep incomplete line
4. For each line starting with "data: ":
   - Extract JSON after "data: "
   - If "[DONE]", break stream
   - Parse JSON, extract delta fields
5. Accumulate deltas into message content
6. Update UI state reactively
```

See `$webui-folder/src/lib/services/chat.ts` for full SSE parsing implementation.

### Markdown Rendering Pipeline

```
Input (markdown string)
  → remark parse
  → remarkGfm (tables, strikethrough)
  → remarkMath ($inline$, $$block$$)
  → remarkBreaks (newlines → <br>)
  → remarkRehype (mdast → hast)
  → rehypeKatex (math rendering)
  → rehypeHighlight (syntax highlight)
  → rehypeEnhanceCodeBlocks (copy buttons, language badges)
  → rehypeStringify (HTML output)
```

**Incremental Rendering**:
- Split content into blocks (paragraphs, code blocks, etc.)
- Cache rendered HTML for stable blocks (blocks before last)
- Re-render only last block during streaming
- Append new blocks as content grows

See `$webui-folder/src/lib/components/app/misc/markdown/` for remark/rehype pipeline.

### Auto-Scroll Pattern

```
1. Track scroll position relative to bottom (scrollHeight - scrollTop - clientHeight)
2. If user scrolls up (position > 10px from bottom): disable auto-scroll
3. If user scrolls to bottom (position < 10px): enable auto-scroll
4. While streaming AND auto-scroll enabled:
   - Scroll to bottom every 100ms with smooth behavior
5. Stop interval when streaming completes or component unmounts
```

See `$webui-folder/src/lib/components/app/chat/ChatMessages/ChatMessages.svelte` for auto-scroll logic.

### Message Actions

**Regenerate Flow**:
```
1. Delete message (cascading: removes descendants)
2. Get parent message
3. Build message history up to parent
4. Send new streaming request
5. Create new message with response
```

**Edit Flow**:
```
1. Show inline textarea with current content
2. On save: update message content in database
3. Preserve all assistant responses (no deletion)
4. Update conversation lastModified timestamp
```

---

## UI Components

### Chat Container
- Full-height flex layout: messages area (scrollable) + input form (fixed bottom)

### Message List
- Chronological display (oldest → newest)
- User messages: right-aligned, blue accent
- Assistant messages: left-aligned, muted background

### Message Bubble
- Content (markdown rendered)
- Thinking block (collapsible, if reasoning present)
- Tool calls badges (if present)
- Statistics (if enabled)
- Action buttons (copy, edit, regenerate, delete)

### Code Block Enhancements
- Language badge (top-left corner)
- Copy button (top-right corner)
- HTML preview button (if content is HTML)
- Syntax highlighting via highlight.js

### Input Form
- Auto-growing textarea (max 10 rows)
- Attachment button
- Model selector (if multi-model mode)
- Send button (disabled when empty) / Stop button (when streaming)

---

## Accessibility

**Keyboard Navigation**:
- Enter: Send message (in textarea)
- Shift+Enter: New line (in textarea)
- Tab: Navigate action buttons
- Escape: Cancel edit mode

**Screen Reader**:
- Message role announcements: "User message", "Assistant message"
- Live region for streaming: `aria-live="polite"`
- Button labels: "Copy message", "Regenerate response", "Delete message"
- Code block language: "Code block in Python"

**Focus Management**:
- Focus textarea after send
- Focus edit textarea when editing
- Return focus to trigger after dialog close

---

## Responsive Design

| Breakpoint | Message Width | Actions | Textarea Max Rows |
|------------|---------------|---------|-------------------|
| Desktop (>768px) | max 900px | On hover | 10 |
| Mobile (<768px) | 100% | Always visible | 5 |

---

## Performance Considerations

- **Virtualization**: For >100 messages, use react-window
- **Debouncing**: Debounce markdown re-render 100ms
- **Memoization**: Memo stable markdown blocks with React.memo
- **Code Splitting**: Lazy-load remark/rehype bundle

---

## Verification

**Manual Testing**:
1. Send message → Verify immediate display → Verify streaming response
2. Stop mid-stream → Verify partial saved → Verify send re-enabled
3. Scroll up during streaming → Verify auto-scroll disabled
4. Scroll to bottom → Verify auto-scroll resumes
5. Send message with code → Verify syntax highlighting → Verify copy button
6. Click regenerate → Verify old message deleted → Verify new stream starts
7. Edit user message → Verify content updates → Verify responses preserved
8. Send message with reasoning → Verify thinking block → Verify auto-collapse

---

_Updated: Revised for functional focus, reduced code ratio_
