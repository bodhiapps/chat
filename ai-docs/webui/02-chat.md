# Feature: Chat Interface

> Priority: 2 | Status: Core Feature

---

## Overview

Chat interface enables real-time streaming conversations with AI models, supporting markdown rendering, reasoning blocks, code highlighting, and message management.

**Related docs**: [API Reference](./api-reference.md) (SSE format), [Settings](./06-settings.md) (generation parameters), [Attachments](./03-attachments.md) (file uploads), [Model Selection](./01-model-selection.md) (capabilities)

---

## Functional Requirements

### User Should Be Able To

1. **Send Messages**
   - Type message in textarea
   - Press Enter to send (Shift+Enter for newline)
   - See message immediately in chat history
   - Send with file attachments

2. **Receive Streaming Responses**
   - See tokens appear in real-time
   - View reasoning/thinking content separately (collapsible)
   - See generation progress (tokens, speed)
   - Stop generation mid-stream (saves partial)

3. **View Formatted Content**
   - Markdown rendering (GFM + KaTeX math)
   - Syntax-highlighted code blocks
   - Copy code button on blocks
   - HTML preview for code (security-validated)
   - LaTeX math rendering

4. **Manage Messages**
   - Copy message text
   - Edit user messages (preserves responses)
   - Edit assistant messages (option to regenerate)
   - Regenerate assistant responses
   - Delete individual messages
   - Continue generation (extend response)

5. **View Statistics**
   - See tokens/sec during generation
   - View prompt processing time
   - See total tokens generated
   - View cache utilization

6. **Navigate Content**
   - Auto-scroll during generation
   - Manual scroll disables auto-scroll
   - Re-enable by scrolling to bottom
   - Smooth/instant scroll options

---

## System Should

1. **Handle Streaming**
   - Parse SSE format (`data:` lines)
   - Aggregate partial tokens into words
   - Update UI every 100ms (batch updates)
   - Handle reconnection on network errors

2. **Process Content**
   - Separate reasoning_content from regular content
   - Parse tool_calls deltas (aggregate by index)
   - Extract timing data from stream
   - Track prompt progress percentage

3. **Render Incrementally**
   - Cache stable markdown blocks
   - Only re-render incomplete last block
   - Apply syntax highlighting post-render
   - Bind event handlers to code blocks

4. **Manage State**
   - Track per-conversation loading/streaming
   - Store partial responses on abort
   - Save timings with messages
   - Update lastModified on conversation

5. **Detect User Actions**
   - Track scroll position (10px threshold from bottom)
   - Detect user scrolled up vs auto-scroll
   - Debounce scroll events (100ms)
   - Clear auto-scroll on manual scroll up

---

## UI Components Needed

### Chat Container
- Full-height flex layout
- Messages area (scrollable)
- Input form (fixed bottom)
- Settings panel (collapsible sidebar or dropdown)

### Message List
- Chronological display (oldest to newest)
- User messages: Right-aligned (blue accent)
- Assistant messages: Left-aligned (muted background)
- System messages: Centered (subtle)
- Spacing between messages

### Message Bubble
**User Message**:
- Content text (markdown if enabled via settings)
- Timestamp
- Attachment previews (thumbnails)
- Action buttons (edit, copy, delete)

**Assistant Message**:
- Thinking block (collapsible, Brain icon, auto-collapse when content arrives)
- Content (markdown rendered)
- Tool calls badges (if enabled)
- Statistics (live or final)
- Action buttons (copy, regenerate, continue, delete)

### Thinking Block
- Collapsible component
- Header: "Reasoning..." (streaming) or "Reasoning" (complete)
- Brain icon + chevron
- Auto-collapse when regular content received
- Initial state: expanded if `showThoughtInProgress` setting enabled

### Code Blocks
- Language badge (top-left)
- Copy button (top-right)
- HTML preview button (if content is HTML)
- Syntax highlighting via highlight.js
- Line numbers optional

### Statistics Display
- Two views: "Reading" (prompt) vs "Generation" (response)
- Auto-switch when generation starts
- Badges: token count, time, tokens/sec
- Gauge icon for speed
- Toggle visibility via settings

### Message Actions
- Copy icon (always visible)
- Edit icon (user messages)
- Regenerate icon (assistant messages)
- Continue icon (assistant, if experimental enabled)
- Delete icon (all messages)
- Hover to show full action bar

### Input Form
- Auto-growing textarea (max 10 rows)
- Attachment button (paperclip)
- Model selector (if multi-model)
- Settings button (gear icon)
- Send button (disabled when empty)
- Stop button (shows when streaming)

---

## API Integration

### Send Message

**Endpoint**: `POST /v1/chat/completions`

**Request**:
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | MessageContentPart[];
  }>;
  stream: true;
  return_progress: true;
  model?: string;
  reasoning_format: 'auto';
  temperature: 0.8;
  // ... other params from settings
}
```

**Streaming Response**: SSE format
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"reasoning_content":"Let me think..."}}]}
data: {"choices":[{"delta":{"content":" world"}}],"timings":{...}}
data: [DONE]
```

