# Feature: Tool Calls Display

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

> Priority: 4 | Status: Core Feature | **Implementation: 🔄 Schema Only**

---

## Overview

Tool call display shows function/tool invocations made by AI models, rendering them as clickable badges with formatted JSON payloads.

**Related docs**: [API Reference](./api-reference.md), [Chat](./02-chat.md), [Settings](./06-settings.md)

**Current Status**: Schema has `MessageExtra.tool_calls?: unknown[]` defined, but no parsing or display UI.

---

## User Stories

- ❌ **As a user**, I can see tool call badges below assistant messages so that I know which functions the AI called

- ❌ **As a user**, I can click badges to copy JSON payloads so that I can debug or inspect the details

- ❌ **As a user**, I can hover badges to see formatted JSON so that I understand the function arguments

- ❌ **As a user**, the system distinguishes multiple tool calls so that I can identify each function invocation

---

## Functional Requirements

### Tool Call Display

**Behavior**: Show function invocations as badges
- Badges appear below assistant message content
- Function name displayed as badge label
- Wrench icon prefix
- Multiple badges shown in flex row (wraps to multiple lines)
- Label: "Tool calls:" prefix

**Visibility**:
- Only shown if `showToolCalls` setting enabled
- Hidden if message has no tool calls

**Edge Cases**:
- Function name missing → Show "Call #N" as fallback
- Malformed JSON → Show raw string in fallback badge
- Empty tool calls array → Don't render container

### Badge Interaction

**Behavior**: User can interact with badges
- Hover → Show tooltip with formatted JSON (pretty-printed)
- Click → Copy full JSON payload to clipboard
- Long function names → Truncate with ellipsis (max width 12rem)

---

## Data Model

**API Format** (streaming delta):
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

**Storage Format** (in DatabaseMessage):
```typescript
{
  toolCalls: '[{"id":"call_123","type":"function","function":{"name":"search","arguments":"{\\"query\\":\\"weather\\"}"}}]'
}
```

**Display Format**:
```typescript
interface ToolCallBadge {
  label: string;      // Function name or "Call #N"
  tooltip: string;    // Pretty JSON
  copyValue: string;  // Full JSON for clipboard
}
```

---

## Acceptance Criteria

### Scenario: View tool call badges

- **GIVEN** assistant message has tool calls
- **WHEN** `showToolCalls` setting is enabled
- **THEN** tool call badges appear below message content
- **AND** each badge shows function name as label
- **AND** wrench icon appears before badges

### Scenario: Copy tool call payload

- **GIVEN** tool call badge is displayed
- **WHEN** user clicks badge
- **THEN** formatted JSON payload is copied to clipboard
- **AND** toast notification shows "Copied to clipboard"

### Scenario: View formatted JSON tooltip

- **GIVEN** tool call badge is displayed
- **WHEN** user hovers over badge
- **THEN** tooltip appears with pretty-printed JSON
- **AND** JSON includes id, type, function name, and parsed arguments

### Scenario: Handle multiple tool calls

- **GIVEN** assistant message has 3 tool calls
- **WHEN** message is displayed
- **THEN** 3 separate badges appear
- **AND** each badge shows correct function name
- **AND** badges wrap to multiple lines if needed

### Scenario: Handle malformed JSON

- **GIVEN** stored tool calls JSON is invalid
- **WHEN** rendering tool calls
- **THEN** fallback badge displays raw string
- **AND** badge is still clickable to copy raw content
- **AND** no error is thrown

---

## Reference Implementation

> **Svelte Source**: llama.cpp webui uses Svelte 5. Adapt to React patterns.

**Key Files**:
- `$webui-folder/src/lib/components/app/chat/ChatMessages/ToolCallsBadge.svelte` - Badge component
- `$webui-folder/src/lib/stores/chat.svelte.ts` - Tool call aggregation during streaming

> **Note**: Svelte patterns should be adapted to React (`useState`, `useEffect`).

### Streaming Aggregation Algorithm

```
1. Initialize Map<index, ToolCall> for tracking tool calls by index
2. For each streaming chunk with delta.tool_calls:
   - For each delta in array:
     - Get index (default 0)
     - Get existing tool call from map or create empty object
     - Merge fields: id, type
     - If delta.function exists:
       - Merge function.name
       - Concatenate function.arguments (streaming JSON string)
     - Store merged tool call back to map
3. On stream complete: convert map to array
4. Stringify array and save to database
```

See `$webui-folder/src/lib/stores/chat.svelte.ts` for delta merging implementation.

### Badge Formatting Algorithm

```
1. Parse stored tool calls JSON string
2. If parse fails: return fallback badge with raw string
3. For each tool call:
   - Extract function name or use "Call #N" as fallback
   - Build payload object with id, type, function
   - Try to parse function.arguments JSON
   - Pretty-print payload JSON for tooltip
   - Return: { label, tooltip, copyValue }
```

### UI Component Structure

```
<ToolCallsContainer>
  <WrenchIcon />
  <span>Tool calls:</span>
  {toolCalls.map((tc, i) =>
    <ToolCallBadge
      label={formatLabel(tc, i)}
      tooltip={formatTooltip(tc)}
      onClick={() => copyToClipboard(tc)}
    />
  )}
</ToolCallsContainer>
```

---

## Styling Notes

**Tool Calls Container**:
- Inline-flex with gap, flex-wrap
- Muted text color
- Small font size (0.75rem)

**Badge**:
- Inline-flex pill button
- Max width 12rem, ellipsis for overflow
- Muted background (15% opacity)
- Hover: increase background opacity (25%)
- Padding 0.375rem, rounded corners

See `$webui-folder/src/lib/components/app/chat/ChatMessages/ToolCallsBadge.svelte` for styling.

---

## Accessibility

**Keyboard Navigation**:
- Tab to badge buttons
- Enter/Space to copy
- Tooltip on focus

**Screen Reader**:
- Badge: "Tool call: {function_name}"
- On click: "Copied to clipboard"

---

## Verification

**Manual Testing**:
1. Send message that triggers tool call → Verify badge appears
2. Click badge → Verify JSON copied to clipboard
3. Hover badge → Verify tooltip shows formatted JSON
4. Send message with multiple tool calls → Verify all badges render
5. Disable `showToolCalls` setting → Verify badges hidden

---

_Updated: Revised for functional focus, reduced code ratio_
