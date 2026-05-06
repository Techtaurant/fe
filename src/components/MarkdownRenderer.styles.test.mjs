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
