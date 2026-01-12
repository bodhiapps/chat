# Feature: Keyboard Shortcuts

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

> Priority: 5 | Status: Core Feature | **Implementation: ❌ Minimal**

---

## Overview

Keyboard shortcuts enable power users to navigate and control the chat interface without mouse interaction.

**Related docs**: [Chat](./02-chat.md), [Persistence](./07-persistence.md)

**Current Status**: Only Enter to send message implemented. Search modal exists but no Ctrl+K shortcut.

---

## User Stories

- ❌ **As a user**, I can press Ctrl/Cmd+K to search conversations so that I can quickly find past chats

- ✅ **As a user**, I can press Enter to send messages so that I don't need to click the send button

- ❌ **As a user**, I can press Shift+Enter for new lines so that I can write multi-line messages

- ❌ **As a user**, I can press Ctrl/Cmd+Shift+O to create new chats so that I can start conversations quickly

- ❌ **As a user**, I can press Escape to exit search mode so that I can return to the conversation list

---

## Functional Requirements

### Global Shortcuts

**Behavior**: Work from anywhere in the application
- **Ctrl/Cmd + K**: Open conversation search modal, focus search input
- **Ctrl/Cmd + Shift + O**: Create new conversation, navigate to it
- **Ctrl/Cmd + Shift + E**: Open rename dialog for active conversation

**Edge Cases**:
- Shortcuts disabled when input fields focused (except textarea shortcuts)
- Prevent browser default behaviors (e.g., Ctrl+K normally focuses browser search)

### Textarea Shortcuts

**Behavior**: Work when chat textarea is focused
- **Enter**: Send message (if textarea not empty)
- **Shift + Enter**: Insert newline (default textarea behavior)

**Edge Cases**:
- Enter disabled when message is empty
- Enter disabled when generation in progress (stop button shown instead)

### Search Shortcuts

**Behavior**: Work when search input is focused
- **Escape**: Clear search query, exit search mode, return to conversation list

### Cross-Platform Support

**Behavior**: Adapt to platform conventions
- **Windows/Linux**: Use Ctrl key
- **Mac**: Use Cmd (⌘) key
- Display correct modifier key in UI based on platform

---

## Keyboard Shortcuts Reference

| Shortcut | Status | Action | Context | Behavior |
|----------|--------|--------|---------|----------|
| **Ctrl/Cmd + K** | ❌ | Search conversations | Global | Opens search modal, focuses input |
| **Ctrl/Cmd + Shift + O** | ❌ | New chat | Global | Creates conversation, navigates to it |
| **Ctrl/Cmd + Shift + E** | ❌ | Edit conversation name | Global | Opens rename dialog for active conv |
| **Enter** | ✅ | Send message | Chat textarea | Submits message, starts generation |
| **Shift + Enter** | ❌ | New line | Chat textarea | Inserts line break |
| **Escape** | ❌ | Exit search | Search input | Clears search, returns to list |
| **Enter** | ❌ | Confirm edit | Edit dialog | Saves conversation name |

---

## Acceptance Criteria

### Scenario: Open conversation search

- **GIVEN** user is viewing the chat interface
- **WHEN** user presses Ctrl/Cmd+K
- **THEN** conversation search modal opens
- **AND** search input is focused
- **AND** browser's default Ctrl+K behavior is prevented

### Scenario: Send message with Enter

- **GIVEN** user has typed message in textarea
- **WHEN** user presses Enter (without Shift)
- **THEN** message is sent to API
- **AND** textarea is cleared
- **AND** focus remains in textarea

### Scenario: Multi-line message with Shift+Enter

- **GIVEN** user is typing in textarea
- **WHEN** user presses Shift+Enter
- **THEN** newline is inserted at cursor position
- **AND** message is NOT sent

### Scenario: Create new chat

- **GIVEN** user is viewing any page
- **WHEN** user presses Ctrl/Cmd+Shift+O
- **THEN** new conversation is created
- **AND** user is navigated to new conversation
- **AND** textarea is focused

### Scenario: Exit search mode

- **GIVEN** user has opened conversation search (Ctrl+K)
- **WHEN** user presses Escape
- **THEN** search query is cleared
- **AND** search modal closes
- **AND** focus returns to previous element

---

## Reference Implementation

> **Svelte Source**: llama.cpp webui implements shortcuts in layout component. Adapt to React patterns.

**Key Files**:
- `$webui-folder/src/routes/+layout.svelte` - Global keyboard event handlers
- `$webui-folder/src/lib/components/app/chat/ChatForm/InputArea.tsx:71` - Enter to send (existing implementation)

> **Note**: Svelte event binding should be adapted to React event handlers.

### Event Handler Patterns

**Global shortcuts**:
```
1. Add keydown listener to window in root component
2. Check for modifier keys (event.ctrlKey || event.metaKey)
3. Check for specific key (event.key === 'k')
4. Prevent default browser behavior
5. Execute action (open modal, create chat, etc.)
```

**Textarea shortcuts**:
```
1. onKeyDown handler on textarea element
2. Check event.key === 'Enter' && !event.shiftKey
3. Prevent default (don't insert newline)
4. Call handleSendMessage()
```

**Modifier key detection**:
```
1. Detect platform: navigator.platform.includes('Mac')
2. Display: Show "⌘" on Mac, "Ctrl" on Windows/Linux
3. Handle: Check both event.ctrlKey and event.metaKey
```

See `$webui-folder/src/routes/+layout.svelte` for global shortcut implementation.

---

## Accessibility

**Keyboard Focus**:
- Visible focus indicators on all interactive elements
- Logical tab order maintained
- Focus managed after shortcut actions

**Screen Reader**:
- Announce shortcut activation: "Search opened"
- Provide shortcut hints in tooltips
- Document shortcuts in help/settings page

---

## Verification

**Manual Testing**:
1. Press Ctrl/Cmd+K → Verify search modal opens
2. Type in textarea, press Enter → Verify message sends
3. Type in textarea, press Shift+Enter → Verify newline inserted
4. Press Ctrl/Cmd+Shift+O → Verify new chat created
5. Open search, press Escape → Verify search closes
6. Test on both Mac and Windows/Linux → Verify correct modifier keys

---

_Updated: Revised for functional focus, reduced code ratio_
