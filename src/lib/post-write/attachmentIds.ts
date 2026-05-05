const ATTACHMENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const HTML_IMAGE_PATTERN = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

function collectMatches(pattern: RegExp, content: string) {
  const matches: string[] = [];

  for (const match of content.matchAll(pattern)) {
    const candidate = match[1]?.trim();
    if (!candidate || !ATTACHMENT_ID_PATTERN.test(candidate)) {
      continue;
    }
    matches.push(candidate);
  }

  return matches;
}

export function extractAttachmentIdsFromContent(content: string): string[] {
  const attachmentIds = new Set<string>();

  collectMatches(MARKDOWN_IMAGE_PATTERN, content).forEach((attachmentId) => {
    attachmentIds.add(attachmentId);
  });

  collectMatches(HTML_IMAGE_PATTERN, content).forEach((attachmentId) => {
    attachmentIds.add(attachmentId);
  });

  return [...attachmentIds];
}
