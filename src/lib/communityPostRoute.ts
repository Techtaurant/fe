const SEGMENT_SEPARATOR = "/";

function encodePathSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

function normalizeCategorySegments(categoryPath?: string): string[] {
  if (!categoryPath) {
    return [];
  }

  return categoryPath
    .split(SEGMENT_SEPARATOR)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(encodePathSegment);
}

function resolveNickname(nickname?: string, fallbackName?: string): string {
  const candidate = nickname?.trim() || fallbackName?.trim() || "unknown";
  return encodePathSegment(candidate);
}

export function buildCommunityPostPath(params: {
  nickname?: string;
  fallbackName?: string;
  categoryPath?: string;
  postId: string;
}): string {
  const { nickname, fallbackName, categoryPath, postId } = params;
  const safeNickname = resolveNickname(nickname, fallbackName);
  const categorySegments = normalizeCategorySegments(categoryPath);
  const safePostId = encodePathSegment(postId);

  return ["/blog", safeNickname, ...categorySegments, safePostId].join(SEGMENT_SEPARATOR);
}

export function buildLocalizedCommunityPostPath(params: {
  locale: string;
  nickname?: string;
  fallbackName?: string;
  categoryPath?: string;
  postId: string;
}): string {
  const { locale, ...rest } = params;
  return `/${encodePathSegment(locale)}${buildCommunityPostPath(rest)}`;
}