### Abort Request

Use `AbortController` per conversation:
```typescript
const abortController = new AbortController();
fetch('/v1/chat/completions', { signal: abortController.signal });
// On stop: abortController.abort();
```

---

## Streaming Implementation

### SSE Parsing
```typescript
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line
  
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6);
    if (data === '[DONE]') break;
    
    const chunk = JSON.parse(data);
    processChunk(chunk);
  }
}
```

### Chunk Processing
- Extract `delta.content` → regular content
- Extract `delta.reasoning_content` → thinking
- Extract `delta.tool_calls` → aggregate by index
- Extract `timings` → save stats
- Extract `prompt_progress` → show progress bar

### Real-time Updates
- Batch content updates every 100ms
- Update UI state via store (reactive)
- Trigger markdown re-render on content change
- Update scroll position continuously during streaming

---

## Markdown Rendering Pipeline

### Processing Chain
```
remark (parse) 
→ remarkGfm (tables, strikethrough) 
→ remarkMath ($inline$, $$block$$) 
→ remarkBreaks (newlines to <br>) 
→ remarkRehype (mdast → hast) 
→ rehypeKatex (math rendering) 
→ rehypeHighlight (syntax highlight) 
→ rehypeEnhanceCodeBlocks (copy buttons) 
→ rehypeStringify (HTML output)
```

### Incremental Rendering
```typescript
// Keep stable blocks cached
const stableCount = processedChildren.length - 1;
for (let i = 0; i < stableCount; i++) {
  if (renderedBlocks[i]?.id === getNodeId(children[i])) {
    nextBlocks.push(renderedBlocks[i]); // Reuse
    continue;
  }
  nextBlocks.push(renderNode(children[i])); // Re-render
}
// Always re-render last block (incomplete during streaming)
```

### Code Block Enhancement
- Wrap in `.code-block-wrapper`
- Add language badge
- Insert copy button (`<button class="copy-code-btn">`)
- Insert preview button for HTML (`<button class="preview-code-btn">`)
- Bind click handlers post-render

---

## Auto-Scroll Behavior

### Constants
- `AUTO_SCROLL_INTERVAL`: 100ms (scroll frequency during streaming)
- `AUTO_SCROLL_AT_BOTTOM_THRESHOLD`: 10px (tolerance for "at bottom" detection)
- `INITIAL_SCROLL_DELAY`: 50ms (delay before first auto-scroll)

### Detection Logic
```typescript
const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
const isAtBottom = distanceFromBottom < 10;

if (scrollTop < lastScrollTop && !isAtBottom) {
  // User scrolled up → disable auto-scroll
  autoScrollEnabled = false;
} else if (isAtBottom) {
  // User at bottom → re-enable
  autoScrollEnabled = true;
}
```

### Continuous Scroll
- While streaming AND autoScrollEnabled: scroll every 100ms
- Use `scrollTo({ behavior: 'smooth' })` for UX
- Stop interval when streaming completes
- Clear interval when component unmounts

---

## Message Actions Implementation

### Copy
```typescript
async function handleCopy(content: string) {
  await navigator.clipboard.writeText(content);
  toast.success('Copied to clipboard');
}
```

### Edit User Message
- Show inline textarea with current content
- On save: update message content
- Preserve all assistant responses (no regeneration)
- Update conversation lastModified

### Edit Assistant Message
- Option 1: Replace content (same message ID)
- Option 2: Create branch (new message, mark as sibling)
- Regenerate: Delete + create new + stream response

### Regenerate
```typescript
async function regenerate(messageId: string) {
  await deleteMessageCascading(convId, messageId); // Remove message + descendants
  const parentMsg = await getParentMessage(messageId);
  await sendMessage(messagesToSend, { onChunk, onComplete });
}
```

### Delete
- Cascading delete: remove message + all descendants
- Update parent's children array
- Navigate to sibling if available
- Update UI reactively

### Continue (Experimental)
- Append to existing message content
- New streaming session with same message ID
- Useful for extending incomplete responses
- Save incrementally during stream

---

## Statistics Display

### Live Stats (During Streaming)
- **Reading Phase**: prompt tokens, time, speed
- **Generation Phase**: response tokens, time, speed
- Auto-switch from Reading to Generation when first token generated
- Update every 100ms

### Final Stats (After Completion)
- Total prompt tokens
- Total response tokens
- Total cache tokens (if KV cache used)
- Total time
- Average tokens/sec

### Display Conditions
- Show if `showMessageStats` setting enabled
- Live stats only if `isLoading` for conversation
- Final stats if `message.timings` exists
- Keep visible if `keepStatsVisible` enabled

---

## Error Handling

### Network Errors
**User Experience**:
- Toast notification: "Connection lost, retrying..."
- Retry button in error state
- Save partial response before showing error
- Show last successful content

**Recovery**:
- Exponential backoff (1s, 2s, 4s, 8s)
- Max 3 retry attempts
- User can manually retry

### Context Size Errors
**Detection**: Error type `exceed_context_size_error`

