import { type ChatMessage } from "../types";
import { DEFAULT_ASSISTANT_CONFIG } from "../config";
import {
  fetchLLMCompletion,
  LLMAdapter,
  ModelParams,
  ChatMessageType,
  TraceParams,
  AuthHeaderValidVerificationResult,
  PROMPT_EXPERIMENT_ENVIRONMENT,
} from "@langfuse/shared/src/server";
import { TRPCError } from "@trpc/server";
import { prisma } from "@langfuse/shared/src/db";
import { decrypt } from "@langfuse/shared/encryption";
import { v4 as uuidv4 } from "uuid";

export async function callLLMAPIWithTracing(
  messages: ChatMessage[],
  projectId: string,
  _conversationId: string, // Used for future conversation-specific tracing
): Promise<{
  content: string;
  tokenCount?: number;
  traceId: string;
}> {
  // Generate a unique trace ID for this assistant interaction
  const traceId = uuidv4();

  // Get project's Langfuse API key for internal tracing
  const projectApiKey = await prisma.apiKey.findFirst({
    where: {
      projectId,
      scope: "PROJECT",
    },
    include: {
      project: {
        include: {
          organization: true,
        },
      },
    },
  });

  const llmApiKey = await prisma.llmApiKeys.findFirst({
    where: {
      projectId,
      adapter: DEFAULT_ASSISTANT_CONFIG.adapter,
    },
  });

  if (!llmApiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `No ${DEFAULT_ASSISTANT_CONFIG.adapter} API key found in project. Please add one in the project settings.`,
    });
  }

  try {
    const decryptedKey = decrypt(llmApiKey.secretKey);

    const modelParams: ModelParams = {
      provider: llmApiKey.provider,
      model: DEFAULT_ASSISTANT_CONFIG.model,
      adapter: llmApiKey.adapter as LLMAdapter,
      temperature: DEFAULT_ASSISTANT_CONFIG.temperature,
      max_tokens: DEFAULT_ASSISTANT_CONFIG.maxTokens,
    };

    const langfuseMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      type: ChatMessageType.PublicAPICreated as const,
    }));

    // Create trace parameters for internal assistant tracing
    let traceParams: TraceParams | undefined;

    if (projectApiKey?.project?.organization) {
      console.log("Creating assistant trace for project:", projectId);
      // Create auth context using project's API key
      const authCheck: AuthHeaderValidVerificationResult = {
        validKey: true,
        scope: {
          projectId: projectId,
          accessLevel: "project",
          orgId: projectApiKey.project.organization.id,
          plan: "oss", // Use OSS plan for simplicity
          rateLimitOverrides: [],
          apiKeyId: projectApiKey.id,
          publicKey: projectApiKey.publicKey,
        },
      };

      // Create a basic token count delegate
      const tokenCountDelegate = (_: { model: any; text: unknown }) => {
        // Return undefined to let Langfuse handle token counting automatically
        return undefined;
      };

      traceParams = {
        traceName: "assistant-conversation",
        traceId: traceId,
        projectId: projectId,
        environment: PROMPT_EXPERIMENT_ENVIRONMENT,
        tokenCountDelegate: tokenCountDelegate,
        authCheck: authCheck,
      };
    } else {
      console.warn(
        "No project API key found for tracing. Assistant calls will not be traced.",
      );
    }

    const result = await fetchLLMCompletion({
      messages: langfuseMessages,
      modelParams,
      apiKey: decryptedKey,
      baseURL: llmApiKey.baseURL || undefined,
      extraHeaders: {},
      streaming: false,
      traceParams, // Enable tracing using project's API key
    });

    if (typeof result.completion !== "string") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Invalid response from LLM API",
      });
    }

    try {
      await result.processTracedEvents();
    } catch (error) {
      console.warn("Failed to process traced events:", error);
      // Don't fail the request if tracing fails
    }

    return {
      content: result.completion,
      tokenCount: undefined, // Token count will be captured in the Langfuse trace
      traceId: traceId, // Return the actual trace ID for linking to the trace
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
