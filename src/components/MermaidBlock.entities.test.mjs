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

test("mermaid block renders diagrams through sandboxed iframe viewers", () => {
  assert.match(mermaidBlockSource, /function createMermaidViewerDocument\(svg: string\): string/);
  assert.match(mermaidBlockSource, /const viewerDocument = useMemo/);
  assert.match(mermaidBlockSource, /className="render-viewer mermaid-block-frame"/);
  assert.match(mermaidBlockSource, /className="render-viewer mermaid-block-expanded-frame"/);
  assert.match(mermaidBlockSource, /sandbox="allow-scripts allow-same-origin"/);
  assert.match(mermaidBlockSource, /srcDoc=\{viewerDocument\}/);
  assert.doesNotMatch(mermaidBlockSource, /dangerouslySetInnerHTML=\{\{ __html: svg \}\}/);
});

test("mermaid block exposes an expanded viewer dialog", () => {
  assert.match(mermaidBlockSource, /const \[isExpanded, setIsExpanded\] = useState\(false\);/);
  assert.match(mermaidBlockSource, /className="mermaid-block-expand-button"/);
  assert.match(mermaidBlockSource, /className="mermaid-block-expanded"/);
  assert.match(mermaidBlockSource, /aria-modal="true"/);
  assert.match(mermaidBlockSource, /event\.key === "Escape"/);
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
