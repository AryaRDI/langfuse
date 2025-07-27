import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { useAssistant } from "@/src/features/assistants/context/AssistantContext";

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
  const { selectedConversation, sendMessage, isSendingMessage } =
    useAssistant();

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
    <div className="p-4">
      <div className="flex items-end gap-2">
        {/* Message Input */}
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedConversation
                ? "Type your message... (Press Enter to send)"
                : "Select a conversation to start chatting"
            }
            className="max-h-[120px] min-h-[40px] resize-none"
            disabled={isSendingMessage || !selectedConversation}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSubmit}
          disabled={
            !message.trim() || isSendingMessage || !selectedConversation
          }
          size="sm"
          className="shrink-0"
        >
          {isSendingMessage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
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
