import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "@/src/utils/api";
import { useRouter } from "next/router";

/**
 * AssistantContext
 *
 * Manages global state for the Assistant feature:
 * - Selected conversation
 * - Message sending
 * - Optimistic updates
 */

type Message = {
  id: string;
  conversationId: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokenCount?: number | null;
  traceId?: string | null;
};

type Conversation = {
  id: string;
  projectId: string;
  userId: string;
  title: string | null;
  startedAt: Date;
  updatedAt: Date;
  messages: Message[];
  _count: {
    messages: number;
  };
};

type AssistantContextType = {
  // Current state
  selectedConversationId: string | null;
  selectedConversation: Conversation | null;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  // Actions
  selectConversation: (conversationId: string) => void;
  createAndSelectConversation: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;

  // Data
  conversations: Conversation[] | undefined;
  isLoadingConversations: boolean;
  messages: Message[] | undefined;
};

const AssistantContext = createContext<AssistantContextType | null>(null);

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistant must be used within an AssistantProvider");
  }
  return context;
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const projectId = router.query.projectId as string;

  // Local state
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // API queries
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = api.assistants.getConversations.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  const {
    data: conversationWithMessages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = api.assistants.getConversationMessages.useQuery(
    {
      conversationId: selectedConversationId!,
      projectId: projectId!,
    },
    { enabled: !!selectedConversationId && !!projectId },
  );

  // Extract messages from the conversation object and combine with optimistic ones
  const serverMessages = conversationWithMessages?.messages || [];

  // Deduplicate messages - prefer server messages over optimistic ones
  const allMessages = [...serverMessages, ...optimisticMessages];
  const deduplicatedMessages = allMessages.filter((message, _, arr) => {
    // Keep server messages, and only keep optimistic messages if no server equivalent exists
    if (!message.id.startsWith("temp-")) return true;

    // For optimistic messages, check if there's a newer server message with similar content
    const hasServerEquivalent = arr.some(
      (m) =>
        !m.id.startsWith("temp-") &&
        m.sender === message.sender &&
        m.content !== "..." &&
        Math.abs(
          new Date(m.timestamp).getTime() -
            new Date(message.timestamp).getTime(),
        ) < 5000,
    );

    return !hasServerEquivalent;
  });

  const messages = deduplicatedMessages.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // API mutations
  const createConversationMutation =
    api.assistants.createConversation.useMutation({
      onSuccess: (newConversation) => {
        // Refresh conversations list and select the new one
        refetchConversations();
        setSelectedConversationId(newConversation.id);
      },
    });

  const sendMessageMutation = api.assistants.sendMessage.useMutation({
    onSuccess: () => {
      // Don't clear optimistic messages immediately - let them merge naturally
      refetchConversations();
      refetchMessages();

      // Clear optimistic messages after a short delay to allow smooth transition
      setTimeout(() => {
        setOptimisticMessages([]);
      }, 500);
    },
    onError: () => {
      // Clear optimistic messages on error
      setOptimisticMessages([]);
    },
    onSettled: () => {
      setIsSendingMessage(false);
    },
  });

  // Find selected conversation
  const selectedConversation =
    conversations?.find((c) => c.id === selectedConversationId) || null;

  // Actions
  const selectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setOptimisticMessages([]); // Clear optimistic messages when switching conversations
  }, []);

  const createAndSelectConversation = useCallback(async () => {
    if (!projectId) return;

    try {
      await createConversationMutation.mutateAsync({ projectId });
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  }, [projectId, createConversationMutation]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversationId || !content.trim() || !projectId) return;

      const messageContent = content.trim();

      // 1. Add optimistic user message immediately
      const optimisticUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        conversationId: selectedConversationId,
        sender: "user",
        content: messageContent,
        timestamp: new Date(),
      };

      setOptimisticMessages([optimisticUserMessage]);
      setIsSendingMessage(true);

      // 2. Add optimistic assistant loading message
      const optimisticAssistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        conversationId: selectedConversationId,
        sender: "assistant",
        content: "...", // This will be replaced when we get the real response
        timestamp: new Date(Date.now() + 100), // Slightly later timestamp
      };

      setOptimisticMessages([
        optimisticUserMessage,
        optimisticAssistantMessage,
      ]);

      try {
        await sendMessageMutation.mutateAsync({
          conversationId: selectedConversationId,
          projectId: projectId,
          content: messageContent,
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        setIsSendingMessage(false);
      }
    },
    [selectedConversationId, projectId, sendMessageMutation],
  );

  const value: AssistantContextType = {
    // Current state
    selectedConversationId,
    selectedConversation,
    isLoadingMessages,
    isSendingMessage,

    // Actions
    selectConversation,
    createAndSelectConversation,
    sendMessage,

    // Data
    conversations,
    isLoadingConversations,
    messages,
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}
