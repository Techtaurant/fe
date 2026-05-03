"use client";

import { ReactNode, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { ALLOWED_HTML_TAGS } from "@/app/constants/markdownAllowedHtml";

export interface TableOfContentsHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

interface MarkdownRendererProps {
  content: string;
  resolveImageSrc?: (src: string) => string | null;
}

function normalizeHeadingText(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*~]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyHeadingText(text: string): string {
  const normalizedText = normalizeHeadingText(text);

  return normalizedText
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function createHeadingId(text: string, counts: Map<string, number>): string {
  const normalizedText = slugifyHeadingText(text) || normalizeHeadingText(text);
  const currentCount = counts.get(normalizedText) ?? 0;
  counts.set(normalizedText, currentCount + 1);

  if (currentCount === 0) {
    return normalizedText;
  }

  return `${normalizedText}-${currentCount + 1}`;
}

function extractTextFromReactNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    const children = (node as { props?: { children?: ReactNode } }).props?.children;
    return children ? extractTextFromReactNode(children) : "";
  }

  return "";
}

export function extractTableOfContents(content: string): TableOfContentsHeading[] {
  const headingCounts = new Map<string, number>();

  return content
    .split("\n")
    .map((line) => line.match(/^(#{1,3})\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => {
      const level = match[1].length as 1 | 2 | 3;
      const text = normalizeHeadingText(match[2]);

      if (!text) {
        return null;
      }

      return {
        id: createHeadingId(text, headingCounts),
        text,
        level,
      } satisfies TableOfContentsHeading;
    })
    .filter((heading): heading is TableOfContentsHeading => heading !== null);
}

const sanitizedSchema = {
  ...defaultSchema,
  tagNames: ALLOWED_HTML_TAGS,
  protocols: {
    ...(defaultSchema.protocols ?? {}),
    src: [...(defaultSchema.protocols?.src ?? []), "blob"],
  },
  attributes: {
    a: ["href", "title", "target", "rel"],
    abbr: ["title"],
    bdo: ["dir"],
    blockquote: ["cite"],
    code: ["className"],
    del: ["cite", "dateTime"],
    details: ["open"],
    q: ["cite"],
    span: ["className", "title"],
    time: ["dateTime"],
    div: ["className", "title", ["align", "left", "center", "right"]],
    p: [["align", "left", "center", "right"]],
    pre: ["className"],
    ol: ["start", "reversed", "type"],
    table: ["width", ["align", "left", "center", "right"]],
    th: ["colSpan", "rowSpan", "scope", "abbr", "width", "height", ["align", "left", "center", "right"]],
    td: ["colSpan", "rowSpan", "headers", "width", "height", ["align", "left", "center", "right"]],
    col: ["span", "width"],
    colgroup: ["span", "width"],
    img: ["src", "width", "height", "loading", ["align", "left", "center", "right"]],
    source: ["src", "srcSet", "type", "media", "sizes", "width", "height"],
  },
} as const;

/**
 * 마크다운을 화이트리스트 기반으로 렌더링하는 컴포넌트
 * - GitHub Flavored Markdown 지원
 * - 코드 하이라이팅
 * - 지정한 HTML 태그만 허용하고 나머지는 제거
 */
export default function MarkdownRenderer({
  content,
  resolveImageSrc,
}: MarkdownRendererProps) {
  const tableOfContents = useMemo(() => extractTableOfContents(content), [content]);
  const headingIdsByText = useMemo(() => {
    const nextHeadingIds = new Map<string, string[]>();

    tableOfContents.forEach((heading) => {
      const ids = nextHeadingIds.get(heading.text) ?? [];
      ids.push(heading.id);
      nextHeadingIds.set(heading.text, ids);
    });

    return nextHeadingIds;
  }, [tableOfContents]);
  const renderedHeadingCounts = new Map<string, number>();

  const getRenderedHeadingId = (children: ReactNode) => {
    const text = normalizeHeadingText(extractTextFromReactNode(children));
    const currentCount = renderedHeadingCounts.get(text) ?? 0;
    renderedHeadingCounts.set(text, currentCount + 1);

    return headingIdsByText.get(text)?.[currentCount] ?? createHeadingId(text, new Map());
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          img: ({ src, alt, ...props }) => {
            if (typeof src !== "string" || src.trim().length === 0) {
              return null;
            }

            const resolvedSrc = resolveImageSrc ? resolveImageSrc(src) : src;
            if (!resolvedSrc || resolvedSrc.trim().length === 0) {
              return null;
            }

            return <img src={resolvedSrc} alt={alt ?? ""} {...props} />;
          },
          h1: ({ children, ...props }) => {
            const id = getRenderedHeadingId(children);

            return (
              <h1 id={id} {...props}>
                {children}
              </h1>
            );
          },
          h2: ({ children, ...props }) => {
            const id = getRenderedHeadingId(children);

            return (
              <h2 id={id} {...props}>
                {children}
              </h2>
            );
          },
          h3: ({ children, ...props }) => {
            const id = getRenderedHeadingId(children);

            return (
              <h3 id={id} {...props}>
                {children}
              </h3>
            );
          },
        }}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizedSchema], rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>

      {/* 마크다운 스타일 */}
      <style jsx global>{`
        .markdown-content {
          font-family: var(--font-kr-sans);
          font-size: 17px;
          line-height: 1.7;
          color: var(--foreground);
        }

        .markdown-content h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--foreground);
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.3;
          scroll-margin-top: 4rem;
        }

        .markdown-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--foreground);
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
          padding-bottom: 0.5rem;
          scroll-margin-top: 4rem;
        }

        .markdown-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--foreground);
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          scroll-margin-top: 4rem;
        }

        .markdown-content p {
          margin-bottom: 1rem;
        }

        .markdown-content ul,
        .markdown-content ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
          list-style-position: outside;
        }

        .markdown-content ul {
          list-style-type: disc;
        }

        .markdown-content ol {
          list-style-type: decimal;
        }

        .markdown-content ul ul {
          list-style-type: circle;
        }

        .markdown-content ul ul ul {
          list-style-type: square;
        }

        .markdown-content li {
          margin-bottom: 0.5rem;
        }

        .markdown-content li::marker {
          color: var(--muted-foreground);
        }

        /* 인라인 코드 */
        .markdown-content code:not(pre code) {
          background-color: var(--muted);
          color: var(--foreground);
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
          font-family: var(--font-app-mono);
        }

        /* 코드 블록 */
        .markdown-content pre {
          background-color: #1e1e1e;
          color: #d4d4d4;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .markdown-content pre code {
          background: transparent;
          padding: 0;
          font-family: var(--font-app-mono);
        }

        /* 인용문 */
        .markdown-content blockquote {
          border-left: 4px solid var(--border);
          padding-left: 1rem;
          margin: 1rem 0;
          color: var(--muted-foreground);
          font-style: italic;
        }

        /* 링크 */
        .markdown-content a {
          color: var(--color-blue-500);
          font-weight: 500;
          text-decoration-line: underline;
          text-decoration-thickness: 0.08em;
          text-underline-offset: 0.18em;
          overflow-wrap: anywhere;
          border-radius: 3px;
          transition:
            color 0.2s ease,
            background-color 0.2s ease;
        }

        .markdown-content a:hover,
        .markdown-content a:focus-visible {
          color: var(--comment-submit-button-hover);
          background-color: color-mix(
            in srgb,
            var(--color-blue-500) 12%,
            transparent
          );
        }

        .markdown-content a:focus-visible {
          outline: 2px solid var(--color-blue-500);
          outline-offset: 2px;
        }

        /* 테이블 (GFM) */
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }

        .markdown-content th,
        .markdown-content td {
          border: 1px solid var(--border);
          padding: 0.75rem;
          text-align: left;
        }

        .markdown-content th {
          background-color: var(--muted);
          font-weight: 600;
        }

        /* 취소선 (GFM) */
        .markdown-content del {
          color: var(--muted-foreground);
        }

        /* 수평선 */
        .markdown-content hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 2rem 0;
        }

        /* 이미지 */
        .markdown-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }

        /* highlight.js 코드 하이라이팅 - VS Code Dark+ 스타일 */
        .hljs-keyword {
          color: #569cd6;
        }
        .hljs-string {
          color: #ce9178;
        }
        .hljs-number {
          color: #b5cea8;
        }
        .hljs-comment {
          color: #6a9955;
        }
        .hljs-function {
          color: #dcdcaa;
        }
        .hljs-class {
          color: #4ec9b0;
        }
        .hljs-variable {
          color: #9cdcfe;
        }
        .hljs-built_in {
          color: #4fc1ff;
        }
        .hljs-attr {
          color: #9cdcfe;
        }
        .hljs-params {
          color: #9cdcfe;
        }
        .hljs-title {
          color: #dcdcaa;
        }
        .hljs-literal {
          color: #569cd6;
        }
        .hljs-type {
          color: #4ec9b0;
        }
      `}</style>
    </div>
  );
}
