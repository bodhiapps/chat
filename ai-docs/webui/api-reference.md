# API Reference

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

> OpenAI-compatible API endpoints for bodhi-js integration

---

## Overview

**Purpose**: This document defines the OpenAI-compatible API contract used for communicating with local LLM servers. These TypeScript interfaces serve as the specification for API requests and responses.

**API Type**: REST API with Server-Sent Events (SSE) for streaming

**Endpoints**:
- `/v1/chat/completions` - Chat completion with streaming support
- `/v1/models` - List available models
- `/v1/embeddings` - Generate embeddings (not implemented in webui)
- `/props` - Server properties and model capabilities

**Related docs**: [Model Selection](./01-model-selection.md), [Chat](./02-chat.md), [Settings](./06-settings.md)

**Note**: Type definitions below are specifications (not implementation code). Keep these embedded for API contract clarity.

---

## Base URL

```
http://localhost:8080
```

_(Configurable via API client)_

---

## Authentication

Optional API key authentication via header:

```http
Authorization: Bearer YOUR_API_KEY
```

---

## Endpoints

### Chat Completions API

> **Core endpoint for conversational AI interactions with streaming support**

**Endpoint**: `POST /v1/chat/completions`

**Purpose**: Send messages to AI model and receive streaming/non-streaming responses

#### Request Body

```typescript
interface ChatCompletionRequest {
  // Required
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | MessageContentPart[];
  }>;

  // Optional control
  stream?: boolean;                    // Default: false
  model?: string;                      // Required in multi-model mode
  return_progress?: boolean;           // Show prompt progress during streaming

  // Reasoning parameters
  reasoning_format?: 'auto' | 'none';  // Default: 'auto'

  // Generation parameters
  temperature?: number;                // Default: 0.8 (0.0-2.0)
  max_tokens?: number;                 // Default: -1 (infinite), 0 = infinite

  // Sampling parameters
  dynatemp_range?: number;             // Dynamic temperature range
  dynatemp_exponent?: number;          // Dynamic temperature exponent
  top_k?: number;                      // Default: 40 (top-k sampling)
  top_p?: number;                      // Default: 0.95 (nucleus sampling)
  min_p?: number;                      // Default: 0.05 (min-p sampling)
  xtc_probability?: number;            // XTC sampler probability
  xtc_threshold?: number;              // XTC sampler threshold
  typ_p?: number;                      // Typical sampling parameter

  // Penalty parameters
  repeat_last_n?: number;              // Tokens to consider for repetition penalty
  repeat_penalty?: number;             // Repetition penalty multiplier
  presence_penalty?: number;           // Presence penalty (-2.0 to 2.0)
  frequency_penalty?: number;          // Frequency penalty (-2.0 to 2.0)
  dry_multiplier?: number;             // DRY (Don't Repeat Yourself) multiplier
  dry_base?: number;                   // DRY base value
  dry_allowed_length?: number;         // DRY allowed length
  dry_penalty_last_n?: number;         // DRY penalty last N tokens

  // Sampler configuration
  samplers?: string[];                 // Sampler order (e.g., ["top_k", "top_p"])
  backend_sampling?: boolean;          // Use backend sampling

  // Advanced
  custom?: Record<string, unknown>;    // Custom parameters
  timings_per_token?: boolean;         // Return timing info per token
}
```

#### Message Content Types

```typescript
type MessageContentPart =
  | TextContentPart
  | ImageContentPart
  | AudioContentPart;

interface TextContentPart {
  type: 'text';
  text: string;
}

interface ImageContentPart {
  type: 'image_url';
  image_url: {
    url: string;  // Base64 data URL or HTTP URL
  };
}

interface AudioContentPart {
  type: 'input_audio';
  input_audio: {
    data: string;           // Base64 encoded audio
    format: 'wav' | 'mp3';
  };
}
```

#### Streaming Response (SSE)

**Format**: Server-Sent Events (SSE) with `data:` prefix

```typescript
interface ChatCompletionStreamChunk {
  object?: string;              // "chat.completion.chunk"
  model?: string;               // Model ID used for generation
  choices: Array<{
    model?: string;             // Per-choice model (may differ in multi-model)
    delta: {
      content?: string;         // Regular content tokens
      reasoning_content?: string;  // Reasoning/thinking tokens
      model?: string;           // Model used for this delta
      tool_calls?: ToolCallDelta[];  // Tool call deltas
    };
  }>;
  timings?: {
    prompt_n?: number;          // Prompt tokens count
    prompt_ms?: number;         // Prompt processing time (ms)
    predicted_n?: number;       // Generated tokens count
    predicted_ms?: number;      // Generation time (ms)
    cache_n?: number;           // Cached tokens count
  };
  prompt_progress?: {
    cache: number;              // Cached tokens
    processed: number;          // Processed tokens
    time_ms: number;            // Processing time
    total: number;              // Total prompt tokens
  };
}
```

