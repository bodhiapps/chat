# Feature: Persistence

> Priority: 7 | Status: Core Feature

---

## Overview

Persistence layer uses IndexedDB (via Dexie) to store conversations and messages locally with import/export capability for data portability.

**Related docs**: [Libraries](./libraries.md) (Dexie), [Settings](./06-settings.md) (localStorage usage), [Chat](./02-chat.md) (message structure)

---

## Functional Requirements

### User Should Be Able To

1. **Manage Conversations**
   - Create new conversations
   - Rename conversations
   - Delete conversations (with confirmation)
   - View conversation list (sorted by recent)
   - Search conversations by title

2. **Persist Messages**
   - All messages auto-saved to IndexedDB
   - Messages include content, attachments, timings
   - Tree structure preserved (branching support deferred)
   - Model name saved per message

3. **Import/Export**
   - Export single conversation as JSON
   - Export all conversations as JSON
   - Import conversation(s) from JSON file
   - Skip duplicate IDs on import

4. **Data Portability**
   - Standard JSON format
   - Human-readable structure
   - Cross-device compatible
   - Backup and restore capability

---

## System Should

1. **Store Locally**
   - Use IndexedDB for persistence
   - Auto-save every message
   - Update on every edit
   - Handle quota exceeded errors

2. **Maintain Relationships**
   - Link messages to conversations (foreign key)
   - Track active message (currNode)
   - Support parent-child relationships (for future branching)
   - Preserve chronological order

3. **Manage Lifecycle**
   - Create conversation with root message
   - Update lastModified on any change
   - Cascade delete (conversation → messages)
   - Clean up orphaned data

---

## Database Schema

### Database Name
`LlamacppWebui` (Dexie ORM)

### Tables

#### Conversations Table
```typescript
conversations: 'id, lastModified, currNode, name'

interface DatabaseConversation {
  id: string;              // UUID primary key
  name: string;            // Display name
  lastModified: number;    // Timestamp (ms)
  currNode: string | null; // Active message ID
}
```

**Indexes**:
- `id` (primary key)
- `lastModified` (for sorting)

#### Messages Table
```typescript
messages: 'id, convId, type, role, timestamp, parent, children'

interface DatabaseMessage {
  id: string;                      // UUID primary key
  convId: string;                  // Foreign key
  type: 'root' | 'text' | 'think' | 'system';
  timestamp: number;               // Creation time (ms)
  role: 'user' | 'assistant' | 'system';
  content: string;                 // Message text
  parent: string | null;           // Parent message ID
  thinking: string;                // Reasoning content
  toolCalls?: string;              // JSON string
  children: string[];              // Child message IDs
  extra?: DatabaseMessageExtra[];  // Attachments
  timings?: ChatMessageTimings;    // Generation stats
  model?: string;                  // Model used
}
```

**Indexes**:
- `id` (primary key)
- `convId` (foreign key)
- `timestamp` (for ordering)

---

## CRUD Operations

### Create Conversation
```typescript
async function createConversation(name: string): Promise<string> {
  const id = generateUUID();
  await db.conversations.add({
    id,
    name,
    lastModified: Date.now(),
    currNode: null
  });
  
  // Create root message (tree anchor)
  const rootId = await createRootMessage(id);
  
  return id;
}
```

### Read Conversations
```typescript
async function getAllConversations(): Promise<DatabaseConversation[]> {
  return db.conversations
    .orderBy('lastModified')
    .reverse() // Newest first
    .toArray();
}
```

### Update Conversation
```typescript
async function updateConversation(id: string, updates: Partial<DatabaseConversation>) {
  await db.conversations.update(id, {
    ...updates,
    lastModified: Date.now() // Auto-update timestamp
  });
}
```

### Delete Conversation
```typescript
async function deleteConversation(id: string): Promise<void> {
  await db.transaction('rw', db.conversations, db.messages, async () => {
    // Delete all messages
    await db.messages.where('convId').equals(id).delete();
    // Delete conversation
    await db.conversations.delete(id);
  });
}
```

---

## Message Operations

