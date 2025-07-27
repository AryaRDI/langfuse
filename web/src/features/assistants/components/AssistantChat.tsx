import React from "react";
import { ConversationSidebar } from "./ConversationSidebar";
import { ChatInterface } from "./ChatInterface";

/**
 * AssistantChat Component
 *
 * Main container for the assistant chat interface with two-column layout:
 * - Left: Conversation list sidebar
 * - Right: Chat interface
 */
export function AssistantChat() {
  return (
    <div className="flex h-full">
      {/* Left Sidebar - Conversation List */}
      <div className="w-80 border-r border-border bg-muted/10">
        <ConversationSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        <ChatInterface />
      </div>
    </div>
  );
}
