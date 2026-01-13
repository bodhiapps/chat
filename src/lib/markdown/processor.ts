import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { rehypeEnhanceCodeBlocks } from './enhance-code-blocks';

// Import common language definitions from highlight.js
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import makefile from 'highlight.js/lib/languages/makefile';
import diff from 'highlight.js/lib/languages/diff';
import graphql from 'highlight.js/lib/languages/graphql';

// Map of language name to actual language definition
const COMMON_LANGUAGES = {
  javascript,
  typescript,
  jsx: javascript,
  tsx: typescript,
  python,
  rust,
  go,
  java,
  c,
  cpp,
  csharp,
  php,
  ruby,
  swift,
  kotlin,
  sql,
  bash,
  shell: bash,
  json,
  yaml,
  xml,
  html: xml,
  css,
  scss,
  markdown,
  plaintext,
  dockerfile,
  makefile,
  diff,
  graphql,
};

export const createMarkdownProcessor = () => {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeHighlight, { languages: COMMON_LANGUAGES })
    .use(rehypeEnhanceCodeBlocks)
    .use(rehypeStringify, { allowDangerousHtml: true });
};

export const markdownProcessor = createMarkdownProcessor();
