import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { useAssistant } from "@/src/features/assistants/context/AssistantContext";
import { cn } from "@/src/utils/tailwind";

/**
 * MessageInput Component
 *
 * Message input area with:
 * - Auto-resizing textarea
 * - Send button
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 * - Loading state
 */
export function MessageInput() {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    selectedConversation,
    sendMessage,
    isSendingMessage,
    error,
    clearError,
  } = useAssistant();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [message]);

  const handleSubmit = async () => {
    if (!message.trim() || isSendingMessage || !selectedConversation) return;

    const messageToSend = message.trim();

    // Clear any existing errors when attempting to send
    if (error) {
      clearError();
    }

    setMessage(""); // Clear input immediately for better UX

    try {
      await sendMessage(messageToSend);
    } catch (error) {
      // If sending fails, restore the message
      setMessage(messageToSend);
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background p-3 sm:p-4">
      <div className="flex items-end gap-2 sm:gap-3">
        {/* Message Input */}
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedConversation
                ? "Type your message..."
                : "Select a conversation to start chatting"
            }
            className="max-h-[120px] min-h-[44px] resize-none text-base sm:min-h-[40px] sm:text-sm"
            disabled={isSendingMessage || !selectedConversation}
          />
          {/* Mobile helper text */}
          <div className="mt-1 text-xs text-muted-foreground sm:hidden">
            {selectedConversation && "Tap Send or press Enter to send"}
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSubmit}
          disabled={
            !message.trim() || isSendingMessage || !selectedConversation
          }
          size="sm"
          className={cn(
            "h-11 w-11 shrink-0 transition-all duration-200 sm:h-10 sm:w-auto sm:px-3",
            "hover:scale-105 active:scale-95",
            !message.trim() || !selectedConversation
              ? "cursor-not-allowed opacity-50"
              : "hover:shadow-md",
            isSendingMessage && "animate-pulse",
          )}
        >
          {isSendingMessage ? (
            <div className="flex items-center space-x-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="sr-only text-xs sm:not-sr-only sm:ml-2">
                Sending...
              </span>
            </div>
          ) : (
            <>
              <Send
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  message.trim() &&
                    selectedConversation &&
                    "group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                )}
              />
              <span className="sr-only sm:not-sr-only sm:ml-2">Send</span>
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="mt-2 text-xs text-muted-foreground">
        Press <kbd className="rounded border px-1 py-0.5 text-xs">Enter</kbd> to
        send, <kbd className="rounded border px-1 py-0.5 text-xs">Shift</kbd> +{" "}
        <kbd className="rounded border px-1 py-0.5 text-xs">Enter</kbd> for new
        line
      </div>
    </div>
  );
}
