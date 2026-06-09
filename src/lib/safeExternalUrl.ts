export function getSafeExternalUrl(value: string): string | undefined {
  try {
    const parsedUrl = new URL(value.trim());
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.href;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
