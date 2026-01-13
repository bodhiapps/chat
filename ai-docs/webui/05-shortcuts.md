# Feature: Keyboard Shortcuts

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

> Priority: 5 | Status: Core Feature | **Implementation: 🔄 Partial**

---

## Overview

Keyboard shortcuts enable power users to navigate and control the chat interface without mouse interaction.

**Related docs**: [Chat](./02-chat.md), [Persistence](./07-persistence.md)

**Current Status**: Core shortcuts implemented (2026-01-13): Ctrl/Cmd+K for search, Ctrl/Cmd+Shift+O for new chat, Escape to close modals, ? for shortcuts guide.

---

## User Stories

- ✅ **As a user**, I can press Ctrl/Cmd+K to search conversations so that I can quickly find past chats

- ✅ **As a user**, I can press Enter to send messages so that I don't need to click the send button

- ✅ **As a user**, I can press Shift+Enter for new lines so that I can write multi-line messages

- ✅ **As a user**, I can press Ctrl/Cmd+Shift+O to create new chats so that I can start conversations quickly

- ✅ **As a user**, I can press Escape to exit search mode so that I can return to the conversation list

- ✅ **As a user**, I can press ? to view keyboard shortcuts so that I can learn available shortcuts

---

## Functional Requirements

### Global Shortcuts

**Status**: ✅ Implemented (2026-01-13)

**Behavior**: Work from anywhere in the application
- **Ctrl/Cmd + K**: Open conversation search modal, focus search input
  - Works even when chat input is focused
  - Prevents browser default behavior
- **Ctrl/Cmd + Shift + O**: Create new conversation, navigate to it
  - Works even when chat input is focused
  - Clears messages and creates fresh conversation
- **Ctrl/Cmd + Shift + E**: ❌ Not implemented - Open rename dialog for active conversation
- **Escape**: Close open modals (search, settings, delete confirmation, keyboard shortcuts guide)
- **/**: Focus chat input (only when not already in an input field)
- **?**: Show keyboard shortcuts guide (only when not already in an input field)

**Implementation**: `src/hooks/useKeyboardShortcuts.ts`

**Edge Cases**:
- Global shortcuts (Ctrl+K, Ctrl+Shift+O) work even when input fields are focused
- Focus shortcut (/) only works when not in input/textarea/contentEditable
- Escape delegates to active modal's close handler
- Prevent browser default behaviors (e.g., Ctrl+K normally focuses browser search)

### Textarea Shortcuts

**Status**: ✅ Implemented (2026-01-13)

**Behavior**: Work when chat textarea is focused
- **Enter**: Send message (if textarea not empty)
- **Shift + Enter**: Insert newline (default textarea behavior)

**Implementation**: `src/components/chat/InputArea.tsx`

**Edge Cases**:
- Enter disabled when message is empty
- Enter disabled when generation in progress (stop button shown instead)
- Visual hint shown below textarea: "Shift + Enter for new line"

### Modal Shortcuts

**Status**: ✅ Implemented (2026-01-13)

**Behavior**: Work when modals are open
- **Escape**: Close active modal (search, settings, delete confirmation)
  - Search modal: Clears and closes
  - Other modals: Just closes

**Implementation**: Modal components handle Escape via dialog onOpenChange handlers

### Cross-Platform Support

**Status**: ✅ Implemented (2026-01-13)

**Behavior**: Adapt to platform conventions
- **Windows/Linux**: Use Ctrl key
- **Mac**: Use Cmd (⌘) key
- **Display**: Show correct modifier key in UI tooltips and placeholders
  - Detect via `navigator.platform.includes('Mac')`
  - Display "⌘" on Mac, "Ctrl" on Windows/Linux
- **Handle**: Check both `event.ctrlKey` and `event.metaKey` for modifier

**Implementation**:
- `src/hooks/useKeyboardShortcuts.ts` - Event handler checks both keys
- `src/components/chat/ConversationSidebar.tsx` - Tooltips with platform key
- `src/components/chat/SearchModal.tsx` - Placeholder with platform key

---

## Keyboard Shortcuts Reference

| Shortcut | Status | Action | Context | Behavior |
|----------|--------|--------|---------|----------|
| **Ctrl/Cmd + K** | ✅ | Search conversations | Global | Opens search modal, focuses input |
| **Ctrl/Cmd + Shift + O** | ✅ | New chat | Global | Creates conversation, navigates to it |
| **Ctrl/Cmd + Shift + E** | ❌ | Edit conversation name | Global | Opens rename dialog for active conv |
| **?** | ✅ | Keyboard shortcuts guide | Global | Opens shortcuts reference modal |
| **/** | ✅ | Focus input | Global | Focuses chat textarea |
| **Enter** | ✅ | Send message | Chat textarea | Submits message, starts generation |
| **Shift + Enter** | ✅ | New line | Chat textarea | Inserts line break |
| **Escape** | ✅ | Exit modals | Global | Closes modals (search, shortcuts, etc.) |
| **Enter** | ✅ | Save edit | Message editing | Saves edited message content |
| **Escape** | ✅ | Cancel edit | Message editing | Discards changes, exits edit mode |

---

## Acceptance Criteria

### Scenario: Open conversation search ✅

- **GIVEN** user is viewing the chat interface
- **WHEN** user presses Ctrl/Cmd+K
- **THEN** conversation search modal opens
- **AND** search input is focused
- **AND** browser's default Ctrl+K behavior is prevented
- **AND** shortcut hint appears in search placeholder (e.g., "Search all messages... (⌘+K)")

**E2E Coverage**: `e2e/keyboard-shortcuts.spec.ts`
- Ctrl/Cmd+K opens search modal
- Search input auto-focused
- Platform modifier key shown in placeholder