**User Experience**:
- Clear error message: "Message exceeds context size ({n_prompt_tokens} tokens, limit: {n_ctx})"
- Suggestion: "Try shortening message or starting new conversation"
- Don't save message to database

**Recovery**:
- Allow user to edit message
- Suggest removing attachments
- Offer "Start New Conversation" button

### Abort Handling
**On User Stop**:
- Call `abortController.abort()`
- Wait for stream to close
- Save partial response with timings
- Show "Stopped by user" indicator

### Stream Parse Errors
**On Invalid JSON**:
- Log error to console
- Skip malformed chunk
- Continue processing subsequent chunks
- Don't crash entire stream

---

## Testing Considerations

### Unit Tests
1. **SSE Parsing**
   - Test line splitting with incomplete buffers
   - Test `[DONE]` detection
   - Test malformed JSON handling

2. **Markdown Rendering**
   - Test incremental rendering (stable block caching)
   - Test math rendering (inline $x$ and block $$y$$)
   - Test code block enhancement

3. **Message Actions**
   - Test copy to clipboard
   - Test edit flow (user vs assistant)
   - Test regenerate (delete + recreate)
   - Test delete (cascading)

4. **Auto-scroll**
   - Test scroll detection (user vs auto)
   - Test re-enable on return to bottom
   - Test disable on manual scroll up

### Integration Tests
1. **End-to-End Streaming**
   - Send message → verify request
   - Receive chunks → verify content updates
   - Stop generation → verify partial saved
   - Complete stream → verify final stats

2. **Error Scenarios**
   - Network timeout → verify retry
   - Context exceeded → verify error message
   - Abort during stream → verify partial saved

3. **Content Rendering**
   - Markdown → verify HTML output
   - Code blocks → verify syntax highlighting
   - Math → verify KaTeX rendering
   - Tool calls → verify badge display

---

## Accessibility

### Keyboard Navigation
- Tab: Focus textarea, then buttons
- Enter: Send message (in textarea)
- Shift+Enter: New line (in textarea)
- Escape: Cancel edit mode
- Tab/Shift+Tab: Navigate action buttons

### Screen Reader Support
- Message role announcements: "User message", "Assistant message"
- Live region for streaming content: `aria-live="polite"`
- Button labels: "Copy message", "Regenerate response", "Delete message"
- Code block language: "Code block in Python"
- Statistics: "Generated {n} tokens in {t} seconds"

### Focus Management
- Focus textarea after send
- Focus edit textarea when editing
- Return focus to trigger after close dialog
- Trap focus in modals

---

## Responsive Design

### Desktop (>768px)
- Two-column: Sidebar (300px) + Chat (remaining)
- Message width: max 900px centered
- Code blocks: full width with horizontal scroll
- Actions: Show on hover

### Mobile (<768px)
- Single column: Chat full width
- Sidebar: Overlay drawer
- Message width: 100% with padding
- Code blocks: Horizontal scroll, pinch-zoom
- Actions: Always visible (no hover)
- Textarea: Max 5 rows on mobile
- Touch-optimized buttons (44px min)

---

## Implementation Notes

### React Adaptations

**Streaming Hook**:
```typescript
function useStreamingChat() {
  const [messages, setMessages] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef(null);
  
  const sendMessage = useCallback(async (content) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    await streamResponse({
      signal: controller.signal,
      onChunk: (chunk) => setStreamingContent(prev => prev + chunk),
      onComplete: (final) => {
        setMessages(prev => [...prev, { role: 'assistant', content: final }]);
        setStreamingContent('');
      }
    });
  }, []);
  
  const stopStreaming = () => abortControllerRef.current?.abort();
  
  return { messages, streamingContent, sendMessage, stopStreaming };
}
```

**Markdown Component**:
```typescript
function MarkdownRenderer({ content, isStreaming }) {
  const [blocks, setBlocks] = useState([]);
  const [unstableHtml, setUnstableHtml] = useState('');
  
  useEffect(() => {
    processMarkdown(content).then(({ stable, unstable }) => {
      setBlocks(stable);
      setUnstableHtml(unstable);
    });
  }, [content]);
  
  return (
    <>
      {blocks.map(block => <div dangerouslySetInnerHTML={{ __html: block.html }} />)}
      {unstableHtml && <div dangerouslySetInnerHTML={{ __html: unstableHtml }} />}
    </>
  );
}
```

**Auto-scroll Hook**:
```typescript
function useAutoScroll(deps: any[]) {
  const containerRef = useRef(null);
  const autoScrollEnabledRef = useRef(true);
  
  useEffect(() => {
    if (!autoScrollEnabledRef.current) return;
    
    const interval = setInterval(() => {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, deps);
  
  return { containerRef, autoScrollEnabledRef };
}
```

### Performance Optimizations

1. **Virtualization**: For 100+ messages, use `react-window` or similar
2. **Debouncing**: Debounce markdown re-render to 100ms
3. **Memoization**: Memoize stable markdown blocks with React.memo
4. **Code Split**: Lazy-load markdown processor (remark/rehype bundle)

---

_Updated: Phase chat completed_
