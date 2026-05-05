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

test("post detail header preserves original visual order and alignment", () => {
  const categoryIndex = postDetailHeaderSource.indexOf(
    'className="mb-3 inline-flex max-w-full rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground',
  );
  const titleIndex = postDetailHeaderSource.indexOf('<h1 className="text-2xl');
  const authorBlockIndex = postDetailHeaderSource.indexOf('className="flex items-center gap-3 mb-1"');
  const tagsIndex = postDetailHeaderSource.indexOf('className="flex flex-wrap gap-2 mt-2.5"');

  assert.notEqual(categoryIndex, -1);
  assert.notEqual(titleIndex, -1);
  assert.notEqual(authorBlockIndex, -1);
  assert.notEqual(tagsIndex, -1);
  assert.ok(categoryIndex < titleIndex);
  assert.ok(titleIndex < authorBlockIndex);
  assert.ok(authorBlockIndex < tagsIndex);
  assert.match(postDetailHeaderSource, /className="ml-auto relative flex items-center gap-2"/);
  assert.doesNotMatch(postDetailHeaderSource, /<h1 className="text-center/);
  assert.doesNotMatch(postDetailHeaderSource, /className="mb-5 flex justify-center"/);
});
