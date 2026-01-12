# Feature: Tool Calls Display

> Priority: 4 | Status: Core Feature | **Implementation: 🔄 Schema Only**

---

## Overview

Tool call display shows function/tool invocations made by AI models, rendering them as clickable badges with formatted JSON payloads.

**Related docs**: [API Reference](./api-reference.md) (tool_calls format), [Chat](./02-chat.md) (streaming integration), [Settings](./06-settings.md) (showToolCalls option)

**Current Status**: Schema has `MessageExtra.tool_calls?: unknown[]` field defined, but no parsing or display UI implemented.

---

## Functional Requirements

### User Should Be Able To

1. ❌ **View Tool Calls**
   - ❌ See tool call badges below assistant message
   - ❌ View function name as badge label
   - ❌ Click badge to copy JSON payload
   - ❌ See tooltip with formatted JSON on hover

2. ❌ **Understand Tool Calls**
   - ❌ Identify which functions were called
   - ❌ See function arguments (parsed JSON)
   - ❌ Copy full payload for debugging
   - ❌ Distinguish multiple tool calls (numbered)

---

## System Should

1. 🔄 **Parse Tool Calls**
   - ❌ Extract from `delta.tool_calls` in stream
   - ❌ Aggregate deltas by index
   - ❌ Merge partial JSON arguments
   - 🔄 Store as JSON string in database - _Schema field exists: `MessageExtra.tool_calls?: unknown[]`_

2. ❌ **Format Display**
   - ❌ Parse stored JSON string
   - ❌ Format function arguments (pretty JSON)
   - ❌ Handle malformed JSON gracefully
   - ❌ Truncate long function names

3. ❌ **Handle Visibility**
   - ❌ Show only if `showToolCalls` setting enabled
   - ❌ Hide in readonly/archived messages (optional)
   - ❌ Display after message content

---

## UI Components Needed

### Tool Call Badge
- Compact pill-shaped button
- Function name as label
- Wrench icon prefix
- Tooltip with formatted JSON
- Copy icon (shows on hover)
- Max width with ellipsis

### Tool Calls Container
- Flex row with gap
- Wraps to multiple lines
- Subtle text color (muted)
- Label: "Tool calls:"

---

## Data Structures

### API Format (Streaming Delta)
```typescript
{
  choices: [{
    delta: {
      tool_calls: [{
        index: 0,
        id: 'call_abc123',
        type: 'function',
        function: {
          name: 'search_web',
          arguments: '{"query":"weather"}'  // Partial JSON string
        }
      }]
    }
  }]
}
```

### Storage Format
```typescript
// In DatabaseMessage
{
  toolCalls: '[{"id":"call_123","type":"function","function":{"name":"search","arguments":"{\\"query\\":\\"weather\\"}"}}]'
}
```

### Display Format
```typescript
interface ToolCallBadge {
  label: string;           // Function name or "Call #N"
  tooltip: string;         // Pretty JSON
  copyValue: string;       // Full JSON for clipboard
}
```

---

## Rendering Logic

### Parse Stored Tool Calls
```typescript
let parsedToolCalls: ApiChatCompletionToolCall[] | null = null;

try {
  parsedToolCalls = JSON.parse(message.toolCalls);
} catch {
  // Fallback: show raw string
  fallbackDisplay = message.toolCalls;
}
```

### Format Badge
```typescript
function formatToolCallBadge(toolCall, index) {
  const functionName = toolCall.function?.name?.trim() || `Call #${index + 1}`;
  
  const payload = {
    ...(toolCall.id && { id: toolCall.id }),
    ...(toolCall.type && { type: toolCall.type })
  };
  
  if (toolCall.function) {
    const fnPayload = {
      ...(toolCall.function.name && { name: toolCall.function.name })
    };
    
    // Parse arguments JSON
    if (toolCall.function.arguments) {
      try {
        fnPayload.arguments = JSON.parse(toolCall.function.arguments);
      } catch {
        fnPayload.arguments = toolCall.function.arguments; // Raw
      }
    }
    
    payload.function = fnPayload;
  }
  
  return {
    label: functionName,
    tooltip: JSON.stringify(payload, null, 2),
    copyValue: JSON.stringify(payload, null, 2)
  };
}
```

### Render Badges
```svelte
{#if config.showToolCalls && toolCalls?.length > 0}
  <div class="tool-calls-container">
    <Wrench class="icon" />
    <span>Tool calls:</span>
    
    {#each toolCalls as toolCall, index}
      {@const badge = formatToolCallBadge(toolCall, index)}
      <button
        class="tool-call-badge"
        title={badge.tooltip}
        onclick={() => copyToClipboard(badge.copyValue)}
      >
        {badge.label}
        <CopyIcon />
      </button>
    {/each}
  </div>
{/if}
```

---

## Streaming Aggregation

### Merge Tool Call Deltas
```typescript
const toolCallsMap = new Map<number, ApiChatCompletionToolCall>();

// On each chunk with tool_calls delta
chunk.choices[0].delta.tool_calls?.forEach(delta => {
  const index = delta.index ?? 0;
  const existing = toolCallsMap.get(index) || {};
  
  // Merge fields
  const merged = {
    ...existing,
    ...(delta.id && { id: delta.id }),
    ...(delta.type && { type: delta.type })
  };
  
  // Merge function
  if (delta.function) {
    merged.function = {
      ...existing.function,
      ...(delta.function.name && { name: delta.function.name })
    };
    
    // Concatenate arguments (streaming JSON)
    if (delta.function.arguments) {
      merged.function.arguments = 
        (existing.function?.arguments || '') + delta.function.arguments;
    }
  }
  
  toolCallsMap.set(index, merged);
});

// Convert to array for storage
const finalToolCalls = Array.from(toolCallsMap.values());
```

---

## Styling

```css
.tool-calls-container {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

.tool-call-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 12rem;
  padding: 0.375rem;
  background: hsl(var(--muted-foreground) / 0.15);
  border-radius: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: background 0.2s;
}

.tool-call-badge:hover {
  background: hsl(var(--muted-foreground) / 0.25);
}

.tool-call-badge--fallback {
  max-width: 20rem;
  white-space: normal;
  word-break: break-word;
}
```

---

## Error Handling

### Malformed JSON
- Try to parse `toolCalls` string
- If fails: Show raw string in fallback badge
- Label: Full raw content (no parsing)
- Still copyable

### Missing Fields
- Function name missing: Use "Call #{index}"
- Arguments missing: Show empty object `{}`
- ID missing: Don't show ID in payload

### Empty Tool Calls
- Don't render container if array is empty
- Don't crash if `toolCalls` is null/undefined

---

## Testing Considerations

### Unit Tests
1. Parse valid tool calls JSON
2. Handle malformed JSON (fallback)
3. Format badge with all fields
4. Format badge with missing fields
5. Aggregate streaming deltas

### Integration Tests
1. Receive tool call in stream → verify badge appears
2. Click badge → verify clipboard copy
3. Hover badge → verify tooltip shows
4. Multiple tool calls → verify all render

---

## Accessibility

### Keyboard
- Tab to badge buttons
- Enter/Space to copy
- Tooltip on focus

### Screen Reader
- Badge: "Tool call: {function_name}"
- On click: "Copied to clipboard"
- Tooltip: Read formatted JSON

---

_Updated: Phase tools completed_
