/**
 * Chat and AI interaction types
 */

export interface ChatSession {
  id: string;
  decision_id: string | null;
  created_at: number;
  updated_at: number;
  trigger_type: 'manual' | 'emotional_flag' | 'review_prompt';
  title: string | null;
}

export interface ChatSessionWithMetadata extends ChatSession {
  message_count: number;
  first_message_preview: string | null;
  linked_decision_title: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: number;
  context_decisions: string[]; // Decision IDs used as context
}

export interface RAGContext {
  currentDecision?: any;
  similarDecisions: any[];
  prompt: string;
}

export interface Suggestion {
  type: 'alternative' | 'bias' | 'probability' | 'consideration';
  content: string;
  confidence: number; // 0-1
  reasoning?: string;
}
