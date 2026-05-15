"use client";

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
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
      }

      if (hexCode) {
        const codePoint = Number.parseInt(hexCode, 16);
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
      }

      return NAMED_HTML_ENTITY_MAP[match] ?? match;
    },
  );
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
  const renderTokenRef = useRef(0);
  const decodedCode = useMemo(() => decodeMermaidEntities(code), [code]);

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

  if (svg) {
    return (
      <div
        className="mermaid-block"
        role="img"
        aria-label="Mermaid diagram"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
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

export { decodeMermaidEntities };
