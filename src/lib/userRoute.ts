const SEGMENT_SEPARATOR = "/";

function encodePathSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

export function buildUserPath(userId: string): string {
  return ["", "user", encodePathSegment(userId)].join(SEGMENT_SEPARATOR);
}
