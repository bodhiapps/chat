# Feature: Persistence

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

> Priority: 7 | Status: Core Feature | **Implementation: ✅ Full**

---

## Overview

Persistence layer uses IndexedDB (via Dexie ORM) to store conversations and messages locally with import/export capability for data portability.

**Related docs**: [Libraries](./libraries.md), [Settings](./06-settings.md), [Chat](./02-chat.md)

**Current Status**: Fully implemented with user-scoped storage, pinning, search, quota handling. Tree structure (branching) deferred.

---

## User Stories

- ✅ **As a user**, conversations persist locally so that I don't lose chat history on page refresh
  - ✅ Create new conversations
  - ✅ Rename conversations (inline edit in ConversationItem)
  - ✅ Delete conversations (with confirmation dialog)
  - ✅ View conversation list (sorted by recent)
  - ✅ Search conversations by title AND full-text message content
  - ✅ Pin conversations (toggle, sorted to top)

- 🔄 **As a user**, I can search conversations by title and message content so that I can find past discussions
  - ✅ All messages auto-saved to IndexedDB
  - ✅ Messages include content, model name
  - ❌ Messages include attachments, timings
  - ❌ Tree structure preserved (branching support deferred)
  - ✅ Model name saved per message

- ✅ **As a user**, I can pin important conversations so that they stay at the top of my list

- ✅ **As a user**, I can delete conversations so that I can clean up my history

- ❌ **As a user**, I can import/export conversations so that I can backup or transfer my data
  - ❌ Export single conversation as JSON
  - ❌ Export all conversations as JSON
  - ❌ Import conversation(s) from JSON file
  - ❌ Skip duplicate IDs on import

- ✅ **As a user**, the system handles storage quota so that the app doesn't crash when storage fills up

---

## Functional Requirements

### Conversation Management

**Behavior**: CRUD operations for conversations
- **Create**: New conversation with unique ID, timestamp
- **Read**: List all conversations (sorted by lastModified, pinned first)
- **Update**: Rename, update lastModified on message changes
- **Delete**: Remove conversation + all associated messages (cascading)
- **Pin**: Toggle pinned status, sort pinned to top
- **Search**: Full-text search across conversation titles and message content

**Edge Cases**:
- Storage quota exceeded → Auto-cleanup oldest unpinned conversations
- User switches → Filter conversations by userId
- No conversations → Show empty state

### Message Persistence

**Behavior**: Auto-save messages with relationships
- Save every message immediately to IndexedDB
- Link message to conversation via `convId` foreign key
- Track parent-child relationships (for future branching support)
- Save message metadata: role, content, model, timestamps, attachments, tool calls
- Update conversation lastModified on every message change

**Edge Cases**:
- Message with attachments → Store base64 in `extra` array
- Message with tool calls → Store as JSON string
- Partial streaming response → Save incremental updates

### Import/Export

**Behavior**: Portable JSON format for data backup/transfer
- **Export single**: Download conversation + messages as JSON file
- **Export all**: Download all conversations as JSON array
- **Import**: Load conversations from JSON file
- Skip duplicate conversation IDs on import
- Validate structure before importing

### User-Scoped Storage

**Behavior**: Isolate data by user
- Filter conversations by `userId` field
- Each user sees only their own conversations
- Support multiple users on same browser (if auth implemented)

---

## Data Model

### Entities

**Conversation**:
- `id` (string): UUID primary key
- `name` (string): Display name
- `lastModified` (number): Timestamp in milliseconds
- `currNode` (string | null): Active message ID
- `userId` (string): User who owns this conversation
- `isPinned` (boolean): Whether pinned to top

**Message**:
- `id` (string): UUID primary key
- `convId` (string): Foreign key to conversation
- `type` (enum): root | text | think | system
- `timestamp` (number): Creation time in milliseconds
- `role` (enum): user | assistant | system
- `content` (string): Message text
- `parent` (string | null): Parent message ID
- `children` (string[]): Array of child message IDs
- `thinking` (string): Reasoning/thinking content
- `toolCalls` (string, optional): JSON string of tool invocations
- `extra` (array, optional): Attachments (images, PDFs, etc.)
- `timings` (object, optional): Generation statistics
- `model` (string, optional): Model used for generation

### Relationships

- **Conversation has many Messages**: One-to-many via `convId`
- **Message has parent Message**: Self-referential via `parent`
- **Message has children Messages**: Self-referential via `children` array

### Storage

- **IndexedDB**: Database name `BodhiChat` (or `LlamacppWebui`)
- **Tables**: `conversations`, `messages`
- **Indexes**: `id` (primary), `lastModified`, `convId`, `timestamp`, `userId`

---

## Acceptance Criteria

### Scenario: Create and persist conversation