### Create Message
```typescript
async function createMessage(message: Omit<DatabaseMessage, 'id'>): Promise<string> {
  const id = generateUUID();
  
  await db.transaction('rw', db.messages, db.conversations, async () => {
    // Insert message
    await db.messages.add({ ...message, id });
    
    // Update parent's children
    if (message.parent) {
      const parent = await db.messages.get(message.parent);
      if (parent) {
        await db.messages.update(message.parent, {
          children: [...parent.children, id]
        });
      }
    }
    
    // Update conversation currNode
    await db.conversations.update(message.convId, {
      currNode: id,
      lastModified: Date.now()
    });
  });
  
  return id;
}
```

### Update Message
```typescript
async function updateMessage(id: string, updates: Partial<DatabaseMessage>) {
  await db.messages.update(id, updates);
  
  // Update conversation timestamp
  const message = await db.messages.get(id);
  if (message) {
    await db.conversations.update(message.convId, {
      lastModified: Date.now()
    });
  }
}
```

### Delete Message (Cascading)
```typescript
async function deleteMessageCascading(convId: string, messageId: string): Promise<string[]> {
  // Find all descendants
  const messages = await db.messages.where('convId').equals(convId).toArray();
  const descendants = findDescendantMessages(messages, messageId);
  const toDelete = [messageId, ...descendants];
  
  await db.transaction('rw', db.messages, async () => {
    // Remove from parent's children
    const message = messages.find(m => m.id === messageId);
    if (message?.parent) {
      const parent = await db.messages.get(message.parent);
      if (parent) {
        await db.messages.update(message.parent, {
          children: parent.children.filter(id => id !== messageId)
        });
      }
    }
    
    // Delete all
    await db.messages.bulkDelete(toDelete);
  });
  
  return toDelete;
}
```

---

## Import/Export Format

### Single Conversation Export
```json
{
  "conv": {
    "id": "abc-123",
    "name": "Math Help",
    "lastModified": 1704067200000,
    "currNode": "msg-456"
  },
  "messages": [
    {
      "id": "root-001",
      "convId": "abc-123",
      "type": "root",
      "timestamp": 1704067200000,
      "role": "system",
      "content": "",
      "parent": null,
      "children": ["msg-001"],
      "thinking": "",
      "toolCalls": ""
    },
    {
      "id": "msg-001",
      "convId": "abc-123",
      "type": "text",
      "timestamp": 1704067201000,
      "role": "user",
      "content": "What is 2+2?",
      "parent": "root-001",
      "children": ["msg-002"],
      "thinking": "",
      "extra": []
    },
    {
      "id": "msg-002",
      "convId": "abc-123",
      "type": "text",
      "timestamp": 1704067202000,
      "role": "assistant",
      "content": "2+2 equals 4",
      "parent": "msg-001",
      "children": [],
      "thinking": "Let me calculate...",
      "timings": {
        "prompt_n": 10,
        "predicted_n": 5,
        "predicted_ms": 250
      },
      "model": "llama-3"
    }
  ]
}
```

### Multiple Conversations Export
```json
[
  { "conv": {...}, "messages": [...] },
  { "conv": {...}, "messages": [...] }
]
```

---

## Import/Export Implementation

### Export Single
```typescript
async function exportConversation(convId: string) {
  const conv = await db.conversations.get(convId);
  const messages = await db.messages.where('convId').equals(convId).toArray();
  
  const data = { conv, messages };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  
  const filename = `conversation_${convId}_${sanitize(conv.name)}.json`;
  downloadBlob(blob, filename);
}
```

### Export All
```typescript
async function exportAll() {
  const conversations = await db.conversations.toArray();
  const exports = [];
  
  for (const conv of conversations) {
    const messages = await db.messages.where('convId').equals(conv.id).toArray();
    exports.push({ conv, messages });
  }
  
  const json = JSON.stringify(exports, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const filename = `all_conversations_${formatDate(new Date())}.json`;
  downloadBlob(blob, filename);
}
```

