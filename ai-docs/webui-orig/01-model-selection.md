# Feature: Model Selection

> Priority: 1 | Status: Core Feature

---

## Overview

Model selection enables users to choose which AI model to use for conversations. The feature adapts its behavior based on server mode:
- **Single-model mode**: Display model info, no switching
- **Multi-model mode**: Dropdown selector with auto-loading and capability filtering

**Related docs**: [API Reference](./api-reference.md) (/v1/models, /props endpoints), [Attachments](./03-attachments.md) (capability validation), [Chat](./02-chat.md) (model context)

---

## Functional Requirements

### User Should Be Able To

1. 🔄 **View Available Models**
   - ✅ See list of all available models
   - ❌ Identify which models are currently loaded/unloaded
   - ❌ Search/filter models by name or identifier
   - ❌ See model capabilities (vision, audio support)

2. 🔄 **Select a Model**
   - ✅ Choose a model from dropdown (multi-model mode)
   - ❌ Selection auto-loads model if not already loaded
   - ❌ System prevents selecting incompatible models when content requires specific capabilities
   - ✅ Input focus returns to chat after selection

3. ❌ **View Model Information**
   - ❌ Click model name to see detailed information (single-model mode only)
   - ❌ View context size, parameters, modalities
   - ❌ See model path and build info
   - ❌ Copy model filename to clipboard

4. ❌ **Manage Loaded Models**
   - ❌ See which models are currently loaded (green indicator)
   - ❌ Unload models to free resources (multi-model mode)
   - ❌ View loading progress (spinner indicator)
   - ❌ See failed model states

5. ❌ **Handle Model Compatibility**
   - ❌ System disables models that don't support required content types
   - ❌ Visual indicators show missing capabilities (eye-off, mic-off icons)
   - ❌ Tooltips explain why model is incompatible
   - ❌ Incompatible models appear greyed out but remain visible

---

## System Should

1. ❌ **Auto-load Models** (multi-model mode)
   - ❌ Automatically load selected model if not already running
   - ❌ Poll model status until loaded (30 second timeout)
   - ❌ Fetch model capabilities after successful load
   - ❌ Show loading state during operation

2. ❌ **Track Model Status**
   - ❌ Monitor: `loaded`, `loading`, `unloaded`, `failed` states
   - ❌ Update status in real-time
   - ❌ Display appropriate indicators per state

3. ❌ **Validate Capabilities**
   - ❌ Check model modalities before allowing selection
   - ❌ Required modalities determined by message content:
     - Vision: If message contains images
     - Audio: If message contains audio
   - ❌ Cache modality information per model

4. 🔄 **Handle Edge Cases**
   - ❌ Show "not available" state for models that exist in conversation but not in cache
   - ❌ Display error messages for failed operations
   - ❌ Gracefully handle load/unload failures
   - ✅ Maintain selection state across page reloads

---

## UI Components Needed

### Model Selector (Multi-Model Mode)

**Trigger Button**:
- Package icon
- Current model name (truncated if long)
- Loading spinner OR chevron down icon
- Click opens dropdown popover

**Dropdown Popover**:
- Search input at top (keyboard navigable)
- Scrollable model list
- Per-model display:
  - Model name (primary)
  - Status indicator (dot)
  - Missing capability icons (if incompatible)
  - Loading spinner (if loading)
  - Unload button (if loaded, shows on hover)
- "Not available" section for unavailable models
- Keyboard navigation (arrow keys, Enter)

**Model List Item States**:
```
Loaded:       [●] Model Name          [🔴] (hover: unload)
Loading:      [⟳] Model Name
Unloaded:     [○] Model Name
Incompatible: [○] Model Name 🚫👁️ 🚫🎤  (greyed out)
Not Available: Model Name (not available)  (red background, disabled)
```

### Model Info Button (Single-Model Mode)

**Trigger Button**:
- Package icon
- Model name
- Click opens modal dialog

**Modal Dialog**:
- Title: "Model Information"
- Sections:
  - **Model**: Filename with copy button
  - **Context**: Context size (formatted)
  - **Modalities**: Vision/Audio badges
  - **Details**: Parameters, embedding size, vocab size
  - **Path**: Full file path
  - **Advanced**: Chat template (collapsible code block)
- Close button

---

## API Integration

### List Models

**Endpoint**: `GET /v1/models`

