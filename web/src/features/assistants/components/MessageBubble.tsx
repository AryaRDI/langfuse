import React from "react";
import { cn } from "@/src/utils/tailwind";
import { formatDistanceToNow } from "date-fns";
import { User, Bot } from "lucide-react";

/**
 * MessageBubble Component
 *
 * Individual message display with:
 * - User vs Assistant styling
 * - Timestamp
 * - Message content
 */
export function MessageBubble({
  message,
}: {
  message: {
    id: string;
    sender: "user" | "assistant";
    content: string;
    timestamp: Date | string;
  };
}) {
  const isUser = message.sender === "user";

  const isOptimistic = message.id?.startsWith("temp-");

  return (
    <div
      className={cn(
        "mb-4 flex gap-3 transition-all duration-300 ease-out",
        isUser ? "flex-row-reverse" : "flex-row",
        isOptimistic ? "animate-in fade-in-0 slide-in-from-bottom-1" : "",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "max-w-[70%] space-y-1",
          isUser ? "text-right" : "text-left",
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          <div className="whitespace-pre-wrap">
            {message.content === "..." && !isUser ? (
              <div className="flex space-x-1 py-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            ) : (
              message.content
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            "text-xs text-muted-foreground",
            isUser ? "text-right" : "text-left",
          )}
        >
          {formatDistanceToNow(new Date(message.timestamp), {
            addSuffix: true,
          })}
        </div>
      </div>
    </div>
  );
}
