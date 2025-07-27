import React from "react";
import { Button } from "@/src/components/ui/button";
import { Plus, MessageCircle } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useAssistant } from "@/src/features/assistants/context/AssistantContext";
import { cn } from "@/src/utils/tailwind";

/**
 * ConversationSidebar Component
 *
 * Left sidebar showing:
 * - New Conversation button
 * - List of past conversations
 * - Conversation selection
 */
export function ConversationSidebar() {
  const {
    conversations,
    isLoadingConversations,
    selectedConversationId,
    selectConversation,
    createAndSelectConversation,
  } = useAssistant();

  return (
    <div className="flex h-full flex-col">
      {/* Header with New Conversation Button */}
      <div className="border-b border-border p-4">
        <Button
          onClick={createAndSelectConversation}
          className="w-full"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="space-y-2 p-4">
            {/* Loading skeletons */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={() => selectConversation(conversation.id)}
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

/**
 * ConversationItem Component
 *
 * Individual conversation item in the sidebar
 */
function ConversationItem({
  conversation,
  onClick,
  isSelected = false,
}: {
  conversation: any; // TODO: Add proper type
  onClick: () => void;
  isSelected?: boolean;
}) {
  const lastMessage = conversation.messages?.[0];
  const messageCount = conversation._count?.messages || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg p-3 text-left transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none",
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
