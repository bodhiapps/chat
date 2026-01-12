# Feature: Model Selection

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

> Priority: 1 | Status: Core Feature | **Implementation: 🔄 Basic**

---

## Overview

Model selection enables users to choose which AI model to use for conversations. The feature adapts based on server mode: single-model displays model info, multi-model provides a dropdown selector with auto-loading and capability filtering.

**Related docs**: [API Reference](./api-reference.md), [Attachments](./03-attachments.md), [Chat](./02-chat.md)

**Current Status**: List + select + refresh working; missing: auto-load, capabilities, model info dialog

---

## User Stories

- 🔄 **As a user**, I can view available models so that I know what AI models I can use for conversations
  - ✅ See list of all available models
  - ❌ Identify which models are currently loaded/unloaded
  - ❌ Search/filter models by name or identifier
  - ❌ See model capabilities (vision, audio support)

- 🔄 **As a user**, I can select a model from a dropdown so that I can switch between different models
  - ✅ Choose a model from dropdown (multi-model mode)
  - ❌ Selection auto-loads model if not already loaded
  - ❌ System prevents selecting incompatible models when content requires specific capabilities
  - ✅ Input focus returns to chat after selection

- ❌ **As a user**, I can see which models support vision or audio so that I can choose compatible models for my content

- ❌ **As a user**, I can view detailed model information so that I understand the model's capabilities and specifications

- ❌ **As a user**, I can manage loaded models (load/unload) so that I can optimize resource usage

- ❌ **As a user**, the system prevents me from selecting incompatible models so that my content (images/audio) works correctly

---

## Functional Requirements

### Server Mode Detection

**Behavior**: Application adapts UI based on server mode
- **Single-model mode**: Display model info button → opens modal with details
- **Multi-model mode**: Display dropdown selector → enables model switching, loading, unloading

**Determination**: Via `/props` endpoint `router_mode` field

### Model Listing

**Behavior**: Display all available models with status indicators
- ✅ Show model name, status (loaded/unloaded/loading/failed)
- ❌ Group loaded models above unloaded
- ❌ Filter models by search query
- ❌ Show loading states (spinner) and status indicators (colored dots)

**Edge Cases**:
- ❌ Model in conversation but not in cache → Show as "not available" (red background, disabled)
- ❌ Network error fetching models → Show error state with retry option
- ❌ Empty model list → Show empty state message

### Model Selection

**Behavior**: User selects model → system responds based on load state
- ✅ If model loaded → Select immediately, close dropdown
- ❌ If model unloaded → Auto-load model, show loading state, then select
- ✅ After selection → Focus returns to chat input
- ❌ Selection persists across page reloads

**Edge Cases**:
- Load fails → Show error toast, keep dropdown open, allow retry
- Load timeout (30s) → Show timeout error
- Network error during load → Show error, allow retry

### Capability Validation

**Behavior**: System validates model capabilities against message content requirements
- ❌ **Vision required** (message has images) → Only enable vision-capable models
- ❌ **Audio required** (message has audio) → Only enable audio-capable models
- ❌ **Text only** → All models enabled
- ❌ Incompatible models → Grey out, show missing capability icons (eye-off, mic-off), add tooltip

**Modality Detection**:
```
Message has images → Requires vision=true
Message has audio  → Requires audio=true
Message text-only  → No requirements
```

### Model Loading/Unloading (Multi-Model Mode)

**Behavior**: User can manually load/unload models
- ❌ **Load**: Click unloaded model → System loads model → Show loading spinner → Update status
- ❌ **Unload**: Hover loaded model → Show unload button → Click → Model unloads
- ❌ **Polling**: System polls `/v1/models` every 500ms until status changes (max 60 attempts = 30s)
- ❌ **Post-load**: Fetch model properties to get capabilities

**Edge Cases**:
- ❌ Concurrent load requests → Queue or block
- ❌ Unload currently selected model → Warn user or prevent
- ❌ Load timeout → Log warning, show timeout state

