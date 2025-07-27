import { type Conversation, type Message } from "@prisma/client";

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
