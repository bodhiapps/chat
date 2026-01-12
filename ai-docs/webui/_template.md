# Feature Name

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

## Overview

Brief 2-3 sentence description of what the feature does from a user perspective.

---

## User Stories

- **As a user**, I can [perform action] so that [benefit/outcome]
- **As a user**, I can [perform action] so that [benefit/outcome]

---

## Functional Requirements

### Sub-Feature Name

**Behavior**: Clear description of what happens when the user interacts with this feature.

**Edge Cases**:
- Edge case 1: What happens when...
- Edge case 2: How the system handles...

### Another Sub-Feature

**Behavior**: Description of behavior.

---

## Data Model

> Optional section - include only if feature involves data storage

**Entities**:
- **EntityName**: Description of what this entity represents
  - `field1` (type): Description
  - `field2` (type): Description
  - `relationship`: Description of how this relates to other entities

**Relationships**:
- EntityA has many EntityB
- EntityB belongs to EntityA

**Storage Approach**: Brief description of persistence strategy (IndexedDB, localStorage, etc.)

---

## Acceptance Criteria

### Scenario: [Descriptive scenario name]

- **GIVEN** [initial context/precondition]
- **WHEN** [user action or event]
- **THEN** [expected outcome/system response]

### Scenario: [Another scenario]

- **GIVEN** [initial context/precondition]
- **WHEN** [user action or event]
- **THEN** [expected outcome/system response]

---

## Reference Implementation

> **Svelte Source**: This section references llama.cpp's Svelte implementation for algorithmic inspiration. Adapt patterns to React.

**Key files**:
- `$webui-folder/src/lib/path/to/file.svelte` - [What to look for: e.g., "SSE streaming logic"]
- `$webui-folder/src/lib/path/to/another.ts` - [What to look for: e.g., "Tool call delta merging"]

**Algorithm Pseudocode** (if applicable):

```
1. Initialize state
2. On event trigger
3. Process data with algorithm
4. Update UI state
5. Handle completion
```

> **Note**: Svelte patterns like `$state`, `$derived`, `$effect` should be adapted to React equivalents (`useState`, `useMemo`, `useEffect`).

---

## Verification

> Optional section - include only for complex features that need explicit testing guidance

**Manual Testing Steps**:
1. Open the application
2. Navigate to [specific location]
3. Perform [specific action]
4. Observe [expected behavior]

**What to verify**:
- [ ] Feature behavior matches acceptance criteria
- [ ] Edge cases are handled correctly
- [ ] UI provides appropriate feedback
