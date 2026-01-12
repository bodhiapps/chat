export interface Conversation {
  id: string;
  userId: string;
  name: string;
  lastModified: number;
  pinned: boolean;
}

export interface MessageExtra {
  reasoning_content?: string;
  tool_calls?: unknown[];
  [key: string]: unknown;
}

export interface Message {
  id: string;
  convId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  extra?: MessageExtra;
  timings?: {
    predicted_per_second?: number;
    predicted_ms?: number;
    [key: string]: unknown;
  };
  model?: string;
  createdAt: number;
}

export interface UserSettings {
  userId: string;
  settings: string; // JSON stringified Settings object
  lastModified: number;
}
