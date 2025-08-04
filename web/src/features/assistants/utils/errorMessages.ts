/**
 * User-friendly error messages for the assistants feature
 */

export const ERROR_MESSAGES = {
  // Network and API errors
  NETWORK_ERROR:
    "Unable to connect. Please check your internet connection and try again.",
  API_TIMEOUT: "The request is taking longer than expected. Please try again.",
  SERVER_ERROR:
    "Something went wrong on our end. Please try again in a moment.",

  // Authentication errors
  UNAUTHORIZED: "You need to be signed in to use the assistant.",
  ACCESS_DENIED: "You don't have permission to access this project.",

  // LLM and API key errors
  NO_API_KEY:
    "No AI provider is configured for this project. Please add an OpenAI API key in project settings.",
  INVALID_API_KEY:
    "The OpenAI API key appears to be invalid. Please check your project settings.",
  API_QUOTA_EXCEEDED:
    "Your OpenAI usage quota has been exceeded. Please check your OpenAI billing.",
  API_RATE_LIMITED:
    "Too many requests. Please wait a moment before trying again.",

  // Conversation errors
  CONVERSATION_NOT_FOUND:
    "This conversation could not be found. It may have been deleted.",
  CONVERSATION_LOAD_FAILED:
    "Failed to load conversation history. Please refresh and try again.",

  // Message errors
  MESSAGE_EMPTY: "Please enter a message before sending.",
  MESSAGE_TOO_LONG:
    "Your message is too long. Please keep it under 4,000 characters.",
  MESSAGE_SEND_FAILED: "Failed to send your message. Please try again.",

  // Assistant response errors
  ASSISTANT_UNAVAILABLE:
    "The assistant is temporarily unavailable. Please try again later.",
  ASSISTANT_ERROR:
    "The assistant encountered an error. Please try rephrasing your message.",
  RESPONSE_TIMEOUT:
    "The assistant is taking too long to respond. Please try again.",

  // Generic fallback
  UNKNOWN_ERROR:
    "An unexpected error occurred. Please try again or contact support if the problem persists.",
} as const;

export type ErrorType = keyof typeof ERROR_MESSAGES;

/**
 * Maps technical error codes/messages to user-friendly messages
 */
