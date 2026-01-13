# Library Dependencies

> Mapping llama.cpp webui (Svelte) dependencies to React equivalents for bodhiapps/chat

---

## Status Legend

- ✅ **Installed** - Available in bodhiapps/chat package.json
- ❌ **Not Installed** - Requires installation for feature parity
- 🔀 **React Equivalent** - React-specific alternative (vs Svelte original)

---

## Core UI & Styling

| llama.cpp (Svelte) | bodhiapps/chat (React) | Status | Purpose |
|--------------------|------------------------|--------|---------|
| `bits-ui` v2.14.4 | `shadcn/ui` (Radix UI) | 🔀 ✅ | Headless UI component primitives (Dialog, Dropdown, Select, etc.) |
| `@lucide/svelte` v0.515.0 | `lucide-react` v0.562.0 | 🔀 ✅ | Icon library |
| `tailwindcss` v4.0.0 | `tailwindcss` v4.1.18 | ✅ | CSS framework |
| `@tailwindcss/vite` v4.0.0 | `@tailwindcss/vite` v4.1.18 | ✅ | Tailwind Vite plugin |
| `@tailwindcss/forms` v0.5.9 | N/A | ❌ | Form element styling |
| `@tailwindcss/typography` v0.5.15 | N/A | ❌ | Prose/typography styling |
| `tailwind-merge` v3.3.1 | `tailwind-merge` v3.4.0 | ✅ | Merge Tailwind classes |
| `tailwind-variants` v3.2.2 | N/A | ❌ | Variant-based component styling |
| `clsx` v2.1.1 | `clsx` v2.1.1 | ✅ | Conditional class utility |
| `tw-animate-css` v1.3.5 | `tw-animate-css` v1.4.0 | ✅ | Animation utilities |

---

## Theme & Notifications

| llama.cpp (Svelte) | bodhiapps/chat (React) | Status | Purpose |
|--------------------|------------------------|--------|---------|
| `mode-watcher` v1.1.0 | `next-themes` v0.4.6 | 🔀 ✅ | Dark/light mode detection and switching (not used yet) |
| `svelte-sonner` v1.0.5 | `sonner` v2.0.7 | 🔀 ✅ | Toast notifications |

---

## Code & Markdown Rendering
**Status**: ✅ Implemented (2026-01-13)
**Used in**: [02-chat.md](./02-chat.md) (Markdown Rendering Pipeline)

| llama.cpp (Svelte) | bodhiapps/chat (React) | Status | Purpose |
|--------------------|------------------------|--------|---------|
| `highlight.js` v11.11.1 | `highlight.js` v11.11.1 | ✅ | Code syntax highlighting |
| `katex` v0.16.x | `katex` v0.16.27 | ✅ | LaTeX math rendering |
| `remark` v15.0.1 | `remark` v15.0.1 | ✅ | Markdown AST processing (base parser) |
| `remark-parse` v11.0.0 | `remark-parse` v11.0.0 | ✅ | Markdown parser |
| `remark-gfm` v4.0.1 | `remark-gfm` v4.0.1 | ✅ | GitHub Flavored Markdown (tables, strikethrough, autolinks) |
| `remark-breaks` v4.0.0 | `remark-breaks` v4.0.0 | ✅ | Convert line breaks to `<br>` tags |
| `remark-rehype` v11.1.2 | `remark-rehype` v11.1.2 | ✅ | Bridge between remark (mdast) and rehype (hast) |
| `remark-math` v6.0.0 | `remark-math` v6.0.0 | ✅ | Parse LaTeX math syntax |
| `rehype-highlight` v7.0.2 | `rehype-highlight` v7.0.2 | ✅ | Syntax highlighting via rehype |
| `rehype-katex` v7.0.1 | `rehype-katex` v7.0.1 | ✅ | LaTeX/Math rendering via KaTeX |
| `rehype-stringify` v10.0.1 | `rehype-stringify` v10.0.1 | ✅ | Serialize HAST to HTML string |
| `unist-util-visit` v5.0.0 | `unist-util-visit` v5.0.0 | ✅ | Unified AST traversal utilities |
| `unified` v11.0.5 | `unified` v11.0.5 | ✅ | Text processing ecosystem (used by remark/rehype) |
| `remark-html` v16.0.1 | N/A | ❌ | Not needed (using rehype-stringify instead) |

**Implementation**: `src/lib/markdown/processor.ts` - Unified pipeline with custom `rehypeEnhanceCodeBlocks` plugin.

---

## File Processing
**Used in**: [03-attachments.md](./03-attachments.md) (PDF Processing), [07-persistence.md](./07-persistence.md) (Import/Export)

| llama.cpp (Svelte) | bodhiapps/chat (React) | Status | Purpose |
|--------------------|------------------------|--------|---------|
| `pdfjs-dist` v5.4.54 | `pdfjs-dist` v5.4.54 | ❌ | PDF file parsing and rendering |
| `fflate` v0.8.2 | `fflate` v0.8.2 | ❌ | Compression library (for import/export) |

---

