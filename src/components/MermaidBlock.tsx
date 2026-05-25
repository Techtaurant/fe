"use client";

import { Maximize2, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";

interface MermaidBlockProps {
  code: string;
}

const NAMED_HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
};

const MAX_UNICODE_CODE_POINT = 0x10ffff;

function decodeCodePointEntity(codePoint: number, fallback: string): string {
  if (
    !Number.isInteger(codePoint) ||
    codePoint < 0 ||
    codePoint > MAX_UNICODE_CODE_POINT
  ) {
    return fallback;
  }

  return String.fromCodePoint(codePoint);
}

/**
 * mermaid 입력은 마크다운 렌더링 파이프라인에서 HTML 엔티티로 치환되어 들어올 수 있다.
 * `--&gt;` 같은 토큰이 그대로 파서로 전달되면 mermaid가 실패하므로,
 * 다이어그램에 한해 일반적인 엔티티만 원래 문자로 되돌린다.
 * 단일 패스로 처리해 이중 인코딩을 임의로 풀지 않는다.
 */
function decodeMermaidEntities(input: string): string {
  return input.replace(
    /&(?:amp|lt|gt|quot|apos|nbsp|#(\d+)|#x([0-9a-fA-F]+));/g,
    (match, decimalCode?: string, hexCode?: string) => {
      if (decimalCode) {
        const codePoint = Number.parseInt(decimalCode, 10);
        return decodeCodePointEntity(codePoint, match);
      }

      if (hexCode) {
        const codePoint = Number.parseInt(hexCode, 16);
        return decodeCodePointEntity(codePoint, match);
      }

      return NAMED_HTML_ENTITY_MAP[match] ?? match;
    },
  );
}

function createMermaidViewerDocument(svg: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color-scheme: light dark;
        font-family: var(--font-app-mono, ui-monospace), SFMono-Regular, Menlo, monospace;
      }

      html,
      body {
        min-width: 100%;
        min-height: 100%;
        margin: 0;
        background: transparent;
      }

      body {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        box-sizing: border-box;
        width: max-content;
        padding: 16px;
        overflow: auto;
      }

      svg {
        display: block;
        flex: 0 0 auto;
        width: auto;
        max-width: none;
        height: auto;
      }
    </style>
  </head>
  <body>
    ${svg}
  </body>
</html>`;
}

/**
 * mermaid 코드 블록을 SVG 다이어그램으로 렌더링한다.
 * mermaid 모듈은 window 의존성이 있어 클라이언트에서만 동적으로 로드한다.
 * 라이트/다크 테마에 맞춰 재렌더링하며, 실패 시 원본 코드를 그대로 노출한다.
 */
export default function MermaidBlock({ code }: MermaidBlockProps) {
  const reactId = useId();
  const sanitizedId = useMemo(
    () => `mermaid-${reactId.replace(/[^a-zA-Z0-9-]/g, "")}`,
    [reactId],
  );
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";
  const [svg, setSvg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const renderTokenRef = useRef(0);
  const decodedCode = useMemo(() => decodeMermaidEntities(code), [code]);
  const viewerDocument = useMemo(
    () => (svg ? createMermaidViewerDocument(svg) : null),
    [svg],
  );

  useEffect(() => {
    const trimmedCode = decodedCode.trim();
    if (trimmedCode.length === 0) {
      setSvg(null);
      setErrorMessage(null);
      return;
    }

    const currentToken = ++renderTokenRef.current;

    const renderDiagram = async () => {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkTheme ? "dark" : "default",
          securityLevel: "strict",
          fontFamily:
            "var(--font-app-mono, ui-monospace), SFMono-Regular, Menlo, monospace",
        });

        const renderId = `${sanitizedId}-${currentToken}`;
        const { svg: renderedSvg } = await mermaid.render(renderId, trimmedCode);

        if (renderTokenRef.current !== currentToken) {
          return;
        }

        setSvg(renderedSvg);
        setErrorMessage(null);
      } catch (error) {
        if (renderTokenRef.current !== currentToken) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Mermaid 렌더링에 실패했습니다.";
        setSvg(null);
        setErrorMessage(message);
      }
    };

    renderDiagram();

    return () => {
      renderTokenRef.current += 1;
    };
  }, [decodedCode, isDarkTheme, sanitizedId]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  useEffect(() => {
    if (!svg) {
      setIsExpanded(false);
    }
  }, [svg]);

  if (errorMessage) {
    return (
      <div className="mermaid-block mermaid-block-error" role="alert">
        <p className="mermaid-block-error-title">Mermaid 렌더링 오류</p>
        <p className="mermaid-block-error-message">{errorMessage}</p>
        <pre className="mermaid-block-source">
          <code>{decodedCode}</code>
        </pre>
      </div>
    );
  }

  if (viewerDocument) {
    return (
      <>
        <div className="mermaid-block mermaid-block-viewer">
          <button
            type="button"
            className="mermaid-block-expand-button"
            aria-label="Mermaid diagram expand"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 aria-hidden="true" size={16} />
          </button>
          <iframe
            title="Mermaid diagram"
            role="presentation"
            className="render-viewer mermaid-block-frame"
            sandbox="allow-scripts allow-same-origin"
            srcDoc={viewerDocument}
          />
        </div>

        {isExpanded && (
          <div
            className="mermaid-block-expanded"
            role="dialog"
            aria-modal="true"
            aria-label="Mermaid diagram expanded view"
          >
            <button
              type="button"
              className="mermaid-block-close-button"
              aria-label="Mermaid diagram close"
              onClick={() => setIsExpanded(false)}
            >
              <X aria-hidden="true" size={18} />
            </button>
            <iframe
              title="Mermaid diagram expanded"
              role="presentation"
              className="render-viewer mermaid-block-expanded-frame"
              sandbox="allow-scripts allow-same-origin"
              srcDoc={viewerDocument}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mermaid-block mermaid-block-loading" aria-busy="true">
      <pre>
        <code>{decodedCode}</code>
      </pre>
    </div>
  );
}

export { createMermaidViewerDocument, decodeMermaidEntities };
