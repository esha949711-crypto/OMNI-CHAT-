export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64 data URL
  size?: number;
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingSource[];
  groundingSupports?: any[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
  attachments?: ChatAttachment[];
  grounding?: GroundingMetadata;
  thinking?: string; // Captured reasoning steps
  thoughtDuration?: number; // seconds spent thinking
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  enableThinking: boolean;
  enableSearch: boolean;
  isPinned?: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  icon: string;
  supportsSearch: boolean;
  supportsThinking: boolean;
}

export type ThemeMode = 'dark' | 'light';

export interface PersonaPreset {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
}