- **GIVEN** user starts new chat
- **WHEN** system creates conversation
- **THEN** conversation saved to IndexedDB with unique ID
- **AND** lastModified set to current timestamp
- **WHEN** user sends first message
- **THEN** message saved with convId linking to conversation

### Scenario: Search conversations

- **GIVEN** user has multiple conversations
- **WHEN** user types "math" in search box
- **THEN** conversations with "math" in title are shown
- **AND** conversations with "math" in any message content are shown
- **AND** search is case-insensitive

### Scenario: Pin conversation

- **GIVEN** user has unpinned conversation
- **WHEN** user clicks pin icon
- **THEN** conversation moves to top of list
- **AND** isPinned flag saved to IndexedDB
- **WHEN** user clicks pin icon again
- **THEN** conversation unpins and moves to chronological position

### Scenario: Delete conversation

- **GIVEN** user has conversation with messages
- **WHEN** user clicks delete button
- **AND** confirms deletion
- **THEN** conversation removed from IndexedDB
- **AND** all associated messages deleted (cascading)

### Scenario: Storage quota exceeded

- **GIVEN** IndexedDB storage quota reached
- **WHEN** user tries to save new message
- **THEN** system detects quota error
- **AND** automatically deletes oldest unpinned conversation
- **AND** retries save operation
- **AND** shows warning toast

### Scenario: Export conversation

- **GIVEN** user has conversation with messages
- **WHEN** user clicks "Export"
- **THEN** JSON file downloads with format `conversation_{id}_{name}.json`
- **AND** file contains conversation object + messages array

### Scenario: Import conversation

- **GIVEN** user has exported JSON file
- **WHEN** user selects file to import
- **THEN** system parses JSON
- **AND** validates structure
- **WHEN** conversation ID doesn't exist
- **THEN** conversation and messages imported
- **WHEN** conversation ID already exists
- **THEN** import skipped with message "Already exists"

---

## Reference Implementation

> **Svelte Source**: llama.cpp webui uses Dexie with Svelte 5. Adapt to React patterns.

**Key Files**:
- `$webui-folder/src/lib/services/database.ts` - Dexie schema, CRUD operations
- `$webui-folder/src/lib/stores/conversations.svelte.ts` - Conversation state management
- `$webui-folder/src/lib/types/database.d.ts` - Type definitions

> **Note**: Svelte `$state` should be adapted to React Context or state management library.

### Database Schema

```typescript
// Dexie schema definition
{
  conversations: 'id, lastModified, userId, isPinned',
  messages: 'id, convId, timestamp'
}
```

See `$webui-folder/src/lib/services/database.ts` for full schema.

### CRUD Algorithms

**Create Conversation**:
```
1. Generate UUID for conversation ID
2. Create conversation record with name, timestamp, userId
3. Insert into IndexedDB conversations table
4. Return conversation ID
```

**Delete Conversation (cascading)**:
```
1. Start transaction on conversations + messages tables
2. Query all messages where convId equals conversation ID
3. Delete all matching messages
4. Delete conversation record
5. Commit transaction
```

**Search Conversations**:
```
1. Get all conversations for current userId
2. Filter by title containing search query (case-insensitive)
3. Get all messages for userId
4. Filter messages by content containing search query
5. Get unique conversation IDs from matching messages
6. Merge results (conversations matching title OR having matching messages)
7. Return sorted by lastModified, pinned first
```

**Auto-cleanup on Quota**:
```
1. Catch QuotaExceededError on save
2. Get all unpinned conversations sorted by lastModified (oldest first)
3. Delete oldest conversation + messages
4. Retry save operation
5. If still failing, repeat cleanup
6. Show warning toast to user
```

### Import/Export Format

**Single Conversation JSON**:
```json
{
  "conv": {
    "id": "uuid",
    "name": "Math Help",
    "lastModified": 1704067200000
  },
  "messages": [
    {
      "id": "msg-1",
      "convId": "uuid",
      "role": "user",
      "content": "What is 2+2?",
      "timestamp": 1704067200000
    }
  ]
}
```

**Multiple Conversations**: Array of above objects

See `$webui-folder/src/lib/services/database.ts` for import/export implementation.

---

## Verification

**Manual Testing**:
1. Create conversation → Send message → Refresh page → Verify conversation persists
2. Create 5 conversations → Search for keyword → Verify filtered list
3. Pin conversation → Verify moves to top → Unpin → Verify returns to chronological
4. Delete conversation with messages → Verify both conversation and messages removed
5. Fill storage → Send message → Verify oldest unpinned conversation auto-deleted
6. Export conversation → Import → Verify data matches
7. Import existing conversation → Verify skipped with message

---

_Updated: Revised for functional focus, reduced code ratio_