### Model Information (Single-Model Mode)

**Behavior**: Click model name → Open modal with detailed info
- ❌ Display: model filename, context size, modalities (vision/audio), parameters, path
- ❌ Copy model filename to clipboard
- ❌ Show chat template in collapsible section
- ❌ Close modal button

---

## Data Model

**Entities**:
- **ModelOption**: Represents an available model
  - `id` (string): Unique model identifier
  - `name` (string): Display name
  - `status` (enum): loaded | unloaded | loading | failed
  - `in_cache` (boolean): Whether model exists in cache
  - `modalities` (object): `{ vision: boolean, audio: boolean }`
  - `path` (string): File system path

**State**:
- `models`: Array of ModelOption
- `selectedModelId`: Currently selected model ID (persisted)
- `modelPropsCache`: Map of model ID → properties (for capabilities)
- `modelLoadingStates`: Map of model ID → loading boolean

**Storage**: Selected model ID persisted to localStorage

---

## Acceptance Criteria

### Scenario: View available models

- **GIVEN** application is initialized
- **WHEN** user clicks model selector
- **THEN** dropdown opens with list of all available models
- **AND** models show status indicators (loaded/unloaded/loading)

### Scenario: Select loaded model

- **GIVEN** user opens model dropdown
- **WHEN** user clicks a model that is already loaded
- **THEN** model is selected immediately
- **AND** dropdown closes
- **AND** focus returns to chat input

### Scenario: Select unloaded model (multi-model mode)

- **GIVEN** user opens model dropdown in multi-model mode
- **WHEN** user clicks an unloaded model
- **THEN** system initiates model loading
- **AND** loading spinner appears
- **WHEN** model finishes loading (status becomes 'loaded')
- **THEN** model is selected
- **AND** dropdown closes

### Scenario: Prevent incompatible model selection

- **GIVEN** message contains images (requires vision)
- **WHEN** user opens model dropdown
- **THEN** models without vision support are greyed out
- **AND** eye-off icon appears next to incompatible models
- **AND** tooltip explains "Model does not support vision"
- **WHEN** user clicks incompatible model
- **THEN** selection is prevented

### Scenario: Handle load failure

- **GIVEN** user selects an unloaded model
- **WHEN** model load request fails
- **THEN** error toast appears with failure message
- **AND** model status shows 'failed'
- **AND** dropdown remains open
- **AND** user can select a different model or retry

### Scenario: Search models

- **GIVEN** dropdown is open with many models
- **WHEN** user types in search input
- **THEN** model list filters to show only matching models
- **AND** user can navigate filtered list with arrow keys

### Scenario: Unload model (multi-model mode)

- **GIVEN** a model is loaded
- **WHEN** user hovers over model in dropdown
- **THEN** unload button appears
- **WHEN** user clicks unload button
- **THEN** model begins unloading
- **AND** status updates to 'unloaded' when complete

### Scenario: View model information (single-model mode)

- **GIVEN** application is in single-model mode
- **WHEN** user clicks model info button
- **THEN** modal opens with model details
- **AND** modal shows: filename, context size, modalities, parameters, path
- **WHEN** user clicks copy button
- **THEN** model filename is copied to clipboard

---

## API Integration

### List Models: `GET /v1/models`

**Response**:
```typescript
{
  object: "list",
  data: Array<{
    id: string;
    name?: string;
    status: {
      value: 'loaded' | 'unloaded' | 'loading' | 'failed';
    };
    in_cache: boolean;
  }>
}
```

### Get Model Properties: `GET /props?model=<id>`

**Response**:
```typescript
{
  default_generation_settings: {
    n_ctx: number;
  };
  modalities: {
    vision: boolean;
    audio: boolean;
  };
  model_path: string;
}
```

### Load Model: `POST /models/load`

