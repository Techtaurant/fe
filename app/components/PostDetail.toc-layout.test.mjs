import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const postDetailSource = readFileSync(
  new URL("./PostDetail.tsx", import.meta.url),
  "utf8",
);

const tableOfContentsSource = readFileSync(
  new URL("./post-detail/PostDetailTableOfContents.tsx", import.meta.url),
  "utf8",
);

const postDetailHeaderSource = readFileSync(
  new URL("./post-detail/PostDetailHeader.tsx", import.meta.url),
  "utf8",
);

test("post detail keeps article centered when desktop table of contents is present", () => {
  assert.match(
    postDetailSource,
    /xl:grid-cols-\[minmax\(0,1fr\)_minmax\(0,728px\)_minmax\(0,1fr\)\]/,
  );
  assert.match(
    postDetailSource,
    /mx-auto w-full max-w-\[728px\] min-w-0 xl:col-start-2/,
  );
  assert.match(postDetailSource, /xl:row-start-2/);
  assert.doesNotMatch(
    postDetailSource,
    /xl:grid-cols-\[minmax\(0,728px\)_336px\]/,
  );
});

test("post detail exposes a mobile table of contents dialog", () => {
  assert.match(postDetailSource, /import AppModal from "\.\/common\/AppModal";/);
  assert.match(postDetailSource, /import \{ ListTree, X \} from "lucide-react";/);
  assert.match(postDetailSource, /isTableOfContentsDialogOpen/);
  assert.match(postDetailSource, /aria-label=\{t\("tocOpen"\)\}/);
  assert.match(postDetailSource, /<AppModal[\s\S]*isOpen=\{isTableOfContentsDialogOpen\}/);
  assert.match(postDetailSource, /variant="dialog"/);
  assert.match(
    postDetailSource,
    /onNavigate=\{\(\) => setIsTableOfContentsDialogOpen\(false\)\}/,
  );
});

test("table of contents supports desktop and dialog variants", () => {
  assert.match(tableOfContentsSource, /variant\?: "desktop" \| "dialog";/);
  assert.match(tableOfContentsSource, /onNavigate\?: \(\) => void;/);
  assert.match(tableOfContentsSource, /variant = "desktop"/);
  assert.match(tableOfContentsSource, /variant === "dialog"/);
  assert.match(tableOfContentsSource, /xl:row-start-2/);
  assert.doesNotMatch(tableOfContentsSource, /xl:max-w-\[336px\]/);
  assert.match(tableOfContentsSource, /onNavigate\?\.\(\);/);
});

test("post detail header places author metadata centered above post title", () => {
  const authorBlockIndex = postDetailHeaderSource.indexOf('className="mb-5 flex justify-center"');
  const titleIndex = postDetailHeaderSource.indexOf('<h1 className="text-center');

  assert.notEqual(authorBlockIndex, -1);
  assert.notEqual(titleIndex, -1);
  assert.ok(authorBlockIndex < titleIndex);
  assert.match(
    postDetailHeaderSource,
    /className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground"/,
  );
});
