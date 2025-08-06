export type GeminiType = 'chat' | 'content' | 'web' | 'vision';
export type ContentsType = {
  type: GeminiType;
  content: string;
  image?: File;
};
export type ConversationItem = {
  request: string;
  response: string;
  type: GeminiType;
  timestamp: Date;
  image?: File;
};