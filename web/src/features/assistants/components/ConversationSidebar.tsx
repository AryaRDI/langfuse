import React from "react";
import { Button } from "@/src/components/ui/button";
import { Plus, MessageCircle, X } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useAssistant } from "@/src/features/assistants/context/AssistantContext";
import { ErrorDisplay } from "./ErrorDisplay";
import { cn } from "@/src/utils/tailwind";
import { type AssistantConversation } from "../types";

interface ConversationSidebarProps {
  onClose?: () => void;
}

export function ConversationSidebar({ onClose }: ConversationSidebarProps) {
  const {
    conversations,
    isLoadingConversations,
    selectedConversationId,
    selectConversation,
    createAndSelectConversation,
    error,
    clearError,
  } = useAssistant();

  return (
    <div className="flex h-full flex-col">
      {/* Header with New Conversation Button */}
      <div className="border-b border-border p-4">
        {/* Mobile close button */}
        {onClose && (
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button
          onClick={() => {
            // Clear any existing errors when creating new conversation
            if (error) {
              clearError();
            }
            createAndSelectConversation();
          }}
          className="w-full transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
          New Conversation
        </Button>
      </div>

      {/* Error Display for sidebar-specific errors */}
      {error && (
        <div className="border-b border-border p-3">
          <ErrorDisplay
            error={error}
            onRetry={() => {
              clearError();
              // Could implement specific retry logic here
            }}
            onDismiss={clearError}
            variant="inline"
            showSuggestions={false}
            className="text-xs"
          />
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="space-y-3 p-4">
            {/* Enhanced loading skeletons with animation */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/50 p-3 animate-in fade-in-0 slide-in-from-left-1"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4 animate-pulse" />
                  <Skeleton className="h-3 w-1/2 animate-pulse" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16 animate-pulse" />
                    <Skeleton className="h-3 w-20 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            <div className="flex items-center justify-center py-4">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60"></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={() => {
                  selectConversation(conversation.id);
                  // Close sidebar on mobile after selection
                  if (onClose && window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                isSelected={conversation.id === selectedConversationId}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No conversations yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start a new conversation to begin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  onClick,
  isSelected = false,
}: {
  conversation: AssistantConversation;
  onClick: () => void;
  isSelected?: boolean;
}) {
  const lastMessage = conversation.messages?.[0];
  const messageCount = conversation._count?.messages || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg p-3 text-left transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none active:bg-muted/70 sm:p-3",
        isSelected && "border border-border bg-muted",
      )}
    >
      <div className="space-y-1">
        {/* Conversation Title */}
        <div className="line-clamp-1 text-sm font-medium">
          {conversation.title || "New Conversation"}
        </div>

        {/* Last Message Preview */}
        {lastMessage && (
          <div className="line-clamp-2 text-xs text-muted-foreground">
            {lastMessage.content}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {messageCount} message{messageCount !== 1 ? "s" : ""}
          </span>
          <span>
            {formatDistanceToNow(new Date(conversation.updatedAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </button>
  );
}
