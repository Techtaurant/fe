import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const mermaidBlockSource = readFileSync(
  new URL("./MermaidBlock.tsx", import.meta.url),
  "utf8",
);

test("mermaid block decodes named html entities before rendering", () => {
  assert.match(mermaidBlockSource, /function decodeMermaidEntities/);
  assert.match(mermaidBlockSource, /"&amp;": "&"/);
  assert.match(mermaidBlockSource, /"&lt;": "<"/);
  assert.match(mermaidBlockSource, /"&gt;": ">"/);
  assert.match(mermaidBlockSource, /"&quot;": '"'/);
  assert.match(mermaidBlockSource, /"&apos;": "'"/);
  assert.match(mermaidBlockSource, /"&nbsp;": " "/);
});

test("mermaid block uses decoded code for rendering, error fallback, and loading view", () => {
  assert.match(
    mermaidBlockSource,
    /const decodedCode = useMemo\(\(\) => decodeMermaidEntities\(code\), \[code\]\);/,
  );
  assert.match(
    mermaidBlockSource,
    /const trimmedCode = decodedCode\.trim\(\);/,
  );
  assert.match(mermaidBlockSource, /\[decodedCode, isDarkTheme, sanitizedId\]/);
  const decodedUsages = mermaidBlockSource.match(/<code>\{decodedCode\}<\/code>/g) ?? [];
  assert.equal(decodedUsages.length, 2, "decodedCode should back both fallback panels");
});

test("decoder also supports numeric and hexadecimal html entities", () => {
  assert.match(
    mermaidBlockSource,
    /\(\?:amp\|lt\|gt\|quot\|apos\|nbsp\|#\(\\d\+\)\|#x\(\[0-9a-fA-F\]\+\)\);/,
  );
  assert.match(mermaidBlockSource, /String\.fromCodePoint\(codePoint\)/);
});

test("decoder validates numeric html entities before converting code points", () => {
  assert.match(mermaidBlockSource, /const MAX_UNICODE_CODE_POINT = 0x10ffff;/);
  assert.match(mermaidBlockSource, /Number\.isInteger\(codePoint\)/);
  assert.match(mermaidBlockSource, /codePoint > MAX_UNICODE_CODE_POINT/);

  const guardedDecodes =
    mermaidBlockSource.match(/decodeCodePointEntity\(codePoint, match\)/g) ?? [];
  assert.equal(
    guardedDecodes.length,
    2,
    "decimal and hexadecimal entities should both use the guarded decoder",
  );
});