**SSE Stream Format**:
```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" world"}}]}

data: {"choices":[{"delta":{"content":"!"}}],"timings":{"predicted_n":3,"predicted_ms":150}}

data: [DONE]
```

**Important SSE Parsing Rules**:
- Lines start with `data: `
- Stream ends with `data: [DONE]`
- Each line contains valid JSON (except `[DONE]`)
- Empty lines between chunks are ignored

#### Non-Streaming Response

```typescript
interface ChatCompletionResponse {
  model?: string;
  choices: Array<{
    model?: string;
    message: {
      content: string;                // Complete response
      reasoning_content?: string;     // Complete reasoning (if available)
      tool_calls?: ToolCall[];        // Tool calls (if any)
    };
  }>;
}
```

#### Tool Calls Format

```typescript
interface ToolCallDelta {
  index?: number;              // Tool call index (for streaming)
  id?: string;                 // Tool call ID
  type?: string;               // Usually "function"
  function?: {
    name?: string;             // Function name
    arguments?: string;        // JSON string of arguments (partial in streaming)
  };
}

interface ToolCall extends ToolCallDelta {
  // Complete tool call (non-streaming)
}
```

#### Error Responses

```typescript
interface ErrorResponse {
  error: {
    code: number;
    message: string;
    type?: string;
  };
}

// Context size error
interface ContextSizeError {
  code: number;
  message: string;
  type: 'exceed_context_size_error';
  n_prompt_tokens: number;     // Tokens in prompt
  n_ctx: number;               // Available context size
}
```

**Common Error Codes**:
- `400` - Bad request (invalid parameters)
- `413` - Context size exceeded
- `500` - Internal server error
- `503` - Model not loaded or unavailable

---

---

### Models List API

> **Endpoint for listing available models and their load status**

**Endpoint**: `GET /v1/models`

**Purpose**: List all available models

#### Response

```typescript
interface ModelListResponse {
  object: string;              // "list"
  data: ModelEntry[];
  models?: ModelDetails[];     // Extended details (optional)
}

interface ModelEntry {
  id: string;                  // Model identifier (e.g., "ggml-org/Qwen2.5-7B-GGUF:latest")
  name?: string;               // Model name (usually same as id)
  object: string;              // "model"
  owned_by: string;            // "llamacpp"
  created: number;             // Unix timestamp
  in_cache: boolean;           // Whether model files are in HF cache
  path: string;                // Path to model file/manifest
  status: {
    value: 'loaded' | 'unloaded' | 'loading' | 'failed';
    args?: string[];           // CLI args when loaded
  };
  meta?: Record<string, unknown>;  // Legacy metadata field
}
```

---

### 3. Model Load/Unload (Multi-Model Mode)

#### Load Model

**Endpoint**: `POST /models/load`

**Request**:
```typescript
{
  model: string;               // Model ID to load
  extra_args?: string[];       // Optional CLI arguments
}
```

**Response**:
```typescript
{
  success: boolean;
  error?: string;
}
```

#### Unload Model

**Endpoint**: `POST /models/unload`

**Request**:
```typescript
{
  model: string;               // Model ID to unload
}
```

**Response**:
```typescript
{
  success: boolean;
  error?: string;
}
```

---

---

### Server Properties API

> **Endpoint for querying server capabilities and model information**

**Endpoint**: `GET /props` or `GET /props?model=<id>&autoload=false`

**Purpose**: Fetch server configuration, model capabilities, and default settings

#### Query Parameters

- `model` - Model ID (for per-model props in multi-model mode)
- `autoload` - Set to `false` to prevent automatic model loading (default: `true`)

#### Response

