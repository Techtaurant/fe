const EDITABLE_TEXT_ENTITY_REPLACEMENTS: readonly [RegExp, string][] = [
  [/&(?:lt|#60|#x3c);?/gi, "<"],
  [/&(?:gt|#62|#x3e);?/gi, ">"],
  [/&(?:quot|#34|#x22);?/gi, "\""],
  [/&(?:apos|#39|#x27);?/gi, "'"],
  [/&amp;?/gi, "&"],
];
const EDITABLE_CONTENT_ENTITY_REPLACEMENTS: readonly [RegExp, string][] = [
  [/-&(?:amp;)*(?:gt|#62|#x3e);?/gi, "->"],
  [/&(?:amp;)*(?:lt|#60|#x3c);?-/gi, "<-"],
];
const MAX_EDITABLE_TEXT_NORMALIZE_PASSES = 3;

function normalizeEditablePostTextOnce(text: string): string {
  return EDITABLE_TEXT_ENTITY_REPLACEMENTS.reduce(
    (normalizedText, [entityPattern, replacement]) =>
      normalizedText.replace(entityPattern, replacement),
    text,
  );
}

export function normalizeEditablePostText(text: string): string {
  let normalizedText = text;

  for (let pass = 0; pass < MAX_EDITABLE_TEXT_NORMALIZE_PASSES; pass += 1) {
    const nextText = normalizeEditablePostTextOnce(normalizedText);
    if (nextText === normalizedText) {
      break;
    }
    normalizedText = nextText;
  }

  return normalizedText;
}

export function normalizeEditablePostTextList(texts: string[]): string[] {
  return texts.map(normalizeEditablePostText);
}

export function normalizeEditablePostContent(content: string): string {
  return EDITABLE_CONTENT_ENTITY_REPLACEMENTS.reduce(
    (normalizedContent, [entityPattern, replacement]) =>
      normalizedContent.replace(entityPattern, replacement),
    content,
  );
}
