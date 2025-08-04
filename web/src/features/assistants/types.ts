import { type Conversation, type Message } from "@prisma/client";

// Base types from Prisma
export type { Conversation, Message };

// Extended conversation types for different use cases
export type ConversationWithMessages = Conversation & {
  messages: Message[];
  _count?: {
    messages: number;
  };
};

export type ConversationPreview = Conversation & {
  messages: Message[];
  _count: {
    messages: number;
  };
};

// Context-specific types
export type AssistantMessage = Message;

export type AssistantConversation = Conversation & {
  messages: AssistantMessage[];
  _count: {
    messages: number;
  };
};

export type AssistantContextType = {
  // Current state
  selectedConversationId: string | null;
  selectedConversation: AssistantConversation | null;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  // Error state
  error: any;
  clearError: () => void;

  // Actions
  selectConversation: (conversationId: string) => void;
  createAndSelectConversation: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;

  // Data
  conversations: AssistantConversation[] | undefined;
  isLoadingConversations: boolean;
  messages: AssistantMessage[] | undefined;
};

// LLM API types
export interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  usage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
