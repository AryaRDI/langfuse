import React from "react";
import Page from "@/src/components/layouts/page";
import { AssistantChat } from "@/src/features/assistants/components/AssistantChat";
import { AssistantProvider } from "@/src/features/assistants/context/AssistantContext";

/**
 * AssistantsPage Component
 *
 * Main assistants page that provides a ChatGPT-style interface
 * for conversing with AI assistants integrated with Langfuse.
 *
 * Key Features:
 * - ChatGPT-style conversation interface
 * - Conversation history sidebar
 * - Single predefined assistant configuration
 * - Message persistence and LLM tracing
 *
 * Architecture:
 * - Two-column layout: conversation list + chat interface
 * - tRPC integration for real-time communication
 * - Langfuse tracing for all LLM interactions
 */
export default function AssistantsPage() {
  return (
    <Page
      scrollable={false}
      withPadding={false}
      headerProps={{
        title: "Assistant",
        help: {
          description:
            "Chat with an AI assistant integrated with Langfuse for tracing and monitoring",
          href: "https://langfuse.com/docs/playground", // TODO: Update with assistants docs
        },
      }}
    >
      <AssistantProvider>
        <AssistantChat />
      </AssistantProvider>
    </Page>
  );
}
