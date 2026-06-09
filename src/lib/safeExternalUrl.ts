const URL_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const SCHEMELESS_HOST_PATTERN =
  /^(localhost(?::\d+)?|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d+)?)(?:[/?#].*)?$/;

export function getSafeExternalUrl(value: string): string | undefined {
  const trimmedValue = value.trim();
  const candidate = URL_SCHEME_PATTERN.test(trimmedValue)
    ? trimmedValue
    : SCHEMELESS_HOST_PATTERN.test(trimmedValue)
      ? `https://${trimmedValue}`
      : trimmedValue;

  try {
    const parsedUrl = new URL(candidate);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.href;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
