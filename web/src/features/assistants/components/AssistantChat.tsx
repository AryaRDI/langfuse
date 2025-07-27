import React, { useState } from "react";
import { ConversationSidebar } from "./ConversationSidebar";
import { ChatInterface } from "./ChatInterface";
import { Menu } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/utils/tailwind";

export function AssistantChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Conversation List */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-80 transform border-r border-border bg-background transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:bg-muted/10",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <ConversationSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header with menu button */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2"
          >
            <Menu className="h-5 w-5" />
            <span className="text-sm font-medium">Conversations</span>
          </Button>
        </div>

        <ChatInterface />
      </div>
    </div>
  );
}