export function getUserFriendlyError(error: any): string {
  // If we have a specific user-friendly message, use it
  if (error?.message && typeof error.message === "string") {
    // Check for common patterns that we can make more user-friendly
    if (error.message.includes("No openai API key found in project")) {
      return "No OpenAI API key found in project. Please add one in the project settings to use the assistant.";
    }

    if (error.message.includes("No Anthropic API key found in project")) {
      return "No Anthropic API key found in project. Please add one in the project settings to use the assistant.";
    }

    if (error.message.includes("No Google API key found in project")) {
      return "No Google API key found in project. Please add one in the project settings to use the assistant.";
    }

    // For other specific error messages, try to make them more user-friendly
    if (error.message.includes("API key")) {
      return `API Configuration Issue: ${error.message}`;
    }

    if (error.message.includes("LLM") || error.message.includes("model")) {
      return `AI Model Issue: ${error.message}`;
    }

    if (
      error.message.includes("conversation") ||
      error.message.includes("message")
    ) {
      return `Conversation Issue: ${error.message}`;
    }

    // For other specific errors, show the actual message but with context
    return error.message;
  }

  // Handle specific error types
  if (
    error?.code === "UNAUTHORIZED" ||
    error?.message?.includes("Unauthorized")
  ) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }

  if (
    error?.code === "FORBIDDEN" ||
    error?.message?.includes("Access denied")
  ) {
    return ERROR_MESSAGES.ACCESS_DENIED;
  }

  if (error?.code === "NOT_FOUND" || error?.message?.includes("not found")) {
    return ERROR_MESSAGES.CONVERSATION_NOT_FOUND;
  }

  if (
    error?.code === "PRECONDITION_FAILED" ||
    error?.message?.includes("No OpenAI API key") ||
    error?.message?.includes("No openai API key found in project")
  ) {
    return ERROR_MESSAGES.NO_API_KEY;
  }

  if (
    error?.message?.includes("Invalid API key") ||
    error?.message?.includes("API key")
  ) {
    return ERROR_MESSAGES.INVALID_API_KEY;
  }

  if (
    error?.message?.includes("quota") ||
    error?.message?.includes("billing")
  ) {
    return ERROR_MESSAGES.API_QUOTA_EXCEEDED;
  }

  if (
    error?.message?.includes("rate limit") ||
    error?.message?.includes("Too many requests")
  ) {
    return ERROR_MESSAGES.API_RATE_LIMITED;
  }

  if (error?.message?.includes("timeout") || error?.name === "TimeoutError") {
    return ERROR_MESSAGES.RESPONSE_TIMEOUT;
  }

  if (error?.name === "NetworkError" || error?.message?.includes("Network")) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error?.message?.includes("Message cannot be empty")) {
    return ERROR_MESSAGES.MESSAGE_EMPTY;
  }

  if (
    error?.message?.includes("too long") ||
    error?.message?.includes("length")
  ) {
    return ERROR_MESSAGES.MESSAGE_TOO_LONG;
  }

  // Default fallback - show the actual error if available
  if (error?.message) {
    return error.message;
  }

  if (error?.toString && error.toString() !== "[object Object]") {
    return error.toString();
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Get actionable suggestions based on error type
 */
export function getErrorSuggestions(error: any): string[] {
  const message = getUserFriendlyError(error);
  const originalMessage = error?.message || "";

  // Handle specific error patterns
  if (originalMessage.includes("No openai API key found in project")) {
    return [
      "Go to Project Settings → LLM API Keys",
      "Add a new OpenAI API key",
      "Ensure the provider is set to 'OpenAI'",
    ];
  }

  if (originalMessage.includes("No Anthropic API key found in project")) {
    return [
      "Go to Project Settings → LLM API Keys",
      "Add a new Anthropic API key",
      "Ensure the provider is set to 'Anthropic'",
    ];
  }

  if (originalMessage.includes("No Google API key found in project")) {
    return [
      "Go to Project Settings → LLM API Keys",
      "Add a new Google API key",
      "Ensure the provider is set to 'Google'",
    ];
  }

  if (originalMessage.includes("API key")) {
    return [
      "Check your API key configuration in project settings",
      "Verify the API key is valid and has proper permissions",
      "Try regenerating the API key from the provider",
    ];
  }

  if (originalMessage.includes("LLM") || originalMessage.includes("model")) {
    return [
      "Check your AI model configuration in project settings",
      "Verify the model name and provider settings",
      "Try using a different model if available",
    ];
  }

  if (
    originalMessage.includes("conversation") ||
    originalMessage.includes("message")
  ) {
    return [
      "Try creating a new conversation",
      "Refresh the page to reload conversations",
      "Check if the conversation was deleted",
    ];
  }

  // Handle predefined error types
  switch (message) {
    case ERROR_MESSAGES.NO_API_KEY:
      return [
        "Go to Project Settings → LLM API Keys",
        "Add a new OpenAI API key",
        "Ensure the provider is set to 'OpenAI'",
      ];

    case ERROR_MESSAGES.INVALID_API_KEY:
      return [
        "Check your OpenAI API key in project settings",
        "Ensure the key has the correct permissions",
        "Try generating a new API key from OpenAI",
      ];

    case ERROR_MESSAGES.API_QUOTA_EXCEEDED:
      return [
        "Check your OpenAI usage and billing",
        "Upgrade your OpenAI plan if needed",
        "Wait for your quota to reset",
      ];

    case ERROR_MESSAGES.NETWORK_ERROR:
      return [
        "Check your internet connection",
        "Try refreshing the page",
        "Contact support if the problem persists",
      ];

    case ERROR_MESSAGES.CONVERSATION_NOT_FOUND:
      return [
        "Try creating a new conversation",
        "Check if the conversation was deleted",
        "Refresh the page to see updated conversations",
      ];

    default:
      return [
        "Try refreshing the page",
        "Check your internet connection",
        "Contact support if the problem continues",
      ];
  }
}
