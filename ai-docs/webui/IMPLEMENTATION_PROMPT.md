# Implementation Prompt

Copy-paste this prompt when implementing any slice:

---

```
Implement the "{SLICE_NAME}" slice.

## Background

Building feature parity with llama.cpp webui using vertical slices (end-to-end features crossing backend, frontend, tests).

## Key Files

Read these to understand requirements and reference:
- @ai-docs/webui/slices.md - Spec for all slices (focus on {SLICE_NAME} section)
- @CLAUDE.md - Project conventions

Reference implementation (Svelte 5, adapt to React):
/Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui

## Requirements

1. Read the slice spec from slices.md
2. Study reference files listed in the slice
3. Explore existing codebase to understand patterns
4. Implement: backend/state → UI → E2E tests
5. Follow conventions from CLAUDE.md

## Must Include

- E2E tests covering all acceptance criteria (use data-testid, no timeouts)
- Works on desktop and mobile
- npm run check passes (zero warnings)
- No regressions in existing tests

## Implementation Order

Slices must be done sequentially:
1. settings-dialog (foundation)
2. markdown-rendering (depends on 1)
3. message-actions (depends on 2)
4. file-attachments (depends on 1, 2)
5. keyboard-shortcuts (depends on all)

Use todo list to track progress.
```

---

## Examples

### For settings-dialog:
```
Implement the "settings-dialog" slice.

[... paste prompt above ...]
```

### For markdown-rendering:
```
Implement the "markdown-rendering" slice.

[... paste prompt above ...]

Note: Verify settings-dialog is complete first. Install required npm packages (remark, rehype, katex, highlight.js).
```

### For file-attachments:
```
Implement the "file-attachments" slice.

[... paste prompt above ...]

Note: Install pdfjs-dist first. This is the most complex slice - break into sub-tasks.
```
