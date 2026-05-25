"use client";

import { Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  type CSSProperties,
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "./ThemeProvider";

interface MermaidBlockProps {
  code: string;
}

interface MermaidDialogPosition {
  x: number;
  y: number;
}

interface MermaidRenderedDiagramProps {
  className: string;
  svg: string;
  style?: CSSProperties;
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
const MERMAID_DIALOG_DEFAULT_ZOOM = 3;
const MERMAID_DIALOG_MIN_ZOOM = 0.5;
const MERMAID_DIALOG_MAX_ZOOM = 20;
const MERMAID_DIALOG_ZOOM_STEP = 0.2;
const MERMAID_DIALOG_WHEEL_ZOOM_STEP = 0.1;
const MERMAID_DIALOG_PAN_STEP = 50;
const MERMAID_DIALOG_DEFAULT_POSITION: MermaidDialogPosition = { x: 0, y: 0 };
const FOCUSABLE_DIALOG_ELEMENT_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
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

function getPannedMermaidDialogPosition(
  position: MermaidDialogPosition,
  direction: "up" | "down" | "left" | "right",
): MermaidDialogPosition {
  switch (direction) {
    case "up":
      return { ...position, y: position.y + MERMAID_DIALOG_PAN_STEP };
    case "down":
      return { ...position, y: position.y - MERMAID_DIALOG_PAN_STEP };
    case "left":
      return { ...position, x: position.x + MERMAID_DIALOG_PAN_STEP };
    case "right":
      return { ...position, x: position.x - MERMAID_DIALOG_PAN_STEP };
  }
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

function MermaidRenderedDiagram({
  className,
  svg,
  style,
}: MermaidRenderedDiagramProps) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Mermaid diagram"
      style={style}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedZoom, setExpandedZoom] = useState(MERMAID_DIALOG_DEFAULT_ZOOM);
  const [expandedPosition, setExpandedPosition] = useState<MermaidDialogPosition>(
    MERMAID_DIALOG_DEFAULT_POSITION,
  );
  const [isExpandedDragging, setIsExpandedDragging] = useState(false);
  const [expandedDragStart, setExpandedDragStart] = useState<MermaidDialogPosition>(
    MERMAID_DIALOG_DEFAULT_POSITION,
  );
  const expandedDialogRef = useRef<HTMLDivElement | null>(null);
  const expandedViewerContainerRef = useRef<HTMLDivElement | null>(null);
  const renderTokenRef = useRef(0);
  const decodedCode = useMemo(() => decodeMermaidEntities(code), [code]);
  const expandedZoomPercent = Math.round(expandedZoom * 100);
  const canZoomOut = expandedZoom > MERMAID_DIALOG_MIN_ZOOM;
  const canZoomIn = expandedZoom < MERMAID_DIALOG_MAX_ZOOM;
  const expandedDiagramStyle = {
    transform: `translate(${expandedPosition.x}px, ${expandedPosition.y}px) scale(${expandedZoom})`,
    transformOrigin: "center",
    transition: isExpandedDragging ? "none" : "transform 0.1s ease-out",
  };

  const resetExpandedView = useCallback(() => {
    setExpandedZoom(MERMAID_DIALOG_DEFAULT_ZOOM);
    setExpandedPosition(MERMAID_DIALOG_DEFAULT_POSITION);
    setIsExpandedDragging(false);
  }, []);

  const openExpandedView = () => {
    resetExpandedView();
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
    resetExpandedView();
  };

  const startExpandedViewDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!isExpanded || event.button !== 0) {
      return;
    }

    event.preventDefault();
    setIsExpandedDragging(true);
    setExpandedDragStart({
      x: event.clientX - expandedPosition.x,
      y: event.clientY - expandedPosition.y,
    });
  };

  const moveExpandedViewDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!isExpanded || !isExpandedDragging) {
      return;
    }

    setExpandedPosition({
      x: event.clientX - expandedDragStart.x,
      y: event.clientY - expandedDragStart.y,
    });
  };

  const stopExpandedViewDrag = () => {
    setIsExpandedDragging(false);
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

    resetExpandedView();
  }, [isExpanded, resetExpandedView]);

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

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          setExpandedPosition((position) =>
            getPannedMermaidDialogPosition(position, "up"),
          );
          return;
        case "ArrowDown":
          event.preventDefault();
          setExpandedPosition((position) =>
            getPannedMermaidDialogPosition(position, "down"),
          );
          return;
        case "ArrowLeft":
          event.preventDefault();
          setExpandedPosition((position) =>
            getPannedMermaidDialogPosition(position, "left"),
          );
          return;
        case "ArrowRight":
          event.preventDefault();
          setExpandedPosition((position) =>
            getPannedMermaidDialogPosition(position, "right"),
          );
          return;
        case "+":
        case "=":
          event.preventDefault();
          setExpandedZoom((zoom) =>
            clampMermaidDialogZoom(zoom + MERMAID_DIALOG_ZOOM_STEP),
          );
          return;
        case "-":
          event.preventDefault();
          setExpandedZoom((zoom) =>
            clampMermaidDialogZoom(zoom - MERMAID_DIALOG_ZOOM_STEP),
          );
          return;
        case "0":
          event.preventDefault();
          resetExpandedView();
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
  }, [isExpanded, resetExpandedView]);

  useEffect(() => {
    const container = expandedViewerContainerRef.current;
    if (!isExpanded || !container) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomDelta =
        event.deltaY > 0
          ? -MERMAID_DIALOG_WHEEL_ZOOM_STEP
          : MERMAID_DIALOG_WHEEL_ZOOM_STEP;
      setExpandedZoom((zoom) => clampMermaidDialogZoom(zoom + zoomDelta));
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
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

  if (svg) {
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
          {!isExpanded && (
            <MermaidRenderedDiagram className="mermaid-block-content" svg={svg} />
          )}
        </div>

        {isExpanded && (
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
            <div
              ref={expandedViewerContainerRef}
              className={[
                "mermaid-block-expanded-canvas",
                isExpandedDragging ? "mermaid-block-expanded-canvas-dragging" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseDown={startExpandedViewDrag}
              onMouseMove={moveExpandedViewDrag}
              onMouseUp={stopExpandedViewDrag}
              onMouseLeave={stopExpandedViewDrag}
            >
              <MermaidRenderedDiagram
                className="mermaid-block-expanded-content"
                svg={svg}
                style={expandedDiagramStyle}
              />
            </div>
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

export { decodeMermaidEntities };
