# Feature: Settings

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

> Priority: 6 | Status: Core Feature | **Implementation: ✅ Implemented**

---

## Overview

Settings system provides configuration for generation parameters, UI behavior, theme, and experimental features with localStorage persistence and server default synchronization.

**Related docs**: [API Reference](./api-reference.md), [Chat](./02-chat.md), [Persistence](./07-persistence.md)

**Current Status**: ✅ Settings UI implemented with 4-tab dialog (General, Sampling, Penalties, Display), IndexedDB persistence per user via SettingsContext, and ThemeProvider for theme management.

**Implementation Date**: 2026-01-12

**What's Implemented**:
- ✅ 4-tab settings dialog (General, Sampling, Penalties, Display)
- ✅ Theme system (light/dark/system) with real-time switching
- ✅ Generation parameters (10 params) applied to chat API
- ✅ System message injection into conversations
- ✅ Display settings (auto-scroll, sidebar behavior)
- ✅ Per-user settings isolation (userId-scoped)
- ✅ IndexedDB persistence via Dexie (userSettings table)
- ✅ Auto-save on every setting change
- ✅ Numeric validation with range constraints
- ✅ Deep merge for partial setting updates
- ✅ E2E test coverage (SettingsSection page object + settings.spec.ts)

**Deferred Features**:
- ⏸️ Server defaults synchronization (requires /props endpoint enhancement)
- ⏸️ Import/export settings as JSON
- ⏸️ Reset buttons (resetAllToDefaults exists but no UI)
- ⏸️ "Custom" badges for overridden params
- ⏸️ API key field (for --api-key mode)
- ⏸️ Advanced samplers (dynatemp, XTC, DRY)
- ⏸️ Custom parameters JSON field
- ⏸️ Additional display options (showMessageStats, keepStatsVisible, renderUserContentAsMarkdown)

---

## User Stories

- ✅ **As a user**, I can configure generation parameters (temperature, top_p, etc.) so that I control AI response characteristics

- ✅ **As a user**, I can customize UI behavior (theme, auto-scroll, stats display) so that the interface suits my preferences

- ✅ **As a user**, settings persist across sessions so that I don't need to reconfigure on each visit

- ⏸️ **As a user**, I can set a global system message so that all conversations have consistent context *(Deferred: UI exists but not integrated with chat API)*

- ⏸️ **As a user**, I can import/export settings so that I can share or backup my configuration *(Deferred: Not implemented)*

- ⏸️ **As a user**, I can reset settings to defaults so that I can recover from misconfiguration *(Deferred: No reset button yet)*

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

**Implemented Structure**:

**IndexedDB Schema** (Dexie):
```typescript
userSettings: {
  userId: string;          // Primary key, user-scoped settings
  settings: string;        // JSON string of Settings object
  lastModified: number;    // Timestamp
}
```

**Settings Type Structure** (`src/lib/settings-defaults.ts`):
```typescript
interface Settings {
  general: {
    theme: 'system' | 'light' | 'dark';
    systemMessage: string;
  };
  generation: {
    temperature: number;      // 0.8, range: 0-2
    top_p: number;           // 0.95, range: 0-1
    top_k: number;           // 40, range: 0-100
    min_p: number;           // 0.05, range: 0-1
    typ_p: number;           // 1.0, range: 0-2
    max_tokens: number;      // -1 (infinite)
    repeat_last_n: number;   // 64, range: 0-256
    repeat_penalty: number;  // 1.0, range: 0-2
    presence_penalty: number; // 0.0, range: -2 to 2
    frequency_penalty: number; // 0.0, range: -2 to 2
  };
  display: {
    disableAutoScroll: boolean;
    alwaysShowSidebarOnDesktop: boolean;
    autoShowSidebarOnNewChat: boolean;
  };
}
```

**Storage Approach**:
- Per-user settings stored in IndexedDB (not localStorage)
- Deep merge on load: `deepMerge(DEFAULT_SETTINGS, storedSettings)`
- Auto-save on every `updateSetting()` call
- Theme preference also synced to localStorage via ThemeProvider (key: `ui-theme`)

**Reference Files**:
- `src/lib/settings-defaults.ts`: DEFAULT_SETTINGS, VALIDATION_RANGES
- `src/context/SettingsContext.tsx`: SettingsProvider with theme integration
- `src/hooks/useSettings.ts`: useSettings hook with persistence
- `src/db/schema.ts`: userSettings table definition

---

## Acceptance Criteria

### ✅ Scenario: Change temperature setting (IMPLEMENTED)

- **GIVEN** user opens settings dialog
- **WHEN** user navigates to Sampling tab
- **AND** changes temperature from 0.8 to 1.0 using slider
- **THEN** setting saves to IndexedDB immediately
- **WHEN** user closes dialog and sends message
- **THEN** API request includes `temperature: 1.0`
- **VERIFIED**: E2E test in `e2e/settings.spec.ts`

### ✅ Scenario: Theme switching (IMPLEMENTED)

- **GIVEN** user opens settings dialog
- **WHEN** user navigates to General tab
- **AND** selects "Dark" theme from dropdown
- **THEN** theme changes immediately (html class='dark')
- **AND** setting saves to IndexedDB
- **WHEN** user reloads page
- **THEN** dark theme persists
- **VERIFIED**: E2E test in `e2e/settings.spec.ts`

### ✅ Scenario: Auto-scroll disable (IMPLEMENTED)

- **GIVEN** user opens settings dialog
- **WHEN** user navigates to Display tab
- **AND** toggles "Disable Auto-Scroll" switch
- **THEN** setting saves immediately
- **WHEN** user sends message
- **THEN** chat no longer auto-scrolls during streaming
- **VERIFIED**: E2E test in `e2e/settings.spec.ts`

### ⏸️ Scenario: Reset single parameter (DEFERRED)

- **GIVEN** user has customized temperature to 1.0
- **WHEN** user clicks reset button next to temperature
- **THEN** temperature reverts to default (0.8)
- **AND** setting saves to IndexedDB
- **STATUS**: resetAllToDefaults() exists but no UI button

### ⏸️ Scenario: Export settings (DEFERRED)

- **GIVEN** user has customized multiple settings
- **WHEN** user clicks "Export Settings"
- **THEN** JSON file downloads
- **STATUS**: Not implemented

### ⏸️ Scenario: Import settings (DEFERRED)

- **GIVEN** user has exported settings file
- **WHEN** user clicks "Import Settings" and selects file
- **THEN** settings are loaded from JSON
- **STATUS**: Not implemented

### ⏸️ Scenario: Server default sync (DEFERRED)

- **GIVEN** server has default temperature of 0.7
- **WHEN** app initializes and fetches `/props`
- **THEN** temperature default updates to 0.7
- **STATUS**: Requires backend /props endpoint enhancement

### ✅ Scenario: Validation error (IMPLEMENTED)

- **GIVEN** user opens settings
- **WHEN** user enters value outside valid range (e.g., temperature = 3.0 when max is 2.0)
- **THEN** validation error shows in validationErrors state
- **AND** setting still saves (no blocking UI yet, but validation exists)
- **VERIFIED**: Unit test in `src/hooks/useSettings.test.ts`
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
