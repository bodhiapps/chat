# Quick Start

Ready-to-use commands for implementing slices.

---

## Prerequisites

```bash
cd /Users/amir36/Documents/workspace/src/github.com/bodhiapps/chat

# Verify setup
ls e2e/.env.test.local                              # E2E credentials exist
ls test_hf_home/google_gemma-3-1b-it-Q4_K_M.gguf   # Test model exists
npm run check                                        # Should pass
npm run e2e                                          # Should pass
```

---

## Implementation Order

Do in sequence (dependencies):

1. settings-dialog
2. markdown-rendering
3. message-actions
4. file-attachments
5. keyboard-shortcuts

---

## Slice 1: settings-dialog

### Dependencies

```bash
npx shadcn@latest add dialog tabs
```

### Verification

```bash
npm run check
npm run e2e -- settings
```

Manual:
- Open settings, change temperature, reopen → verify persisted
- Toggle theme → verify applied
- Reset parameter → verify default restored

---

## Slice 2: markdown-rendering

### Dependencies

```bash
npm install remark remark-gfm remark-breaks remark-math remark-rehype rehype-katex rehype-highlight rehype-stringify unified unist-util-visit highlight.js katex @types/katex --save-dev
```

### Verification

```bash
npm run check
npm run e2e -- markdown
```

Manual:
- Send GFM table → verify renders
- Send code block → verify syntax highlight
- Click copy button → verify clipboard
- Send math → verify LaTeX renders

---

## Slice 3: message-actions

### Dependencies

```bash
npx shadcn@latest add dropdown-menu
```

### Verification

```bash
npm run check
npm run e2e -- message-actions
```

Manual:
- Hover message → verify actions appear
- Click copy → verify clipboard
- Edit message → verify updated
- Delete message → verify removed

---

## Slice 4: file-attachments

### Dependencies

```bash
npm install pdfjs-dist
```

### Verification

```bash
npm run check
npm run e2e -- file-attachments
```

Manual:
- Attach image → verify thumbnail
- Drag image → verify thumbnail
- Paste image → verify thumbnail
- Send with image → verify in API request
- Attach PDF → verify text extracted

---

## Slice 5: keyboard-shortcuts

### Dependencies

None (pure JS)

### Verification

```bash
npm run check
npm run e2e -- keyboard-shortcuts
```

Manual:
- Ctrl/Cmd+K → search opens
- Ctrl/Cmd+Shift+O → new chat
- Ctrl/Cmd+Shift+E → rename conversation
- Shift+Enter in textarea → newline
- Escape → closes modals
- Test on Mac (Cmd) and Windows/Linux (Ctrl)

---

## Troubleshooting

### E2E Fails

```bash
# Run headed to see issue
npm run e2e

# Run specific test
npm run e2e -- test-file.spec.ts

# Don't add timeouts - fix root cause
```

### TypeScript Errors

```bash
npm run typecheck

# Restart TS server in VSCode if needed
```

### Styling Issues

```bash
# Verify Tailwind working in browser dev tools
# Regenerate shadcn component if needed
npx shadcn@latest add button --overwrite
```

---

## General Workflow

```bash
# 1. Copy prompt from IMPLEMENTATION_PROMPT.md
# 2. Replace {SLICE_NAME}
# 3. Implement with todo list
# 4. Verify continuously
npm run check           # After each change
npm run e2e            # After feature complete
# 5. Full verification
npm run ci:test:e2e    # All tests (check regressions)
# 6. Update slices.md status: ⬜ → ✅
```
