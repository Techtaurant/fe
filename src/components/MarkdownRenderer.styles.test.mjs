import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const markdownRendererSource = readFileSync(
  new URL("./MarkdownRenderer.tsx", import.meta.url),
  "utf8",
);

function escapeRegExp(pattern) {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCssRuleBody(selector) {
  const ruleMatch = markdownRendererSource.match(
    new RegExp(`${escapeRegExp(selector)}\\s*\\{(?<body>[\\s\\S]*?)\\n\\s*\\}`, "m"),
  );

  assert.ok(ruleMatch?.groups?.body, `${selector} CSS rule should exist`);

  return ruleMatch.groups.body;
}

test("markdown links have a visible link affordance", () => {
  const linkRuleBody = getCssRuleBody(".markdown-content a");

  assert.match(linkRuleBody, /color:\s*var\(--color-blue-500\);/);
  assert.match(linkRuleBody, /text-decoration-line:\s*underline;/);
  assert.match(linkRuleBody, /text-underline-offset:\s*0\.18em;/);
  assert.match(linkRuleBody, /overflow-wrap:\s*anywhere;/);
  assert.doesNotMatch(linkRuleBody, /text-decoration:\s*none;/);
});

test("markdown links show hover and keyboard focus states", () => {
  const interactiveRuleMatch = markdownRendererSource.match(
    /\.markdown-content a:hover,\s*\.markdown-content a:focus-visible\s*\{(?<body>[\s\S]*?)\n\s*\}/m,
  );

  assert.ok(
    interactiveRuleMatch?.groups?.body,
    "hover and focus-visible CSS rule should exist",
  );
  assert.match(interactiveRuleMatch.groups.body, /color:\s*var\(--comment-submit-button-hover\);/);
  assert.match(interactiveRuleMatch.groups.body, /background-color:/);

  assert.match(
    markdownRendererSource,
    /\.markdown-content a:focus-visible\s*\{\s*outline:\s*2px solid var\(--color-blue-500\);\s*outline-offset:\s*2px;/m,
  );
});

test("markdown blockquotes keep consecutive and nested quotes grouped", () => {
  const blockquoteRuleBody = getCssRuleBody(".markdown-content blockquote");
  const blockquoteParagraphRuleBody = getCssRuleBody(".markdown-content blockquote p");
  const nestedBlockquoteRuleBody = getCssRuleBody(".markdown-content blockquote blockquote");

  assert.match(blockquoteRuleBody, /border-left:\s*4px solid var\(--border\);/);
  assert.match(blockquoteRuleBody, /padding-left:\s*1rem;/);
  assert.match(blockquoteParagraphRuleBody, /margin-bottom:\s*0\.5rem;/);
  assert.match(
    markdownRendererSource,
    /\.markdown-content blockquote p:last-child,\s*\.markdown-content blockquote > :last-child\s*\{(?<body>[\s\S]*?)margin-bottom:\s*0;/m,
  );
  assert.match(nestedBlockquoteRuleBody, /margin:\s*0\.5rem 0;/);
  assert.match(nestedBlockquoteRuleBody, /border-left-color:\s*var\(--muted-foreground\);/);
});

test("markdown renderer restores encoded blockquote markers before parsing", () => {
  assert.match(markdownRendererSource, /const BLOCKQUOTE_MARKER_ENTITY_SEQUENCE_PATTERN =/);
  assert.match(markdownRendererSource, /const BLOCKQUOTE_MARKER_ENTITY_PATTERN =/);
  assert.match(markdownRendererSource, /const FENCED_CODE_BLOCK_PATTERN =/);
  assert.match(markdownRendererSource, /function restoreBlockquoteMarkerEntities\(line: string\): string/);
  assert.match(markdownRendererSource, /function normalizeMarkdownSyntaxEntities\(content: string\): string/);
  assert.match(
    markdownRendererSource,
    /markerSequence\.replace\(BLOCKQUOTE_MARKER_ENTITY_PATTERN,\s*">"\)\}\$\{rest\}/,
  );
  assert.match(markdownRendererSource, /let isInFencedCodeBlock = false;/);
  assert.match(markdownRendererSource, /FENCED_CODE_BLOCK_PATTERN\.test\(line\)/);
  assert.match(markdownRendererSource, /isInFencedCodeBlock = !isInFencedCodeBlock;/);
  assert.match(markdownRendererSource, /if \(isInFencedCodeBlock\)/);
  assert.match(markdownRendererSource, /\{normalizedContent\}/);
});

test("mermaid viewers have direct render and full-screen dialog styles", () => {
  [
    ".markdown-content .mermaid-block-viewer",
    ".markdown-content .mermaid-block-content",
    ".markdown-content .mermaid-block-expand-button",
    ".markdown-content .mermaid-block-expanded",
    ".markdown-content .mermaid-block-expanded-toolbar",
    ".markdown-content .mermaid-block-expanded-canvas",
    ".markdown-content .mermaid-block-expanded-canvas-dragging",
    ".markdown-content .mermaid-block-expanded-content",
    ".markdown-content .mermaid-block-zoom-button",
    ".markdown-content .mermaid-block-zoom-value",
  ].forEach((selector) => {
    assert.match(
      markdownRendererSource,
      new RegExp(escapeRegExp(selector)),
      `${selector} should have an explicit markdown mermaid viewer style`,
    );
  });

  const expandedRuleBody = getCssRuleBody(".markdown-content .mermaid-block-expanded");
  assert.match(expandedRuleBody, /position:\s*fixed;/);
  assert.match(expandedRuleBody, /inset:\s*0;/);
  assert.match(expandedRuleBody, /z-index:\s*1000;/);
  assert.match(expandedRuleBody, /width:\s*100vw;/);
  assert.match(expandedRuleBody, /height:\s*100dvh;/);
});

test("code blocks keep highlight.js output readable", () => {
  const codeBlockRuleMatch = markdownRendererSource.match(
    /\.markdown-content pre code\.hljs,\s*\.markdown-content code\.hljs\s*\{(?<body>[\s\S]*?)\n\s*\}/m,
  );

  assert.ok(
    codeBlockRuleMatch?.groups?.body,
    "highlight.js code block CSS rule should exist",
  );
  assert.match(codeBlockRuleMatch.groups.body, /display:\s*block;/);
  assert.match(codeBlockRuleMatch.groups.body, /overflow-x:\s*auto;/);
  assert.match(codeBlockRuleMatch.groups.body, /background:\s*transparent;/);
});

test("code highlighting registers common markdown fence aliases", () => {
  assert.match(
    markdownRendererSource,
    /javascript:\s*\["js",\s*"jsx"\]/,
    "javascript aliases should support js and jsx fences",
  );
  assert.match(
    markdownRendererSource,
    /typescript:\s*\["ts",\s*"tsx"\]/,
    "typescript aliases should support ts and tsx fences",
  );
  assert.match(
    markdownRendererSource,
    /bash:\s*\["sh",\s*"zsh"\]/,
    "bash aliases should support shell command fences without terminal transcripts",
  );
  assert.match(
    markdownRendererSource,
    /shell:\s*\["terminal",\s*"console"\]/,
    "shell aliases should preserve terminal transcript fences",
  );
  assert.match(
    markdownRendererSource,
    /\[rehypeHighlight,\s*codeHighlightOptions\]/,
    "rehype-highlight should receive the alias options",
  );
});

test("code highlighting covers common language token classes", () => {
  [
    ".hljs-keyword",
    ".hljs-string",
    ".hljs-number",
    ".hljs-comment",
    ".hljs-function",
    ".hljs-title.function_",
    ".hljs-class",
    ".hljs-title.class_",
    ".hljs-variable",
    ".hljs-property",
    ".hljs-built_in",
    ".hljs-name",
    ".hljs-tag",
    ".hljs-attr",
    ".hljs-attribute",
    ".hljs-params",
    ".hljs-literal",
    ".hljs-meta",
    ".hljs-type",
    ".hljs-selector-id",
    ".hljs-selector-class",
    ".hljs-selector-attr",
    ".hljs-selector-pseudo",
    ".hljs-subst",
    ".hljs-punctuation",
    ".hljs-operator",
    ".hljs-addition",
    ".hljs-deletion",
  ].forEach((selector) => {
    assert.match(
      markdownRendererSource,
      new RegExp(escapeRegExp(selector)),
      `${selector} should have an explicit markdown code highlight style`,
    );
  });
});
