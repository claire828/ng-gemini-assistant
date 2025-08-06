export type GeminiType = 'chat' | 'generate' | 'search';
export type ContentsType = { type: GeminiType; content: string };
export type ConversationItem = {
  request: string;
  response: string;
  type: GeminiType;
  timestamp: Date;
};