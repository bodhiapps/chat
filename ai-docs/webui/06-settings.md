# Feature: Settings

> Priority: 6 | Status: Core Feature

---

## Overview

Settings system provides configuration for generation parameters, UI behavior, theme, and experimental features with localStorage persistence and server default synchronization.

**Related docs**: [API Reference](./api-reference.md) (generation parameters), [Chat](./02-chat.md) (UI behavior), [Persistence](./07-persistence.md) (storage architecture)

---

## Functional Requirements

### User Should Be Able To

1. **Configure Generation**
   - Set temperature, top_p, top_k, min_p
   - Configure penalties (repeat, presence, frequency)
   - Set max tokens (-1 for infinite)
   - Define sampler order

2. **Customize UI**
   - Choose theme (system/light/dark)
   - Toggle message statistics display
   - Toggle auto-scroll
   - Show/hide tool calls
   - Configure sidebar behavior

3. **Set System Prompt**
   - Define global system message
   - Clear system message
   - Applies to all new conversations

4. **Manage Settings**
   - Save changes (auto-save)
   - Reset to defaults
   - Import/export settings JSON
   - See which values differ from defaults

---

## Settings Sections

### 1. General
- **theme**: `'system' | 'light' | 'dark'` (default: `'system'`)
- **apiKey**: string (optional, for `--api-key` mode)
- **systemMessage**: string (global system prompt)
- **pasteLongTextToFileLen**: number (default: 2500)
- **copyTextAttachmentsAsPlainText**: boolean (default: false)
- **pdfAsImage**: boolean (default: false)
- **askForTitleConfirmation**: boolean (default: false)
- **enableContinueGeneration**: boolean (experimental, default: false)

### 2. Display
- **showMessageStats**: boolean (default: true)
- **showThoughtInProgress**: boolean (default: false)
- **keepStatsVisible**: boolean (default: false)
- **renderUserContentAsMarkdown**: boolean (default: false)
- **disableAutoScroll**: boolean (default: false)
- **alwaysShowSidebarOnDesktop**: boolean (default: false)
- **autoShowSidebarOnNewChat**: boolean (default: true)
- **autoMicOnEmpty**: boolean (experimental, default: false)

### 3. Sampling
- **temperature**: number (default: 0.8, range: 0.0-2.0)
- **dynatemp_range**: number (default: 0.0)
- **dynatemp_exponent**: number (default: 1.0)
- **top_k**: number (default: 40)
- **top_p**: number (default: 0.95, range: 0.0-1.0)
- **min_p**: number (default: 0.05, range: 0.0-1.0)
- **xtc_probability**: number (default: 0.0)
- **xtc_threshold**: number (default: 0.1)
- **typ_p**: number (default: 1.0)
- **max_tokens**: number (default: -1, -1 = infinite)
- **samplers**: string (default: `'top_k;typ_p;top_p;min_p;temperature'`)
- **backend_sampling**: boolean (default: false)

### 4. Penalties
- **repeat_last_n**: number (default: 64)
- **repeat_penalty**: number (default: 1.0)
- **presence_penalty**: number (default: 0.0, range: -2.0 to 2.0)
- **frequency_penalty**: number (default: 0.0, range: -2.0 to 2.0)
- **dry_multiplier**: number (default: 0.0)
- **dry_base**: number (default: 1.75)
- **dry_allowed_length**: number (default: 2)
- **dry_penalty_last_n**: number (default: -1)

### 5. Developer
- **showToolCalls**: boolean (default: false)
- **disableReasoningFormat**: boolean (default: false)
- **custom**: string (JSON for custom params, default: '')

---

## UI Components Needed

### Settings Dialog
- Modal overlay
- Tab navigation (5-6 tabs)
- Scrollable content area
- Save/Reset buttons footer

### Field Types

**Text Input**:
```typescript
<input 
  type="text" 
  value={config.apiKey} 
  onChange={(e) => updateConfig('apiKey', e.target.value)}
  placeholder="sk-..."
/>
```

**Textarea**:
```typescript
<textarea 
  value={config.systemMessage}
  onChange={(e) => updateConfig('systemMessage', e.target.value)}
  placeholder="You are a helpful assistant..."
  rows={4}
/>
```

**Number Input**:
```typescript
<input 
  type="number" 
  value={config.temperature}
  onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
  step={0.1}
  min={0}
  max={2}
/>
```

