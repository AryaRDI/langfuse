import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProjectProcedure,
} from "@/src/server/api/trpc";
import { type ChatMessage } from "../types";
import { DEFAULT_ASSISTANT_CONFIG } from "../config";
import { callLLMAPIWithTracing } from "./llmService";

export const assistantsRouter = createTRPCRouter({
  // GET /api/conversations equivalent - list all previous conversations for the project/user
  getConversations: protectedProjectProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await ctx.prisma.conversation.findMany({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
        include: {
          messages: {
            orderBy: { timestamp: "desc" },
            take: 1, // Latest message for preview
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  // GET /api/conversations/:id equivalent - full message history for a conversation
  getConversationMessages: protectedProjectProcedure
    .input(
      z.object({
        conversationId: z.string(),
        projectId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
        include: {
          messages: {
            orderBy: { timestamp: "asc" },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      return conversation;
    }),

  // POST /api/conversations equivalent - start a new conversation and return its id
  createConversation: protectedProjectProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.conversation.create({
        data: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
          title: "New Conversation",
        },
      });
    }),

  // POST /api/conversations/:id/messages equivalent - append a new user message, invoke LLM API, then store and return assistant's reply
  sendMessage: protectedProjectProcedure
    .input(
      z.object({
        conversationId: z.string(),
        projectId: z.string(),
        content: z.string().min(1, "Message cannot be empty"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify conversation belongs to user and project
      const conversation = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // 1. Save user message
      const userMessage = await ctx.prisma.message.create({
        data: {
          conversationId: input.conversationId,
          sender: "user",
          content: input.content,
        },
      });

      // 2. Get conversation context (previous messages)
      const messages = await ctx.prisma.message.findMany({
        where: { conversationId: input.conversationId },
        orderBy: { timestamp: "asc" },
      });

      // 3. Prepare messages for LLM API
      const chatMessages: ChatMessage[] = [
        { role: "system", content: DEFAULT_ASSISTANT_CONFIG.systemPrompt },
        ...messages.map((m) => ({
          role:
            m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        })),
      ];

      try {
        // 4. Call LLM API with tracing
        const assistantResponse = await callLLMAPIWithTracing(
          chatMessages,
          input.projectId,
          input.conversationId,
        );

        // 5. Save assistant message
        const assistantMessage = await ctx.prisma.message.create({
          data: {
            conversationId: input.conversationId,
            sender: "assistant",
            content: assistantResponse.content,
            tokenCount: assistantResponse.tokenCount,
            traceId: assistantResponse.traceId,
          },
        });

        // 6. Update conversation timestamp
        await ctx.prisma.conversation.update({
          where: { id: input.conversationId },
          data: {
            updatedAt: new Date(),
            // Auto-generate title from first user message
            title:
              conversation.title === "New Conversation" && messages.length === 1
                ? input.content.slice(0, 50) +
                  (input.content.length > 50 ? "..." : "")
                : conversation.title,
          },
        });

        return {
          userMessage,
          assistantMessage,
        };
      } catch (error) {
        console.error("LLM API error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get assistant response",
        });
      }
    }),
});
