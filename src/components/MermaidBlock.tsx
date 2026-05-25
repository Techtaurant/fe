"use client";

import { Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
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
const MERMAID_DIALOG_DEFAULT_ZOOM = 1;
const MERMAID_DIALOG_MIN_ZOOM = 0.5;
const MERMAID_DIALOG_MAX_ZOOM = 3;
const MERMAID_DIALOG_ZOOM_STEP = 0.25;
const FOCUSABLE_DIALOG_ELEMENT_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "iframe",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function clampMermaidDialogZoom(zoom: number): number {
  return Math.min(
    MERMAID_DIALOG_MAX_ZOOM,
    Math.max(MERMAID_DIALOG_MIN_ZOOM, zoom),
  );
}

function getFocusableDialogElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_DIALOG_ELEMENT_SELECTOR),
  );
}

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

function createMermaidViewerDocument(
  svg: string,
  zoom = MERMAID_DIALOG_DEFAULT_ZOOM,
): string {
  const safeZoom = clampMermaidDialogZoom(zoom);

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

      .mermaid-viewer-content {
        display: block;
        flex: 0 0 auto;
        zoom: ${safeZoom};
      }

      @supports not (zoom: 1) {
        .mermaid-viewer-content {
          transform: scale(${safeZoom});
          transform-origin: top center;
        }
      }

      svg {
        display: block;
        width: auto;
        max-width: none;
        height: auto;
      }
    </style>
  </head>
  <body>
    <div class="mermaid-viewer-content">${svg}</div>
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
  const [expandedZoom, setExpandedZoom] = useState(MERMAID_DIALOG_DEFAULT_ZOOM);
  const expandedDialogRef = useRef<HTMLDivElement | null>(null);
  const renderTokenRef = useRef(0);
  const decodedCode = useMemo(() => decodeMermaidEntities(code), [code]);
  const viewerDocument = useMemo(
    () => (svg ? createMermaidViewerDocument(svg) : null),
    [svg],
  );
  const expandedViewerDocument = useMemo(
    () => (svg ? createMermaidViewerDocument(svg, expandedZoom) : null),
    [expandedZoom, svg],
  );
  const expandedZoomPercent = Math.round(expandedZoom * 100);
  const canZoomOut = expandedZoom > MERMAID_DIALOG_MIN_ZOOM;
  const canZoomIn = expandedZoom < MERMAID_DIALOG_MAX_ZOOM;

  const openExpandedView = () => {
    setExpandedZoom(MERMAID_DIALOG_DEFAULT_ZOOM);
    setIsExpanded(true);
  };

  const closeExpandedView = () => {
    setIsExpanded(false);
  };

  const zoomOutExpandedView = () => {
    setExpandedZoom((currentZoom) =>
      clampMermaidDialogZoom(currentZoom - MERMAID_DIALOG_ZOOM_STEP),
    );
  };

  const zoomInExpandedView = () => {
    setExpandedZoom((currentZoom) =>
      clampMermaidDialogZoom(currentZoom + MERMAID_DIALOG_ZOOM_STEP),
    );
  };

  const resetExpandedViewZoom = () => {
    setExpandedZoom(MERMAID_DIALOG_DEFAULT_ZOOM);
  };

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

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusFrame = window.requestAnimationFrame(() => {
      const dialogElement = expandedDialogRef.current;
      if (!dialogElement) {
        return;
      }

      const firstFocusableElement = getFocusableDialogElements(dialogElement)[0];
      (firstFocusableElement ?? dialogElement).focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialogElement = expandedDialogRef.current;
      if (!dialogElement) {
        return;
      }

      const focusableElements = getFocusableDialogElements(dialogElement);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogElement.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (activeElement === firstFocusableElement ||
          !dialogElement.contains(activeElement))
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement?.focus();
    };
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
            onClick={openExpandedView}
          >
            <Maximize2 aria-hidden="true" size={16} />
          </button>
          <iframe
            title="Mermaid diagram"
            role="presentation"
            className="render-viewer mermaid-block-frame"
            sandbox=""
            srcDoc={viewerDocument}
          />
        </div>

        {isExpanded && expandedViewerDocument && (
          <div
            ref={expandedDialogRef}
            className="mermaid-block-expanded"
            role="dialog"
            aria-modal="true"
            aria-label="Mermaid diagram expanded view"
            tabIndex={-1}
          >
            <div
              className="mermaid-block-expanded-toolbar"
              role="toolbar"
              aria-label="Mermaid diagram zoom controls"
            >
              <button
                type="button"
                className="mermaid-block-zoom-button"
                aria-label="Mermaid diagram zoom out"
                disabled={!canZoomOut}
                onClick={zoomOutExpandedView}
              >
                <ZoomOut aria-hidden="true" size={18} />
              </button>
              <span className="mermaid-block-zoom-value" aria-live="polite">
                {expandedZoomPercent}%
              </span>
              <button
                type="button"
                className="mermaid-block-zoom-button"
                aria-label="Mermaid diagram zoom in"
                disabled={!canZoomIn}
                onClick={zoomInExpandedView}
              >
                <ZoomIn aria-hidden="true" size={18} />
              </button>
              <button
                type="button"
                className="mermaid-block-zoom-button"
                aria-label="Mermaid diagram zoom reset"
                onClick={resetExpandedViewZoom}
              >
                <RotateCcw aria-hidden="true" size={18} />
              </button>
            </div>
            <button
              type="button"
              className="mermaid-block-close-button"
              aria-label="Mermaid diagram close"
              onClick={closeExpandedView}
            >
              <X aria-hidden="true" size={18} />
            </button>
            <iframe
              title="Mermaid diagram expanded"
              role="presentation"
              className="render-viewer mermaid-block-expanded-frame"
              sandbox=""
              srcDoc={expandedViewerDocument}
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
