// types/index.ts
export interface DetectionResult {
  id: string;
  objectClass: string;
  confidence: number;
  boundingBox: [number, number, number, number];
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface User {
  name: string;
  email: string;
  id: number;
}