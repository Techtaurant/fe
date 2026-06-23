const EDITABLE_CONTENT_ENTITY_REPLACEMENTS: readonly [RegExp, string][] = [
  [/&(?:lt|#60|#x3c);/gi, "<"],
  [/&(?:gt|#62|#x3e);/gi, ">"],
  [/&(?:quot|#34|#x22);/gi, "\""],
  [/&(?:apos|#39|#x27);/gi, "'"],
  [/&amp;/gi, "&"],
];

export function normalizeEditablePostContent(content: string): string {
  return EDITABLE_CONTENT_ENTITY_REPLACEMENTS.reduce(
    (normalizedContent, [entityPattern, replacement]) =>
      normalizedContent.replace(entityPattern, replacement),
    content,
  );
}
