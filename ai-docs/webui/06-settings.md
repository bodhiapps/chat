# Feature: Settings

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

> Priority: 6 | Status: Core Feature | **Implementation: ❌ Not Implemented**

---

## Overview

Settings system provides configuration for generation parameters, UI behavior, theme, and experimental features with localStorage persistence and server default synchronization.

**Related docs**: [API Reference](./api-reference.md), [Chat](./02-chat.md), [Persistence](./07-persistence.md)

**Current Status**: No custom settings UI. Only BodhiProvider setup modal exists for connection configuration.

---

## User Stories

- ❌ **As a user**, I can configure generation parameters (temperature, top_p, etc.) so that I control AI response characteristics

- ❌ **As a user**, I can set a global system message so that all conversations have consistent context

- ❌ **As a user**, I can customize UI behavior (theme, auto-scroll, stats display) so that the interface suits my preferences

- ❌ **As a user**, I can import/export settings so that I can share or backup my configuration

- ❌ **As a user**, I can reset settings to defaults so that I can recover from misconfiguration

- ❌ **As a user**, settings persist across sessions so that I don't need to reconfigure on each visit

---

## Functional Requirements

### Settings Management

**Behavior**: User can modify and persist configuration
- Open settings dialog from header/menu
- Navigate tabs: General, Display, Sampling, Penalties, Developer
- Edit values in form fields (text, number, checkbox, select, textarea)
- Changes auto-save to localStorage immediately
- Close dialog to apply settings

**Edge Cases**:
- Invalid numeric values → Show validation error, prevent save
- Invalid JSON in custom params → Show error, prevent save
- Storage quota exceeded → Show error, suggest clearing data

### Server Synchronization

**Behavior**: Sync defaults from server on app init
- Fetch `/props` endpoint on startup
- Extract `default_generation_settings.params`
- Update defaults in memory
- Preserve user overrides (values different from server defaults)
- Show "Custom" badge on overridden parameters

**Normalization**: Compare floats with 6-decimal precision to detect overrides

### Import/Export

**Behavior**: Save/restore settings as JSON file
- **Export**: Download settings JSON file with timestamp
- **Import**: Load settings from JSON file, validate keys, merge with current config
- Only accept known keys, ignore unknown fields

### Reset

**Behavior**: Restore default values
- **Reset All**: Restore all settings to server defaults (fallback to webui defaults)
- **Reset Single**: Inline button on each parameter, restores single value

---

## Settings Categories

### 1. General
- `theme`: 'system' | 'light' | 'dark' (default: 'system')
- `apiKey`: string (optional, for `--api-key` mode)
- `systemMessage`: string (global system prompt)
- `pasteLongTextToFileLen`: number (default: 2500)
- `copyTextAttachmentsAsPlainText`: boolean (default: false)
- `pdfAsImage`: boolean (default: false)
- `askForTitleConfirmation`: boolean (default: false)
- `enableContinueGeneration`: boolean (experimental, default: false)

### 2. Display
- `showMessageStats`: boolean (default: true)
- `showThoughtInProgress`: boolean (default: false)
- `keepStatsVisible`: boolean (default: false)
- `renderUserContentAsMarkdown`: boolean (default: false)
- `disableAutoScroll`: boolean (default: false)
- `alwaysShowSidebarOnDesktop`: boolean (default: false)
- `autoShowSidebarOnNewChat`: boolean (default: true)
- `autoMicOnEmpty`: boolean (experimental, default: false)

### 3. Sampling
- `temperature`: number (default: 0.8, range: 0.0-2.0)
- `dynatemp_range`: number (default: 0.0)
- `dynatemp_exponent`: number (default: 1.0)
- `top_k`: number (default: 40)
- `top_p`: number (default: 0.95, range: 0.0-1.0)
- `min_p`: number (default: 0.05, range: 0.0-1.0)
- `xtc_probability`: number (default: 0.0)
- `xtc_threshold`: number (default: 0.1)
- `typ_p`: number (default: 1.0)
- `max_tokens`: number (default: -1, -1 = infinite)
- `samplers`: string (default: 'top_k;typ_p;top_p;min_p;temperature')
- `backend_sampling`: boolean (default: false)

### 4. Penalties
- `repeat_last_n`: number (default: 64)
- `repeat_penalty`: number (default: 1.0)
- `presence_penalty`: number (default: 0.0, range: -2.0 to 2.0)
- `frequency_penalty`: number (default: 0.0, range: -2.0 to 2.0)
- `dry_multiplier`: number (default: 0.0)
- `dry_base`: number (default: 1.75)
- `dry_allowed_length`: number (default: 2)
- `dry_penalty_last_n`: number (default: -1)

### 5. Developer
- `showToolCalls`: boolean (default: false)
- `disableReasoningFormat`: boolean (default: false)
- `custom`: string (JSON for custom params, default: '')

---

## Data Model

**Storage Keys**:
- `LlamaCppWebui.config`: All settings JSON object
- `LlamaCppWebui.userOverrides`: Array of keys where user overrode defaults

**Config Structure**:
```typescript
{
  theme: 'dark',
  temperature: 0.8,
  systemMessage: 'You are helpful',
  showMessageStats: true,
  // ... all 44+ parameters
}
```

