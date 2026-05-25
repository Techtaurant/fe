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

test("mermaid block renders diagrams directly in normal and expanded views", () => {
  assert.match(mermaidBlockSource, /if \(svg\) \{/);
  assert.match(mermaidBlockSource, /className="mermaid-block-content"/);
  assert.match(mermaidBlockSource, /className="mermaid-block-expanded-content"/);
  const svgInsertions =
    mermaidBlockSource.match(/dangerouslySetInnerHTML=\{\{ __html: svg \}\}/g) ?? [];
  assert.equal(svgInsertions.length, 2, "normal and expanded views should render the SVG");
  assert.doesNotMatch(mermaidBlockSource, /createMermaidViewerDocument/);
  assert.doesNotMatch(mermaidBlockSource, /srcDoc=/);
  assert.doesNotMatch(mermaidBlockSource, /sandbox=/);
  assert.doesNotMatch(mermaidBlockSource, /allow-scripts/);
});

test("mermaid block exposes an expanded viewer dialog", () => {
  assert.match(mermaidBlockSource, /const \[isExpanded, setIsExpanded\] = useState\(false\);/);
  assert.match(
    mermaidBlockSource,
    /const \[expandedZoom, setExpandedZoom\] = useState\(MERMAID_DIALOG_DEFAULT_ZOOM\);/,
  );
  assert.match(mermaidBlockSource, /className="mermaid-block-expand-button"/);
  assert.match(mermaidBlockSource, /className="mermaid-block-expanded"/);
  assert.match(mermaidBlockSource, /className="mermaid-block-expanded-toolbar"/);
  assert.match(mermaidBlockSource, /className=\{\[\s*"mermaid-block-expanded-canvas",/);
  assert.match(mermaidBlockSource, /aria-modal="true"/);
  assert.match(mermaidBlockSource, /tabIndex=\{-1\}/);
  assert.match(mermaidBlockSource, /role="toolbar"/);
  assert.match(mermaidBlockSource, /aria-label="Mermaid diagram zoom controls"/);
  assert.match(mermaidBlockSource, /event\.key === "Escape"/);
});

test("expanded mermaid dialog traps focus and restores it on close", () => {
  assert.match(mermaidBlockSource, /const FOCUSABLE_DIALOG_ELEMENT_SELECTOR =/);
  assert.match(mermaidBlockSource, /function getFocusableDialogElements\(container: HTMLElement\): HTMLElement\[\]/);
  assert.match(mermaidBlockSource, /const expandedDialogRef = useRef<HTMLDivElement \| null>\(null\);/);
  assert.match(mermaidBlockSource, /const previouslyFocusedElement =/);
  assert.match(mermaidBlockSource, /event\.key !== "Tab"/);
  assert.match(mermaidBlockSource, /event\.shiftKey/);
  assert.match(mermaidBlockSource, /previouslyFocusedElement\?\.focus\(\);/);
});

test("expanded mermaid dialog supports fanplus-style pan and zoom controls", () => {
  assert.match(mermaidBlockSource, /interface MermaidDialogPosition/);
  assert.match(mermaidBlockSource, /const MERMAID_DIALOG_DEFAULT_ZOOM = 3;/);
  assert.match(mermaidBlockSource, /const MERMAID_DIALOG_MIN_ZOOM = 0\.5;/);
  assert.match(mermaidBlockSource, /const MERMAID_DIALOG_MAX_ZOOM = 20;/);
  assert.match(mermaidBlockSource, /const MERMAID_DIALOG_ZOOM_STEP = 0\.2;/);
  assert.match(mermaidBlockSource, /const MERMAID_DIALOG_WHEEL_ZOOM_STEP = 0\.1;/);
  assert.match(mermaidBlockSource, /const MERMAID_DIALOG_PAN_STEP = 50;/);
  assert.match(
    mermaidBlockSource,
    /const \[expandedPosition, setExpandedPosition\] = useState<MermaidDialogPosition>/,
  );
  assert.match(mermaidBlockSource, /const \[isExpandedDragging, setIsExpandedDragging\] = useState\(false\);/);
  assert.match(mermaidBlockSource, /function clampMermaidDialogZoom\(zoom: number\): number/);
  assert.match(mermaidBlockSource, /function getPannedMermaidDialogPosition/);
  assert.match(mermaidBlockSource, /const startExpandedViewDrag =/);
  assert.match(mermaidBlockSource, /const moveExpandedViewDrag =/);
  assert.match(mermaidBlockSource, /const stopExpandedViewDrag =/);
  assert.match(mermaidBlockSource, /container\.addEventListener\("wheel", handleWheel, \{ passive: false \}\);/);
  assert.match(mermaidBlockSource, /case "ArrowUp":/);
  assert.match(mermaidBlockSource, /case "ArrowDown":/);
  assert.match(mermaidBlockSource, /case "ArrowLeft":/);
  assert.match(mermaidBlockSource, /case "ArrowRight":/);
  assert.match(mermaidBlockSource, /case "\+":/);
  assert.match(mermaidBlockSource, /case "-":/);
  assert.match(mermaidBlockSource, /case "0":/);
  assert.match(mermaidBlockSource, /aria-label="Mermaid diagram zoom out"/);
  assert.match(mermaidBlockSource, /aria-label="Mermaid diagram zoom in"/);
  assert.match(mermaidBlockSource, /aria-label="Mermaid diagram zoom reset"/);
  assert.match(
    mermaidBlockSource,
    /transform: `translate\(\$\{expandedPosition\.x\}px, \$\{expandedPosition\.y\}px\) scale\(\$\{expandedZoom\}\)`/,
  );
  assert.match(mermaidBlockSource, /transition: isExpandedDragging \? "none" : "transform 0\.1s ease-out"/);
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