**Checkbox**:
```typescript
<input
  type="checkbox"
  checked={config.showMessageStats}
  onChange={(e) => updateConfig('showMessageStats', e.target.checked)}
/>
```

**Select**:
```typescript
<select 
  value={config.theme}
  onChange={(e) => updateConfig('theme', e.target.value)}
>
  <option value="system">System</option>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</select>
```

### Parameter Source Indicator
- Badge showing "Custom" if value differs from default
- Inline reset button
- Tooltip with default value

---

## Storage & Persistence

### localStorage Keys
- `LlamaCppWebui.config` - All settings JSON
- `LlamaCppWebui.userOverrides` - Set of custom param names

### Auto-save Behavior
```typescript
function updateConfig(key: string, value: any) {
  config[key] = value;
  localStorage.setItem('LlamaCppWebui.config', JSON.stringify(config));
  
  // Track user override
  if (value !== defaults[key]) {
    userOverrides.add(key);
  } else {
    userOverrides.delete(key);
  }
  localStorage.setItem('LlamaCppWebui.userOverrides', JSON.stringify([...userOverrides]));
}
```

---

## Server Synchronization

### Sync Flow
1. On app init: Fetch `/props` endpoint
2. Extract `default_generation_settings.params`
3. Compare with current config (normalize floats to 6 decimals)
4. Update defaults, preserve user overrides
5. Update UI to show custom badges

### Normalization
```typescript
function normalize(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

function isUserOverride(key: string, value: number, serverDefault: number): boolean {
  return normalize(value) !== normalize(serverDefault);
}
```

---

## Validation

### Numeric Fields
```typescript
function validateNumeric(value: string): number | null {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

// On save
if (validateNumeric(config.temperature) === null) {
  alert('Invalid temperature value');
  return;
}
```

### JSON Fields (custom params)
```typescript
function validateJSON(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

// On save
if (config.custom && !validateJSON(config.custom)) {
  alert('Invalid JSON in custom parameters');
  return;
}
```

---

## Import/Export

### Export Format
```json
{
  "theme": "dark",
  "temperature": 0.8,
  "top_p": 0.95,
  "systemMessage": "You are helpful",
  "showMessageStats": true,
  ...
}
```

### Export Function
```typescript
function exportSettings() {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `llamacpp-settings-${Date.now()}.json`;
  a.click();
}
```

### Import Function
```typescript
async function importSettings() {
  const file = await openFilePicker('.json');
  const text = await file.text();
  const imported = JSON.parse(text);
  
  // Validate and merge
  Object.keys(imported).forEach(key => {
    if (key in defaults) {
      config[key] = imported[key];
    }
  });
  
  saveToLocalStorage();
  toast.success('Settings imported');
}
```

---

## Reset Behavior

### Reset All
```typescript
function resetToDefaults() {
  // Prefer server defaults > webui defaults
  config = { ...webuiDefaults, ...serverDefaults };
  userOverrides.clear();
  saveToLocalStorage();
}
```

### Reset Single Parameter
```typescript
function resetParameter(key: string) {
  config[key] = serverDefaults[key] ?? webuiDefaults[key];
  userOverrides.delete(key);
  saveToLocalStorage();
}
```

---

## Error Handling

### Invalid Values
- Show inline error below field
- Prevent save until fixed
- Highlight field in red

### Server Sync Failure
- Use cached defaults
- Show warning: "Could not sync with server"
- Retry button

### Storage Quota Exceeded
- Catch quota error on save
- Show error: "Settings could not be saved"
- Suggest clearing browser data

---

## Testing Considerations

### Unit Tests
1. Update config → verify localStorage
2. Reset parameter → verify default restored
3. Validate JSON → accept/reject correctly
4. Normalize floats → compare accurately
5. Import/export → round-trip equality

### Integration Tests
1. Change setting → close dialog → reopen → verify persisted
2. Reset all → verify defaults restored
3. Server sync → verify defaults updated
4. Export → import → verify settings match

---

## Accessibility

### Keyboard Navigation
- Tab through all fields
- Enter to save
- Escape to cancel
- Focus trap in dialog

### Screen Reader
- Label all inputs
- Announce validation errors
- Describe parameter ranges
- Read custom/default badges

---

_Updated: Phase settings completed_