**Request**: `{ model: string }`
**Response**: `{ success: boolean, error?: string }`

**Loading Flow**:
1. Call `/models/load` with model ID
2. Poll `/v1/models` every 500ms until status='loaded' (max 60 attempts)
3. Fetch `/props?model=<id>` for capabilities
4. Cache modalities

### Unload Model: `POST /models/unload`

**Request**: `{ model: string }`
**Response**: `{ success: boolean, error?: string }`

---

## UI Components

### Model Selector (Multi-Model Mode)

**Trigger Button**: Package icon + model name + chevron/spinner

**Dropdown**:
- Search input (keyboard navigable)
- Scrollable model list with per-model:
  - Status indicator: `[●]` loaded, `[○]` unloaded, `[⟳]` loading
  - Missing capability icons: 🚫👁️ (no vision), 🚫🎤 (no audio)
  - Unload button (hover on loaded models)
- "Not available" section (red background, disabled)

### Model Info Button (Single-Model Mode)

**Modal**: Title + sections for model, context, modalities, details, path, chat template (collapsible)

---

## Reference Implementation

> **Svelte Source**: llama.cpp webui uses Svelte 5 runes for state management. Adapt to React patterns.

**Key Files**:
- `$webui-folder/src/lib/stores/models.svelte.ts` - Model state management, loading logic
- `$webui-folder/src/lib/components/app/models/ModelSelector.svelte` - Dropdown UI component
- `$webui-folder/src/lib/services/models.ts` - API calls for list/load/unload

**React Component Structure**:
```
<ModelSelector>
  ├── <ModelSelectorTrigger />
  ├── <ModelSelectorDropdown />
  │   ├── <SearchInput />
  │   └── <ModelList />
  │       └── <ModelListItem />
  └── <ModelInfoDialog />
```

> **Note**: Svelte patterns like `$state`, `$derived` should be adapted to React `useState`, `useMemo`, `useEffect`.

**Capability Validation Algorithm**:
```
1. Extract required modalities from message (images→vision, audio→audio)
2. For each model: fetch modalities from cache
3. If model missing required modality: mark incompatible, show icon
4. Grey out incompatible models, show tooltip
5. Prevent selection of incompatible models
```

**Status Polling Pattern**:
```
1. Start polling after load/unload request
2. Poll /v1/models every 500ms
3. Check if target model reached desired status
4. Stop after 60 attempts (30s timeout) or success
5. Fetch properties after successful load
```

---

## Accessibility

**Keyboard Navigation**:
- Tab to focus search, arrow keys to navigate list, Enter to select, Escape to close
- All elements keyboard accessible

**Screen Reader**:
- Model selector labeled: "Model selector"
- Status announced: "Model name, loaded" / "Model name, loading"
- Incompatible models: "Model name, missing vision support"

**Focus Management**:
- Focus trap in dropdown
- Focus returns to trigger on close
- Focus moves to chat input after selection

---

## Responsive Design

| Breakpoint | Dropdown Width | Unload Button |
|------------|----------------|---------------|
| Desktop (>768px) | 400px | On hover |
| Tablet (768px-1024px) | 60vw | On hover |
| Mobile (<768px) | 90vw | Always visible |

---

## Performance Considerations

- **Virtualization**: For >50 models, use virtual scrolling
- **Debounce**: Search input debounced 300ms
- **Caching**: Cache modality fetches, don't refetch on re-render
- **Polling**: Stop polling on component unmount

---

## Verification

**Manual Testing**:
1. Start app → Open model selector → Verify all models listed
2. Select unloaded model → Verify loading spinner → Verify auto-load → Verify selection
3. Add image to message → Open selector → Verify non-vision models greyed out
4. Hover loaded model → Verify unload button appears → Click → Verify unload
5. Search for model name → Verify filtered list
6. (Single-model) Click model info → Verify modal with details

---

_Updated: Revised for functional focus, reduced code ratio_