### Import
```typescript
async function importConversations(): Promise<{ imported: number; skipped: number }> {
  const file = await openFilePicker('.json');
  const text = await file.text();
  const data = JSON.parse(text);
  
  // Handle both single and array format
  const items = Array.isArray(data) ? data : [data];
  
  let imported = 0;
  let skipped = 0;
  
  await db.transaction('rw', db.conversations, db.messages, async () => {
    for (const item of items) {
      const { conv, messages } = item;
      
      // Skip if conversation already exists
      const existing = await db.conversations.get(conv.id);
      if (existing) {
        skipped++;
        continue;
      }
      
      // Import conversation
      await db.conversations.add(conv);
      
      // Import messages
      await db.messages.bulkAdd(messages);
      
      imported++;
    }
  });
  
  return { imported, skipped };
}
```

---

## Tree Structure (Branching Support)

### Current Implementation
- **Root message**: Type `'root'`, not displayed, acts as tree anchor
- **Parent-child links**: Each message has `parent` field and `children` array
- **currNode**: Points to active message in branch
- **Branch navigation**: Deferred (not implemented in UI yet)

### Message Relationships
```
root (parent: null)
  └── user-msg-1 (parent: root, children: [assist-msg-1])
       └── assist-msg-1 (parent: user-msg-1, children: [user-msg-2])
            └── user-msg-2 (parent: assist-msg-1, children: [])
```

### Get Active Messages
```typescript
function filterByLeafNode(messages: DatabaseMessage[], leafNodeId: string): DatabaseMessage[] {
  // Trace back from leaf to root via parent chain
  const path: DatabaseMessage[] = [];
  let current = messages.find(m => m.id === leafNodeId);
  
  while (current) {
    path.unshift(current);
    if (!current.parent) break;
    current = messages.find(m => m.id === current.parent);
  }
  
  // Filter out root message
  return path.filter(m => m.type !== 'root');
}
```

---

## Search Implementation

### Title Search (Current)
```typescript
async function searchConversations(query: string): Promise<DatabaseConversation[]> {
  const all = await db.conversations.toArray();
  const lowerQuery = query.toLowerCase();
  
  return all.filter(conv => 
    conv.name.toLowerCase().includes(lowerQuery)
  ).sort((a, b) => b.lastModified - a.lastModified);
}
```

### Full-Text Search (Future Enhancement)
```typescript
async function searchMessages(query: string): Promise<SearchResult[]> {
  const allMessages = await db.messages.toArray();
  const matches = allMessages.filter(msg =>
    msg.content.toLowerCase().includes(query.toLowerCase())
  );
  
  // Group by conversation
  const grouped = matches.reduce((acc, msg) => {
    if (!acc[msg.convId]) acc[msg.convId] = [];
    acc[msg.convId].push(msg);
    return acc;
  }, {});
  
  return Object.entries(grouped).map(([convId, messages]) => ({
    conversationId: convId,
    matches: messages
  }));
}
```

---

## Error Handling

### Quota Exceeded
```typescript
try {
  await db.messages.add(message);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    toast.error('Storage quota exceeded. Please delete old conversations.');
  }
}
```

### Transaction Failures
```typescript
try {
  await db.transaction('rw', db.conversations, db.messages, async () => {
    // Operations...
  });
} catch (error) {
  console.error('Transaction failed:', error);
  toast.error('Failed to save changes');
}
```

### Import Errors
```typescript
try {
  const result = await importConversations();
  toast.success(`Imported ${result.imported}, skipped ${result.skipped}`);
} catch (error) {
  toast.error('Import failed: Invalid file format');
}
```

---

## Testing Considerations

### Unit Tests
1. CRUD operations (create, read, update, delete)
2. Cascading delete (message + descendants)
3. Parent-child relationships
4. Export format (single, multiple)
5. Import format validation

### Integration Tests
1. Create conversation → verify in IndexedDB
2. Send message → verify persisted
3. Delete conversation → verify cascade
4. Export → import → verify data integrity
5. Quota exceeded → verify error handling

---

## Accessibility

Not directly user-facing (storage layer), but ensure:
- Error messages are screen-reader accessible
- Import/export buttons properly labeled
- Confirmation dialogs keyboard navigable

---

_Updated: Phase persistence completed_
