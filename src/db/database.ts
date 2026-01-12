import Dexie, { type EntityTable } from 'dexie';
import type { Conversation, Message, UserSettings } from './schema';

const db = new Dexie('BodhiChat') as Dexie & {
  conversations: EntityTable<Conversation, 'id'>;
  messages: EntityTable<Message, 'id'>;
  userSettings: EntityTable<UserSettings, 'userId'>;
};

db.version(1).stores({
  conversations: 'id, lastModified',
  messages: 'id, convId, createdAt',
});

db.version(2)
  .stores({
    conversations: 'id, lastModified, pinned',
    messages: 'id, convId, createdAt',
  })
  .upgrade(tx => {
    return tx
      .table('conversations')
      .toCollection()
      .modify(conv => {
        conv.pinned = false;
      });
  });

db.version(3)
  .stores({
    conversations: 'id, userId, lastModified, pinned, [userId+lastModified]',
    messages: 'id, convId, createdAt',
  })
  .upgrade(async tx => {
    // Clean slate: delete all existing data
    await tx.table('messages').clear();
    await tx.table('conversations').clear();
  });

db.version(4).stores({
  conversations: 'id, userId, lastModified, pinned, [userId+lastModified]',
  messages: 'id, convId, createdAt',
  userSettings: 'userId, lastModified',
});

export { db };
