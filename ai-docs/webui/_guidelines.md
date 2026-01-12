# Documentation Guidelines

## Purpose

These docs are **AI-optimized functional specifications** designed for LLM consumption (Claude Code, GitHub Copilot, etc.) to guide React implementation based on llama.cpp's Svelte webui.

---

## Target Code-to-Prose Ratio

**Goal**: 10-20% code ratio (down from 31.5% average)

**When to embed code**:
- API type definitions (specification, not implementation)
- Short pseudocode (~5 lines) to clarify algorithms
- Concise examples (<5 lines) that add significant clarity

**When to reference instead**:
- Implementation patterns (link to Svelte source)
- Boilerplate code (let AI derive from functional requirements)
- Long code blocks (>10 lines from same file)

---

## Source Reference Convention

### Path Variable

Define once at top of each doc:

```markdown
> $webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui
```

### Reference Format

Use relative paths with `$webui-folder`:

```markdown
See `$webui-folder/src/lib/stores/chat.svelte.ts` for SSE streaming logic.
```

**Good reference**:
- File path + brief description of what to look for
- Example: "`$webui-folder/src/lib/services/database.ts` - Dexie schema and CRUD patterns"

**Avoid**:
- Line numbers (brittle as source changes)
- GitHub permalinks (too verbose)
- Vague references ("see the chat file")

---

## Framework Differences

**Source**: Svelte/SvelteKit + Svelte 5 runes
**Target**: React + TypeScript

### Common Pattern Mappings

| Svelte Pattern | React Equivalent |
|----------------|------------------|
| `$state` | `useState` |
| `$derived` | `useMemo`, `useCallback` |
| `$effect` | `useEffect` |
| Svelte stores | React Context + `useContext` |
| `onMount` | `useEffect(() => {}, [])` |

### How to Flag

When referencing Svelte code, add a note:

```markdown
> **Note**: This is a Svelte pattern using `$state` and `$derived` runes.
> Adapt to React using `useState` and `useMemo`.
```

---

## Document Structure

### Required Sections

1. **Overview**: Brief functional summary
2. **User Stories**: "As a user, I can..." format
3. **Functional Requirements**: Behavior descriptions, edge cases
4. **Acceptance Criteria**: GIVEN/WHEN/THEN scenarios

### Optional Sections

- **Data Model**: Include if feature involves persistence
- **Reference Implementation**: Include for complex logic/algorithms
- **Verification**: Include only for complex features

---

## Writing Style

### For AI Parsing

- **Be explicit**: AI needs clear structure, not implied context
- **Use tables**: Better for structured data than prose
- **Use lists**: Better for enumerations than paragraphs
- **Label sections clearly**: Use consistent markdown headers

### For Human Readability

- **Be concise**: Sacrifice prose for clarity
- **Avoid redundancy**: Don't repeat information
- **Use kebab-case**: For phase identifiers (not numbers)

---

## Acceptance Criteria Format

Use GIVEN/WHEN/THEN for testable requirements:

```markdown
### Scenario: User sends message with empty input

- **GIVEN** user is on chat page
- **WHEN** user clicks send button with empty input
- **THEN** input field shows validation error
- **AND** message is not sent to API
```

---

## Code Reduction Strategy

| Current Lines | Strategy |
|---------------|----------|
| <10 lines | Keep embedded if adds clarity |
| 10-20 lines | Replace with 5-line pseudocode + source reference |
| 20-50 lines | Describe functionally + source reference |
| 50+ lines | Describe behavior only + source reference |

### Example: Before

```typescript
// 30 lines of SSE parsing implementation
const parseSSE = (chunk: string) => {
  // ... lots of implementation details
}
```

### Example: After

```markdown
**SSE Parsing Algorithm**:
1. Split chunk by double newline
2. Parse "data: " prefix from each line
3. Accumulate deltas into complete object
4. Emit when "[DONE]" received

See `$webui-folder/src/lib/services/chat.ts` for full implementation.
```

---

## Special Cases

### API Reference Document

- **Keep type definitions embedded** (they're specification, not implementation)
- Add section headers for organization
- Brief functional descriptions for each API endpoint

### Libraries Document

- **Keep as is** (per project decision)
- Lists dependencies with install commands

### Master Features Document

- **Keep separate** (progress tracker)
- Update links if doc structure changes

---

## Verification Checklist

After revising each doc:

- [ ] Code-to-prose ratio meets target (10-20%)
- [ ] User Stories present and well-formed
- [ ] GIVEN/WHEN/THEN acceptance criteria included
- [ ] `$webui-folder` variable defined and used correctly
- [ ] Svelte patterns flagged with React equivalent notes
- [ ] References point to valid file paths
- [ ] Complex features have Verification section
