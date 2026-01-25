"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useEffect, useRef, useCallback } from "react";
import mermaid from "mermaid";

interface MarkdownRendererProps {
  content: string;
}

/**
 * 마크다운과 Mermaid 다이어그램을 렌더링하는 컴포넌트
 * - GitHub Flavored Markdown 지원 (테이블, 체크박스, 취소선 등)
 * - 코드 하이라이팅
 * - Mermaid 다이어그램 렌더링
 */
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Mermaid 초기화 및 다이어그램 렌더링
   */
  const renderMermaidDiagrams = useCallback(async () => {
    if (!containerRef.current) return;

    // Mermaid 초기화
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });

    // mermaid 클래스를 가진 코드 블록 찾기
    const mermaidBlocks = containerRef.current.querySelectorAll(
      "code.language-mermaid"
    );

    for (let i = 0; i < mermaidBlocks.length; i++) {
      const block = mermaidBlocks[i];
      const parent = block.parentElement;
      if (!parent) continue;

      const code = block.textContent || "";

      try {
        const { svg } = await mermaid.render(`mermaid-diagram-${i}`, code);

        // pre 태그를 svg로 교체
        const wrapper = document.createElement("div");
        wrapper.className = "mermaid-diagram";
        wrapper.innerHTML = svg;
        parent.replaceWith(wrapper);
      } catch (error) {
        console.error("Mermaid rendering error:", error);
      }
    }
  }, []);

  useEffect(() => {
    // DOM이 렌더링된 후 Mermaid 다이어그램 렌더링
    const timer = setTimeout(() => {
      renderMermaidDiagrams();
    }, 100);

    return () => clearTimeout(timer);
  }, [content, renderMermaidDiagrams]);

  return (
    <div ref={containerRef} className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>

      {/* 마크다운 스타일 */}
      <style jsx global>{`
        .markdown-content {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
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
          border-bottom: 1px solid var(--border);
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
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
            monospace;
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
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
            monospace;
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

        /* 체크박스 (GFM) */
        .markdown-content input[type="checkbox"] {
          margin-right: 0.5rem;
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

        /* Mermaid 다이어그램 */
        .mermaid-diagram {
          display: flex;
          justify-content: center;
          margin: 1.5rem 0;
          background-color: var(--muted);
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
        }

        .mermaid-diagram svg {
          max-width: 100%;
          height: auto;
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
