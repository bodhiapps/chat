import Dexie, { type EntityTable } from 'dexie';
import type { Conversation, Message } from './schema';

const db = new Dexie('BodhiChat') as Dexie & {
  conversations: EntityTable<Conversation, 'id'>;
  messages: EntityTable<Message, 'id'>;
};

db.version(1).stores({
  conversations: 'id, lastModified',
  messages: 'id, convId, createdAt',
});

export { db };
