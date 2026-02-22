"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

interface MarkdownRendererProps {
  content: string;
}

const ALLOWED_HTML_TAGS = [
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "br",
  "cite",
  "code",
  "del",
  "details",
  "summary",
  "dfn",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
  "p",
  "div",
  "hr",
  "pre",
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "colgroup",
  "col",
  "img",
  "picture",
  "source",
] as const;

const sanitizedSchema = {
  ...defaultSchema,
  tagNames: ALLOWED_HTML_TAGS,
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
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
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
        }

        .markdown-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--foreground);
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
          padding-bottom: 0.5rem;
        }

        .markdown-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--foreground);
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .markdown-content p {
          margin-bottom: 1rem;
        }

        .markdown-content ul,
        .markdown-content ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
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
          color: var(--primary);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .markdown-content a:hover {
          opacity: 0.8;
          text-decoration: underline;
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