```typescript
interface ServerPropsResponse {
  default_generation_settings: {
    n_ctx: number;             // Context size
    speculative: boolean;      // Speculative decoding enabled
    params: {
      // All generation parameters with their defaults
      temperature: number;
      top_k: number;
      top_p: number;
      min_p: number;
      max_tokens: number;
      repeat_penalty: number;
      presence_penalty: number;
      frequency_penalty: number;
      samplers: string[];
      reasoning_format: string;
      // ... (see full parameter list in ChatCompletionRequest)
    };
  };
  total_slots: number;         // Number of parallel slots
  model_path: string;          // Path to loaded model
  role: 'model' | 'router';    // Server mode
  modalities: {
    vision: boolean;           // Supports image input
    audio: boolean;            // Supports audio input
  };
  chat_template: string;       // Chat template format
  bos_token: string;           // Beginning-of-sequence token
  eos_token: string;           // End-of-sequence token
  build_info: string;          // Build version info
  webui_settings?: Record<string, string | number | boolean>;  // Custom webui settings
}
```

---

---

### Embeddings API (Optional)

> **Endpoint for generating text embeddings (not used in webui)**

**Endpoint**: `POST /v1/embeddings`

**Purpose**: Generate vector embeddings for text

#### Request

```typescript
{
  input: string | string[];    // Text to embed
  model?: string;              // Model ID (optional)
}
```

#### Response

```typescript
{
  object: "list";
  data: Array<{
    object: "embedding";
    embedding: number[];       // Vector embedding
    index: number;             // Index in input array
  }>;
  model: string;               // Model used
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}
```

---

## Streaming Implementation Guide

### SSE Parsing Pattern

```typescript
const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages, stream: true }),
  signal: abortSignal  // For cancellation
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';  // Keep incomplete line in buffer

  for (const line of lines) {
    if (!line.trim() || !line.startsWith('data: ')) continue;

    const data = line.slice(6);  // Remove 'data: ' prefix
    if (data === '[DONE]') {
      // Stream complete
      break;
    }

    try {
      const chunk = JSON.parse(data);

      // Extract content
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        onContentChunk(content);
      }

      // Extract reasoning
      const reasoning = chunk.choices?.[0]?.delta?.reasoning_content;
      if (reasoning) {
        onReasoningChunk(reasoning);
      }

      // Extract tool calls
      const toolCalls = chunk.choices?.[0]?.delta?.tool_calls;
      if (toolCalls) {
        onToolCallsChunk(toolCalls);
      }

      // Extract timings
      if (chunk.timings) {
        onTimings(chunk.timings);
      }

      // Extract prompt progress
      if (chunk.prompt_progress) {
        onPromptProgress(chunk.prompt_progress);
      }
    } catch (e) {
      console.error('Failed to parse SSE chunk:', e);
    }
  }
}
```

### Abort/Cancel Streaming

```typescript
const abortController = new AbortController();

// Start streaming with abort signal
fetch('/v1/chat/completions', {
  signal: abortController.signal,
  // ... other options
});

// Cancel at any time
abortController.abort();
```

---

## Parameter Defaults

### Standard Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `temperature` | 0.8 | 0.0-2.0 | Randomness in output |
| `max_tokens` | -1 | -1 or > 0 | Max tokens to generate (-1 = infinite) |
| `top_k` | 40 | > 0 | Top-k sampling |
| `top_p` | 0.95 | 0.0-1.0 | Nucleus sampling |
| `min_p` | 0.05 | 0.0-1.0 | Min-p sampling |
| `repeat_penalty` | 1.0 | 0.0-2.0 | Repetition penalty |
| `presence_penalty` | 0.0 | -2.0-2.0 | Presence penalty |
| `frequency_penalty` | 0.0 | -2.0-2.0 | Frequency penalty |

---

## Model Capabilities Detection

### Vision Models

Check `modalities.vision` in `/props` response:
```typescript
if (props.modalities.vision) {
  // Enable image attachments
}
```

### Audio Models

Check `modalities.audio` in `/props` response:
```typescript
if (props.modalities.audio) {
  // Enable audio attachments
}
```

---

## Error Handling Best Practices

1. **Context Size Errors**: Check `n_prompt_tokens` vs `n_ctx` in error response
2. **Model Loading**: Poll model status before sending requests
3. **Streaming Failures**: Implement reconnection logic with exponential backoff
4. **Abort Handling**: Always use AbortController for user-initiated cancellation
5. **Partial Responses**: Save partial content before aborting (see requirements)

---

## Notes

- All timestamps are Unix timestamps (seconds since epoch)
- Base64 data URLs for images follow format: `data:image/jpeg;base64,{data}`
- Audio data URLs: `data:audio/wav;base64,{data}`
- Tool calls are aggregated incrementally in streaming mode (merge by index)
- Reasoning content is separate from regular content (display in collapsible blocks)

---

_Updated: Phase api completed_