**Response**:
```typescript
{
  object: "list",
  data: Array<{
    id: string;
    name?: string;
    status: {
      value: 'loaded' | 'unloaded' | 'loading' | 'failed';
      args?: string[];
    };
    in_cache: boolean;
    path: string;
  }>
}
```

**Usage**:
- Fetch on app initialization
- Poll periodically if models are loading
- Update local state with status changes

### Get Model Properties

**Endpoint**: `GET /props?model=<id>&autoload=false`

**Response**:
```typescript
{
  default_generation_settings: {
    n_ctx: number;  // Context size
    // ... other params
  };
  modalities: {
    vision: boolean;
    audio: boolean;
  };
  model_path: string;
  // ... other props
}
```

**Usage**:
- Fetch after model loads
- Cache modalities per model
- Use for capability validation

### Load Model (Multi-Model Mode Only)

**Endpoint**: `POST /models/load`

**Request**:
```typescript
{
  model: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Flow**:
1. Call `/models/load` with model ID
2. Poll `/v1/models` until status becomes `loaded` (500ms interval, 60 attempts max)
3. Fetch `/props?model=<id>` to get capabilities
4. Update local cache with modalities
5. Handle errors with user notification

### Unload Model (Multi-Model Mode Only)

**Endpoint**: `POST /models/unload`

**Request**:
```typescript
{
  model: string;
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

## State Management

### Global State

```typescript
{
  // All available models
  models: ModelOption[];

  // Currently selected model (user preference)
  selectedModelId: string | null;
  selectedModelName: string | null;

  // Router mode status (multi-model only)
  routerModels: ApiModelDataEntry[];
  modelLoadingStates: Map<string, boolean>;

  // Capability cache
  modelPropsCache: Map<string, ServerProps>;
  propsCacheVersion: number;  // For reactivity

  // Operation state
  updating: boolean;
  error: string | null;
}
```

### Derived State

- `loadedModelIds`: Array of model IDs with status='loaded'
- `isModelLoaded(id)`: Check if specific model is loaded
- `getModelStatus(id)`: Get status for specific model
- `getModelModalities(id)`: Get vision/audio support
- `isModelCompatible(id, requiredModalities)`: Validate against content

---

## Behavior Specifications

### Model Selection Flow

**In New Conversation**:
1. User clicks model selector
2. Dropdown opens with search focused
3. User searches/scrolls to find model
4. User clicks model (or presses Enter on highlighted)
5. If model unloaded → System auto-loads model (show loading state)
6. On successful load → Model selected, dropdown closes, chat input focuses
7. On failure → Error toast, dropdown stays open

**In Existing Conversation with Regeneration**:
1. User clicks model selector on existing message
2. Dropdown opens
3. User selects different model
4. Callback validates: Can this model handle the message content?
5. If valid → Model switched, message regenerated
6. If invalid → Error message, dropdown stays open

### Capability Validation

**Automatic Modality Detection**:
```
Message has images + text → Requires vision=true
Message has audio        → Requires audio=true
Message is text-only     → No requirements
```

**Validation Logic**:
```
For each model in list:
  1. Get model modalities from cache
  2. If modalities unknown AND model is loaded:
       - Assume incompatible (safe default)
  3. If vision required AND model.vision=false:
       - Mark incompatible, show eye-off icon
  4. If audio required AND model.audio=false:
       - Mark incompatible, show mic-off icon
  5. If compatible:
       - Enable selection
  6. If incompatible:
       - Grey out, show icons, add tooltip
```

### Loading Behavior

**Status Polling**:
- Interval: 500ms
- Max attempts: 60 (30 seconds total)
- After load request: Poll until status='loaded'
- After unload request: Poll until status='unloaded'
- On timeout: Log warning, stop polling

**Post-Load Actions**:
1. Fetch model properties (`/props?model=<id>`)
2. Extract modalities
3. Update model option with modalities
4. Increment cache version (trigger reactivity)

### Keyboard Navigation

**In Search Input**:
- `ArrowDown`: Highlight next compatible model
- `ArrowUp`: Highlight previous compatible model
- `Enter`: Select highlighted model
- `Escape`: Close dropdown
- Typing: Filter model list

**In Model List**:
- Click: Select model
- Hover: Show unload button (if loaded)

---

## Error Handling

### Load Failures

**User Experience**:
1. Show error toast: "Failed to load model: {error message}"
2. Model status shows as 'failed'
3. User can retry by selecting again
4. Dropdown remains open

**Recovery**:
- Allow user to select different model
- Provide "Retry" option in error state

### Unavailable Models

**Scenario**: Conversation references model not in current cache

**User Experience**:
1. Show model at top of dropdown (red background)
2. Label: "{model name} (not available)"
3. Option is disabled (not selectable)
4. Separator line below
5. User must select different model to continue

### Network Errors

**User Experience**:
- Toast notification: "Failed to fetch models"
- Retry button in error state
- Show last cached model list if available

---

## Testing Considerations

### Unit Tests

1. **Model Listing**
   - Test grouping loaded vs unloaded models
   - Test search/filter functionality
   - Test status indicators per state

2. **Selection Logic**
   - Test selection with auto-load
   - Test selection without auto-load (already loaded)
   - Test selection validation callback
   - Test focus restoration after selection

3. **Capability Detection**
   - Test vision modality requirement
   - Test audio modality requirement
   - Test compatibility validation
   - Test missing modality indicators

4. **Status Polling**
   - Test successful load poll
   - Test timeout after 30 seconds
   - Test status transitions
   - Test concurrent operations

### Integration Tests

1. **End-to-End Flow**
   - Select unloaded model → Verify auto-load → Verify selection
   - Select loaded model → Verify immediate selection
   - Unload model → Verify status update
   - Switch between models → Verify state consistency

2. **Error Scenarios**
   - Load failure → Verify error display
   - Network timeout → Verify recovery
   - Invalid model ID → Verify error handling

### Visual Tests

1. **Status Indicators**
   - Screenshot loaded state (green dot)
   - Screenshot loading state (spinner)
   - Screenshot unloaded state (grey dot)
   - Screenshot incompatible state (greyed + icons)
   - Screenshot unavailable state (red background)

2. **Hover States**
   - Unload button appears on hover (loaded models)
   - Tooltip appears on incompatible models

---

## Accessibility

### Keyboard Navigation

- **Tab**: Focus search input, then model options
- **ArrowUp/Down**: Navigate model list
- **Enter**: Select highlighted model
- **Escape**: Close dropdown
- All interactive elements keyboard accessible

### Screen Reader Support

- Model selector labeled: "Model selector"
- Search input labeled: "Search models"
- Model status announced: "Model name, loaded" / "Model name, loading"
- Incompatible models: "Model name, missing vision support"
- Loading state: "Loading models..."

### Focus Management

- Focus trap in open dropdown
- Focus returns to trigger after close
- Focus moves to chat input after selection
- Search input auto-focused on dropdown open

---

## Responsive Design

### Desktop (>768px)

- Model selector in header/toolbar
- Dropdown width: 400px
- Model names display full text with ellipsis
- Unload button visible on hover

### Mobile (<768px)

- Model selector in compact header
- Dropdown width: 90vw (centered)
- Model names truncate shorter
- Unload button always visible (no hover state)
- Touch-optimized hit targets (44px min)

### Tablet (768px-1024px)

- Hybrid approach
- Dropdown width: 60vw
- Balance between desktop and mobile patterns

---

## Implementation Notes

### React Adaptations

**State Management**:
- Use React hooks instead of Svelte stores
- `useState` for local component state
- Context or global store for shared model state
- `useEffect` for polling logic

**Reactivity**:
- Replace Svelte `$derived` with `useMemo`
- Replace Svelte `$effect` with `useEffect`
- Increment cache version to trigger re-renders

**Component Structure**:
```
<ModelSelector>
  ├── <ModelSelectorTrigger />     // Button
  ├── <ModelSelectorDropdown />    // Popover content
  │   ├── <SearchInput />
  │   └── <ModelList />
  │       └── <ModelListItem />    // Per model
  └── <ModelInfoDialog />          // Single-model mode only
```

### Performance Considerations

1. **Virtualization**: For large model lists (>50 models), implement virtual scrolling
2. **Debounce**: Debounce search input (300ms)
3. **Caching**: Cache modality fetch results (don't refetch on every render)
4. **Polling**: Stop polling when component unmounts

### Existing bodhiapps/chat Integration

**Current State**:
- Has basic model selector in `ChatDemo.tsx`
- Uses `client.models.list()` from bodhi-js-react
- No capability detection yet
- No auto-loading (single model mode assumed)

**Migration Path**:
1. Extract model selector into separate component
2. Add multi-model mode detection
3. Implement auto-loading for multi-model mode
4. Add capability detection and validation
5. Add model information dialog for single-model mode

---

_Updated: Phase model-selection completed_
