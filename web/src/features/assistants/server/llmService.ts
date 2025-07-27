import { type ChatMessage } from "../types";
import { DEFAULT_ASSISTANT_CONFIG } from "../config";
import {
  fetchLLMCompletion,
  LLMAdapter,
  ModelParams,
  ChatMessageType,
} from "@langfuse/shared/src/server";
import { TRPCError } from "@trpc/server";
import { prisma } from "@langfuse/shared/src/db";
import { decrypt } from "@langfuse/shared/encryption";

export async function callLLMAPIWithTracing(
  messages: ChatMessage[],
  projectId: string,
  conversationId: string,
): Promise<{
  content: string;
  tokenCount?: number;
  traceId: string;
}> {
  // 1. Get LLM API key for the specific provider required by our assistant config
  const llmApiKey = await prisma.llmApiKeys.findFirst({
    where: {
      projectId,
      provider: DEFAULT_ASSISTANT_CONFIG.provider,
    },
  });

  if (!llmApiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `No ${DEFAULT_ASSISTANT_CONFIG.provider} API key found in project. Please add one in the project settings.`,
    });
  }

  try {
    // 2. Decrypt the API key
    const decryptedKey = decrypt(llmApiKey.secretKey);

    // 3. Prepare model parameters using assistant config
    const modelParams: ModelParams = {
      provider: DEFAULT_ASSISTANT_CONFIG.provider,
      model: DEFAULT_ASSISTANT_CONFIG.model,
      adapter: llmApiKey.adapter as LLMAdapter,
      temperature: DEFAULT_ASSISTANT_CONFIG.temperature,
      max_tokens: DEFAULT_ASSISTANT_CONFIG.maxTokens,
    };

    // 4. Convert our messages to Langfuse format using PublicAPICreated type
    const langfuseMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      type: ChatMessageType.PublicAPICreated as const,
    }));

    // 5. Call LLM with tracing
    const result = await fetchLLMCompletion({
      messages: langfuseMessages,
      modelParams,
      apiKey: decryptedKey,
      baseURL: llmApiKey.baseURL || undefined,
      extraHeaders: {},
      streaming: false,
    });

    if (typeof result.completion !== "string") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Invalid response from LLM API",
      });
    }

    return {
      content: result.completion,
      tokenCount: undefined, // Token usage not available in this response format
      traceId: `assistant-${conversationId}-${Date.now()}`, // Generate a trace ID
    };
  } catch (error) {
    console.error("LLM API error:", error);

    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get assistant response. Please try again.",
    });
  }
}
