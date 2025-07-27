import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { ErrorDisplay } from "./ErrorDisplay";
import { useAssistant } from "@/src/features/assistants/context/AssistantContext";
import { Skeleton } from "@/src/components/ui/skeleton";

export function ChatInterface() {
  const {
    selectedConversation,
    messages,
    isLoadingMessages,
    error,
    clearError,
  } = useAssistant();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Only scroll if we're near the bottom to avoid interrupting user scrolling
    const scrollContainer = messagesEndRef.current?.parentElement;
    if (scrollContainer) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        const timeoutId = setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }, 50);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {!selectedConversation ? (
          /* Welcome State - shown when no conversation is selected */
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
              <h3 className="mb-2 text-lg font-semibold">
                Welcome to Assistant
              </h3>
              <p className="text-muted-foreground">
                Select a conversation from the sidebar or start a new one to
                begin chatting with your AI assistant.
              </p>
            </div>
          </div>
        ) : isLoadingMessages ? (
          /* Loading State */
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Messages Display */
          <div className="space-y-4">
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-md text-center">
                  <h3 className="mb-2 text-lg font-semibold">
                    Start a conversation
                  </h3>
                  <p className="text-muted-foreground">
                    Send a message below to begin chatting with your AI
                    assistant.
                  </p>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-t border-border p-3 sm:p-4">
          <ErrorDisplay
            error={error}
            onRetry={() => {
              // Retry the last action based on error type
              clearError();
            }}
            onDismiss={clearError}
            variant="inline"
            showSuggestions={true}
          />
        </div>
      )}

      {/* Message Input - Always at bottom */}
      <div className="border-t border-border">
        <MessageInput />
      </div>
    </div>
  );
}
