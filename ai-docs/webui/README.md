# WebUI Feature Parity Documentation

Building feature parity with llama.cpp webui through vertical slice implementation.

---

## Quick Start

1. **Read** `slices.md` to understand all slices
2. **Copy prompt** from `IMPLEMENTATION_PROMPT.md`
3. **Replace** `{SLICE_NAME}` with slice you're implementing
4. **Provide to Claude Code** with files accessible via `@`

---

## Files

| File | Purpose |
|------|---------|
| **slices.md** | Spec for 5 feature slices (requirements, tests, references) |
| **IMPLEMENTATION_PROMPT.md** | Generic prompt for any slice |
| **QUICK_START.md** | Commands and verification steps |
| **01-07 feature docs** | Detailed requirements per feature area |
| **master-features.md** | Progress tracking |

---

## Implementation Order

Must be done sequentially:

1. ✅ **settings-dialog** - Foundation (20 params, theme, server sync)
2. ⬜ **markdown-rendering** - GFM, syntax highlight, math, streaming
3. ⬜ **message-actions** - Copy, edit in-place, delete
4. ⬜ **file-attachments** - Images, text, PDFs, drag-drop
5. ⬜ **keyboard-shortcuts** - Global shortcuts, focus management

---

## Reference Implementation

**llama.cpp webui** (Svelte 5):
`/Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

Study the Svelte code, adapt patterns to React (Context, hooks, components).

---

## Workflow

```bash
# 1. Copy prompt from IMPLEMENTATION_PROMPT.md
# 2. Replace {SLICE_NAME} with actual slice name
# 3. Start implementation
# 4. Verify
npm run check          # Zero warnings required
npm run e2e            # All tests pass
# 5. Update slices.md: ⬜ → ✅
```

---

## Success Criteria

- [ ] All slice requirements implemented
- [ ] E2E tests pass
- [ ] npm run check passes (zero warnings)
- [ ] Works on desktop and mobile
- [ ] No regressions

---

_See `slices.md` for detailed specs and `QUICK_START.md` for verification commands._
