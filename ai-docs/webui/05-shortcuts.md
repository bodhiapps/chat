# Feature: Keyboard Shortcuts

> Priority: 5 | Status: Core Feature

---

## Overview

Keyboard shortcuts enable power users to navigate and control the chat interface without mouse interaction.

**Related docs**: [Chat](./02-chat.md) (message input), [Persistence](./07-persistence.md) (conversation search)

---

## Functional Requirements

### User Should Be Able To

1. **Navigate Conversations**
   - Open conversation search (Ctrl/Cmd+K)
   - Create new chat (Ctrl/Cmd+Shift+O)
   - Edit active conversation name (Ctrl/Cmd+Shift+E)

2. **Control Message Input**
   - Send message (Enter)
   - New line in message (Shift+Enter)
   - Focus input (automatic after actions)

3. **Manage Messages**
   - Exit search mode (Escape)
   - Stop generation (Enter on stop button focus)
   - Confirm edits (Enter in edit mode)

---

## Keyboard Shortcuts Table

| Shortcut | Action | Context | Behavior |
|----------|--------|---------|----------|
| **Ctrl/Cmd + K** | Search conversations | Global | Opens sidebar search, focuses input |
| **Ctrl/Cmd + Shift + O** | New chat | Global | Creates conversation, navigates to it |
| **Ctrl/Cmd + Shift + E** | Edit conversation | Global (sidebar) | Opens rename dialog for active conv |
| **Enter** | Send message | Chat textarea | Submits message, starts generation |
| **Shift + Enter** | New line | Chat textarea | Inserts line break |
| **Escape** | Exit search | Sidebar search | Clears search, returns to conv list |
| **Enter** | Confirm edit | Edit dialog | Saves conversation name |
| **Enter** | Stop generation | Stop button focused | Aborts active generation |

---

## Implementation

### Global Event Handler
```typescript
// In root layout component
window.addEventListener('keydown', (event) => {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey;
  
  // Ctrl/Cmd + K: Search
  if (isCtrlOrCmd && event.key === 'k') {
    event.preventDefault();
    openConversationSearch();
  }
  
  // Ctrl/Cmd + Shift + O: New Chat
  if (isCtrlOrCmd && event.shiftKey && event.key === 'O') {
    event.preventDefault();
    createNewConversation();
  }
  
  // Ctrl/Cmd + Shift + E: Edit
  if (isCtrlOrCmd && event.shiftKey && event.key === 'E') {
    event.preventDefault();
    openEditDialog();
  }
});
```

### Textarea Handler
```typescript
<textarea
  onKeyDown={(event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter: default behavior (newline)
  }}
/>
```

### Search Input Handler
```typescript
<input
  onKeyDown={(event) => {
    if (event.key === 'Escape') {
      clearSearch();
      closeSearchMode();
    }
  }}
/>
```

---

## Cross-Platform Support

### Modifier Key Detection
```typescript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modifierKey = isMac ? 'Cmd' : 'Ctrl';

// Display to user
<span>{modifierKey} + K</span>
```

### Event Handling
```typescript
const isModifier = event.ctrlKey || event.metaKey;
// Works on Windows (Ctrl) and Mac (Cmd)
```

---

## Accessibility

### Keyboard Focus
- Visible focus indicators
- Logical tab order
- Skip links for screen readers

### Screen Reader Announcements
- "Press Ctrl K to search"
- "Press Escape to exit search"
- "Shortcut activated: {action}"

---

## Testing Considerations

### Unit Tests
1. Ctrl/Cmd+K triggers search
2. Ctrl/Cmd+Shift+O creates chat
3. Enter sends message
4. Shift+Enter adds newline
5. Escape exits search

### Integration Tests
1. Keyboard-only navigation flow
2. Modifier key detection (Mac vs Windows)
3. Focus management after actions

---

_Updated: Phase shortcuts completed_
