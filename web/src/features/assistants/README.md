# Assistants Feature

A ChatGPT-style conversational AI interface integrated with Langfuse's tracing and analytics platform.

## 🚀 How to Run and Access

### Prerequisites

- Langfuse account and project
- LLM API key (OpenAI recommended)

### Setup Steps

1. **Configure LLM API Key**: Go to Project Settings → LLM Connections → Add OpenAI key
2. **Create Langfuse API Key**: Go to Project Settings → API Keys → Create new API keys (needed for tracing)
3. **Access Assistant**: Navigate to "Assistant" in left sidebar
4. **Start Chatting**: Click "New Conversation" and send a message

### Database Setup

**Required**: Run database migrations before using the Assistant feature.

```bash
# Navigate to shared package
cd packages/shared

# Run migrations to create assistant tables
pnpm run db:migrate

# Optional: Seed with example data
pnpm run db:seed
```

### Running Locally

```bash
# Start infrastructure services (PostgreSQL, ClickHouse, Redis, MinIO)
pnpm run infra:dev:up

# Start all services (web + worker)
pnpm run dev

# OR start web app only
pnpm run dev:web

# Access at: http://localhost:3000/project/[projectId]/assistant
```

## 📋 Example API Calls

### Create a Conversation

```typescript
// Using tRPC client
const conversation = await api.assistants.createConversation.mutate({
  projectId: "proj_abc123"
});

// Response
{
  id: "conv_new123",
  projectId: "proj_abc123",
  userId: "user_456",
  title: "New Conversation",
  startedAt: "2024-01-01T11:00:00Z"
}
```

### Send a Message

```typescript
// Using tRPC client
const result = await api.assistants.sendMessage.mutate({
  conversationId: "conv_abc123",
  projectId: "proj_abc123",
  content: "How do I integrate Langfuse?"
});

// Response
{
  userMessage: {
    id: "msg_user789",
    sender: "user",
    content: "How do I integrate Langfuse?",
    timestamp: "2024-01-01T11:05:00Z"
  },
  assistantMessage: {
    id: "msg_asst790",
    sender: "assistant",
    content: "To integrate Langfuse, you can use our SDK...",
    timestamp: "2024-01-01T11:05:03Z",
    tokenCount: 124,
    traceId: "trace_xyz456"
  }
}
```

### Get Conversations

```typescript
// Using tRPC client
const conversations = await api.assistants.getConversations.query({
  projectId: "proj_abc123",
});

// Response: Array of conversations with latest message preview
```

## 🧪 Testing

```bash
# Run all assistant tests
pnpm test-async --testPathPattern="assistants-trpc"
pnpm test-sync --testPathPattern="assistants-ui"

# Test specific functionality
pnpm test-async --testNamePattern="creates conversation"
pnpm test-sync --testNamePattern="sends a message"
```

**Test Coverage**: 32+ tests covering conversation CRUD, message sending, UI interactions, error handling, and user authorization.

## 🔧 Configuration

### Assistant Configuration

```typescript
// /web/src/features/assistants/config.ts
export const DEFAULT_ASSISTANT_CONFIG = {
  name: "Default GPT",
  provider: "OpenAI",
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 1000,
} as const;
```

### Environment Variables

```bash
# Required for tracing
LANGFUSE_SECRET_KEY=your-secret-key
LANGFUSE_PUBLIC_KEY=your-public-key
LANGFUSE_HOST=http://localhost:3000
```

## 🔍 Automatic Tracing

Every assistant interaction is automatically traced with:

- **Trace ID**: Unique identifier for each turn
- **Token Usage**: Cost tracking and analytics
- **Performance**: Response times and error rates
- **Context**: Full conversation history sent to LLM

**View Traces**: Go to project Traces page → filter by `assistant-conversation-*`

## 🚨 Troubleshooting

| Problem                      | Solution                                              |
| ---------------------------- | ----------------------------------------------------- |
| **"No LLM API key found"**   | Add OpenAI API key in Project Settings → LLM Connections |
| **"Tracing not working"**    | Create Langfuse API keys in Project Settings → API Keys |
| **Assistant not responding** | Check API key validity and quota limits               |
| **Messages not appearing**   | Check browser console for tRPC errors                 |
| **Traces missing**           | Wait 5-10 seconds, check Traces with filter           |

## 🔌 API Structure

### tRPC Endpoints

```typescript
// Internal tRPC API (not REST)
api.assistants.getConversations.useQuery({ projectId });
api.assistants.getConversationMessages.useQuery({ conversationId, projectId });
api.assistants.createConversation.useMutation();
api.assistants.sendMessage.useMutation();
```

### Database Tables

- **Conversation**: `id`, `projectId`, `userId`, `title`, `startedAt`, `updatedAt`
- **Message**: `id`, `conversationId`, `sender`, `content`, `timestamp`, `tokenCount`, `traceId`