## Data & Storage
**Used in**: [07-persistence.md](./07-persistence.md) (IndexedDB Schema), [06-settings.md](./06-settings.md) (localStorage)

| llama.cpp (Svelte) | bodhiapps/chat (React) | Status | Purpose |
|--------------------|------------------------|--------|---------|
| `dexie` v4.0.11 | `dexie` v4.0.11 | ✅ | IndexedDB wrapper for conversation persistence |
| `uuid` v13.0.0 | `uuid` v13.0.0 | ✅ | UUID generation for IDs |

---

## Build & Development Tools

| llama.cpp (Svelte) | bodhiapps/chat (React) | Status | Purpose |
|--------------------|------------------------|--------|---------|
| `@sveltejs/kit` | N/A | N/A | SvelteKit framework (not needed for Vite+React) |
| `@sveltejs/adapter-static` | N/A | N/A | Static site generation (not needed) |
| `svelte`, `svelte-check` | `react`, `react-dom` | 🔀 ✅ | Framework |
| `@vitejs/plugin-react` | `@vitejs/plugin-react` v5.1.1 | ✅ | React plugin for Vite |
| `vite` v7.2.2 | `vite` v7.2.4 | ✅ | Build tool |
| `vitest` v3.2.3 | `vitest` v4.0.16 | ✅ | Unit testing |
| `@vitest/browser` v3.2.3 | N/A | ❌ | Browser-based testing |
| `playwright` v1.56.1 | `playwright` v1.57.0 | ✅ | E2E testing |
| `typescript` v5.0.0 | `typescript` v5.9.3 | ✅ | TypeScript compiler |
| `sass` v1.93.3 | N/A | ❌ | SCSS preprocessing (for KaTeX custom styles) |
| `prettier` v3.4.2 | `prettier` v3.7.4 | ✅ | Code formatting |
| `eslint` v9.18.0 | `eslint` v9.39.1 | ✅ | Linting |

---

## CSS Processing Note

The llama.cpp webui uses KaTeX with custom SCSS for font optimization:
- `/src/styles/katex-custom.scss` imports only woff2 fonts
- In React, can use same approach or import KaTeX CSS directly

---

## Libraries to Install

### Required for Core Features

```bash
npm install pdfjs-dist@^5.4.54
npm install fflate@^0.8.2
```

### ✅ Already Installed (Markdown Processing - 2026-01-13)

```bash
# These are already in package.json
npm install highlight.js@^11.11.1
npm install katex@^0.16.27
npm install remark@^15.0.1
npm install remark-parse@^11.0.0
npm install remark-gfm@^4.0.1
npm install remark-breaks@^4.0.0
npm install remark-math@^6.0.0
npm install remark-rehype@^11.1.2
npm install rehype-katex@^7.0.1
npm install rehype-highlight@^7.0.2
npm install rehype-stringify@^10.0.1
npm install unist-util-visit@^5.0.0
npm install unified@^11.0.5
```

### Tailwind Plugins

```bash
npm install -D @tailwindcss/forms@^0.5.9
npm install -D @tailwindcss/typography@^0.5.15
npm install -D tailwind-variants@^3.2.2
```

### Optional: Testing

```bash
npm install -D @vitest/browser@^3.2.3
npm install -D sass@^1.93.3
```

---

## Implementation Notes

### 1. Markdown Rendering ✅ (Implemented 2026-01-13)

The llama.cpp webui uses a custom remark/rehype pipeline with custom plugins:
- `remarkLiteralHtml` - Escapes raw HTML to prevent XSS
- `rehypeRestoreTableHtml` - Restores `<br>`, `<ul>` in table cells
- `rehypeEnhanceLinks` - Adds `target="_blank"` and security attrs
- `rehypeEnhanceCodeBlocks` - Wraps code blocks with copy/preview buttons

**bodhiapps/chat Implementation**:
- `src/lib/markdown/processor.ts` - Unified pipeline (remark → rehype)
- `src/lib/markdown/enhance-code-blocks.ts` - Custom rehype plugin for code enhancements
- `src/lib/markdown/latex-protection.ts` - LaTeX preprocessing for edge cases
- `src/components/markdown/MarkdownContent.tsx` - React component wrapper

### 2. PDF Processing

llama.cpp webui converts PDFs either:
- To text (pdfjs-dist text extraction)
- To images (for vision models)

React implementation should follow same pattern with `pdfjs-dist`

### 3. Theme Switching

- llama.cpp: `mode-watcher` (Svelte)
- React: `next-themes` (already installed)

Both provide system/light/dark mode with localStorage persistence

### 4. IndexedDB Schema

The llama.cpp webui uses Dexie with this schema:
```typescript
conversations: '++id, lastModified'
messages: '++id, convId, timestamp'
```

React implementation should use identical schema for compatibility

---

## Package Version Compatibility

All recommended versions are compatible with:
- Node.js 18+
- React 19.x
- Vite 7.x
- TypeScript 5.x

---

_Updated: 2026-01-13 - Markdown processing libraries installed and implemented_