**User Overrides Tracking**:
```typescript
['temperature', 'top_p', 'systemMessage']  // Keys user customized
```

---

## Acceptance Criteria

### Scenario: Change temperature setting

- **GIVEN** user opens settings dialog
- **WHEN** user navigates to Sampling tab
- **AND** changes temperature from 0.8 to 1.0
- **THEN** setting saves to localStorage immediately
- **AND** "Custom" badge appears next to temperature field
- **WHEN** user closes dialog and sends message
- **THEN** API request includes `temperature: 1.0`

### Scenario: Reset single parameter

- **GIVEN** user has customized temperature to 1.0
- **WHEN** user clicks reset button next to temperature
- **THEN** temperature reverts to server default (or 0.8 if no server default)
- **AND** "Custom" badge disappears
- **AND** setting saves to localStorage

### Scenario: Export settings

- **GIVEN** user has customized multiple settings
- **WHEN** user clicks "Export Settings"
- **THEN** JSON file downloads with filename `llamacpp-settings-{timestamp}.json`
- **AND** file contains all current settings

### Scenario: Import settings

- **GIVEN** user has exported settings file
- **WHEN** user clicks "Import Settings" and selects file
- **THEN** settings are loaded from JSON
- **AND** valid keys are merged into config
- **AND** invalid/unknown keys are ignored
- **AND** localStorage is updated
- **AND** success toast appears

### Scenario: Server default sync

- **GIVEN** server has default temperature of 0.7
- **WHEN** app initializes and fetches `/props`
- **THEN** temperature default updates to 0.7
- **WHEN** user has overridden temperature to 1.0
- **THEN** user override is preserved (not reset to 0.7)
- **AND** "Custom" badge still shows on temperature

### Scenario: Validation error

- **GIVEN** user opens settings
- **WHEN** user enters "abc" in temperature field
- **THEN** validation error appears below field
- **AND** field highlights in red
- **AND** cannot close dialog until fixed

---

## Reference Implementation

> **Svelte Source**: llama.cpp webui uses Svelte 5 stores for settings. Adapt to React patterns.

**Key Files**:
- `$webui-folder/src/lib/stores/settings.svelte.ts` - Settings state, localStorage sync
- `$webui-folder/src/lib/services/parameter-sync.ts` - Server default synchronization
- `$webui-folder/src/lib/components/app/dialogs/SettingsDialog.svelte` - Settings UI

> **Note**: Svelte `$state` runes should be adapted to React `useState` or Context.

### Auto-save Algorithm

```
1. On field change (onChange event):
   - Update config object with new value
   - Save entire config to localStorage as JSON
   - If value differs from default:
     - Add key to userOverrides set
   - Else:
     - Remove key from userOverrides set
   - Save userOverrides to localStorage
```

### Server Sync Algorithm

```
1. On app init: fetch /props endpoint
2. Extract default_generation_settings.params
3. For each param in server defaults:
   - Normalize float values to 6 decimal places
   - If key NOT in userOverrides:
     - Update default value in config
   - If key in userOverrides:
     - Keep user's custom value
4. Update UI to show "Custom" badges
```

### Validation Pattern

```
1. On field blur or form submit:
   - Parse value based on type (parseFloat for numbers)
   - Check for NaN (invalid numeric)
   - Check range constraints (e.g., temperature 0.0-2.0)
   - If valid: save to config
   - If invalid: show error, prevent save
```

### Import/Export Pattern

**Export**:
```
1. Stringify config object with JSON.stringify(config, null, 2)
2. Create Blob with type 'application/json'
3. Create download link with timestamp filename
4. Trigger download
```

**Import**:
```
1. Open file picker (.json files)
2. Read file as text
3. Parse JSON
4. Validate keys (only accept known keys)
5. Merge into current config
6. Save to localStorage
```

See `$webui-folder/src/lib/stores/settings.svelte.ts` for full implementation.

---

## UI Components

### Settings Dialog
- Modal overlay with tabs (General, Display, Sampling, Penalties, Developer)
- Scrollable content area
- Form fields: text input, number input, checkbox, select dropdown, textarea
- Footer with Save/Reset buttons

### Field Types Needed
- **Text input**: apiKey, systemMessage
- **Number input**: temperature, top_p, max_tokens, penalties
- **Checkbox**: boolean flags (showMessageStats, etc.)
- **Select**: theme dropdown
- **Textarea**: systemMessage (multi-line), custom params (JSON)

### Parameter Badge
- Shows "Custom" when value differs from default
- Inline reset button next to custom values
- Tooltip showing default value

---

## Accessibility

**Keyboard Navigation**:
- Tab through all form fields
- Enter to save, Escape to cancel
- Focus trap in dialog

**Screen Reader**:
- Label all inputs with clear descriptions
- Announce validation errors
- Describe parameter ranges and defaults

---

## Verification

**Manual Testing**:
1. Change temperature → Close dialog → Reopen → Verify persisted
2. Reset temperature → Verify default restored, badge removed
3. Export settings → Import → Verify all settings match
4. Fetch /props → Verify server defaults synced
5. Override default → Sync again → Verify override preserved
6. Enter invalid number → Verify validation error shown

---

_Updated: Revised for functional focus, reduced code ratio_