### Scenario: Send message with Enter ✅

- **GIVEN** user has typed message in textarea
- **WHEN** user presses Enter (without Shift)
- **THEN** message is sent to API
- **AND** textarea is cleared
- **AND** focus remains in textarea
- **AND** visual hint shows "Shift + Enter for new line"

**Note**: This behavior is core to chat input and is tested extensively in chat flow tests.

### Scenario: Multi-line message with Shift+Enter ✅

- **GIVEN** user is typing in textarea
- **WHEN** user presses Shift+Enter
- **THEN** newline is inserted at cursor position
- **AND** message is NOT sent
- **AND** textarea auto-grows (up to max height 200px)

**Note**: This behavior is core to chat input and is tested extensively in chat flow tests.

### Scenario: Create new chat ✅

- **GIVEN** user is viewing any page
- **WHEN** user presses Ctrl/Cmd+Shift+O
- **THEN** new conversation is created
- **AND** message list is cleared (shows empty state)
- **AND** conversation ID is set to null
- **AND** focus remains available for next action
- **AND** tooltip hint shows on "New chat" button (e.g., "New chat (⌘+Shift+O)")

**E2E Coverage**: `e2e/keyboard-shortcuts.spec.ts`
- Ctrl/Cmd+Shift+O creates new conversation
- Message count resets to 0
- Works even when chat input is focused

### Scenario: Exit search mode ✅

- **GIVEN** user has opened conversation search (Ctrl+K)
- **WHEN** user presses Escape
- **THEN** search modal closes
- **AND** focus returns to previous element (or body)

**E2E Coverage**: `e2e/keyboard-shortcuts.spec.ts`
- Escape closes search modal
- Modal visibility state changes

### Scenario: View keyboard shortcuts guide ✅

- **GIVEN** user is viewing the chat interface
- **WHEN** user presses ? (question mark)
- **THEN** keyboard shortcuts guide modal opens
- **AND** comprehensive list of all shortcuts is displayed
- **AND** shortcuts are grouped by category (Global, Chat, Message Editing)
- **AND** platform-specific modifier keys are shown
- **WHEN** user presses Escape
- **THEN** keyboard shortcuts guide modal closes

**E2E Coverage**: `e2e/keyboard-shortcuts.spec.ts`
- ? opens keyboard shortcuts guide
- Guide displays all shortcuts
- Escape closes keyboard shortcuts guide

---

## Implementation Details

**Status**: ✅ Fully Implemented (2026-01-13)

**Architecture**:
- **Hook**: `src/hooks/useKeyboardShortcuts.ts` - Global keyboard event handler
- **Integration**: `src/components/Layout.tsx` - Hook initialization with callbacks
- **Textarea**: `src/components/chat/InputArea.tsx` - Local Enter/Shift+Enter handling
- **UI Hints**: Platform modifier keys shown in tooltips and placeholders

### Implementation Files

**Global Shortcuts Hook** (`src/hooks/useKeyboardShortcuts.ts`):
```typescript
interface UseKeyboardShortcutsOptions {
  onOpenSearch: () => void;
  onNewConversation: () => void;
  onFocusInput?: () => void;
  onShowShortcuts?: () => void;
  onEscape?: () => void;
}

// Event handler pattern:
// 1. Detect modifier (event.metaKey || event.ctrlKey)
// 2. Check specific key (event.key.toLowerCase() or event.key === '?')
// 3. Prevent default browser behavior
// 4. Execute callback action
// 5. Skip certain shortcuts when in input fields (/, ?)
```

**Layout Integration** (`src/components/Layout.tsx`):
```typescript
useKeyboardShortcuts({
  onOpenSearch: handleOpenSearch,          // Opens search modal
  onNewConversation: startNewConversation, // Clears chat state
  onFocusInput: handleFocusInput,          // Focuses chat textarea
  onShowShortcuts: handleShowShortcuts,    // Opens shortcuts guide
  onEscape: handleEscape,                  // Closes active modal (priority order)
});
```

**Textarea Handler** (`src/components/chat/InputArea.tsx`):
```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
  // Shift+Enter: default behavior (insert newline)
};
```

**Platform Detection** (multiple components):
```typescript
function getPlatformModifierKey(): string {
  return navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl';
}
// Used in: ConversationSidebar, SearchModal tooltips/placeholders
```

### Reference Implementation

> **Svelte Source**: llama.cpp webui implements shortcuts in layout component (`$webui-folder/src/routes/+layout.svelte`).
> 
> **React Adaptation**: We use a custom hook (`useKeyboardShortcuts`) instead of inline event handlers, providing better separation of concerns and testability.

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

**E2E Test Coverage**: `e2e/keyboard-shortcuts.spec.ts`
- ✅ Ctrl/Cmd+K opens search modal
- ✅ Escape closes search modal  
- ✅ Ctrl/Cmd+Shift+O creates new conversation
- ✅ Shortcuts work when chat input is focused
- ✅ Platform modifier key shown in placeholders and tooltips

**Manual Testing**:
1. Press Ctrl/Cmd+K → Verify search modal opens → Verify input focused
2. Press Escape in search → Verify modal closes
3. Press ? → Verify shortcuts guide opens → Verify all shortcuts listed
4. Press Escape in shortcuts guide → Verify modal closes
5. Type in textarea, press Enter → Verify message sends
6. Type in textarea, press Shift+Enter → Verify newline inserted
7. Press Ctrl/Cmd+Shift+O → Verify new chat created → Verify empty state shown
8. Press / (not in input) → Verify chat input focused
9. Test on both Mac and Windows/Linux → Verify correct modifier keys (⌘ vs Ctrl)

---

_Updated: 2026-01-13 - Implementation complete with E2E coverage_
