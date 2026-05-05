"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TableOfContentsHeading } from "@/app/components/MarkdownRenderer";
import { scrollToElementBelowHeader } from "@/app/lib/scrollToElementBelowHeader";

interface PostDetailTableOfContentsProps {
  headings: TableOfContentsHeading[];
  variant?: "desktop" | "dialog";
  onNavigate?: () => void;
}

function getDecodedHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

export default function PostDetailTableOfContents({
  headings,
  variant = "desktop",
  onNavigate,
}: PostDetailTableOfContentsProps) {
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const tocContainerRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollUnlockTimeoutRef = useRef<number | null>(null);
  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);
  const wrapperClassName =
    variant === "dialog"
      ? "block w-full"
      : "hidden xl:col-start-3 xl:row-start-1 xl:block xl:w-full xl:min-w-0";
  const containerClassName =
    variant === "dialog"
      ? "toc-scrollbar max-h-[min(62dvh,520px)] overflow-y-auto pr-2"
      : "toc-scrollbar sticky top-28 max-h-[calc(100dvh-7rem)] overflow-y-auto border-l border-border/80 pl-8 pr-4";

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    const syncActiveHeadingFromHash = () => {
      const hash = getDecodedHash();
      if (!hash) {
        setActiveHeadingId(headings[0]?.id ?? "");
        return;
      }

      setActiveHeadingId(hash);
    };

    const handleHashChange = () => {
      const hash = getDecodedHash();
      if (!hash) {
        setActiveHeadingId(headings[0]?.id ?? "");
        return;
      }

      const targetElement = document.getElementById(hash);
      if (targetElement instanceof HTMLElement) {
        scrollToElementBelowHeader(targetElement, "auto");
      }

      setActiveHeadingId(hash);
    };

    const frameId = window.requestAnimationFrame(syncActiveHeadingFromHash);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [headings]);

  useEffect(() => {
    if (headingIds.length === 0) {
      return;
    }

    const syncActiveHeadingFromScroll = () => {
      if (isProgrammaticScrollRef.current) {
        return;
      }

      const headerBottom =
        document
          .querySelector<HTMLElement>("[data-app-header='true']")
          ?.getBoundingClientRect().bottom ?? 0;
      const activationLine = headerBottom + 24;

      const currentHeading = headingIds.reduce<string>((activeId, headingId) => {
        const element = document.getElementById(headingId);
        if (!(element instanceof HTMLElement)) {
          return activeId;
        }

        return element.getBoundingClientRect().top <= activationLine ? headingId : activeId;
      }, headingIds[0] ?? "");

      setActiveHeadingId(currentHeading);
    };

    const frameId = window.requestAnimationFrame(syncActiveHeadingFromScroll);
    window.addEventListener("scroll", syncActiveHeadingFromScroll, { passive: true });
    window.addEventListener("resize", syncActiveHeadingFromScroll);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", syncActiveHeadingFromScroll);
      window.removeEventListener("resize", syncActiveHeadingFromScroll);
    };
  }, [headingIds]);

  useEffect(() => {
    if (!activeHeadingId) {
      return;
    }

    const container = tocContainerRef.current;
    const activeLink = container?.querySelector<HTMLElement>(`[data-toc-heading-id="${CSS.escape(activeHeadingId)}"]`);
    if (!container || !activeLink) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeLinkRect = activeLink.getBoundingClientRect();
    const isOutOfView =
      activeLinkRect.top < containerRect.top + 24 ||
      activeLinkRect.bottom > containerRect.bottom - 24;

    if (isOutOfView) {
      activeLink.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeHeadingId]);

  useEffect(() => {
    return () => {
      if (scrollUnlockTimeoutRef.current !== null) {
        window.clearTimeout(scrollUnlockTimeoutRef.current);
      }
    };
  }, []);

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className={wrapperClassName}>
      <div
        ref={tocContainerRef}
        className={containerClassName}
      >
        <nav aria-label="게시물 목차">
          <ul className="space-y-3 py-2">
            {headings.map((heading) => {
              const isActive = activeHeadingId === heading.id;
              const paddingClass =
                heading.level === 1 ? "pl-0" : heading.level === 2 ? "pl-4" : "pl-8";

              return (
                <li key={heading.id}>
                  <a
                    data-toc-heading-id={heading.id}
                    href={`#${encodeURIComponent(heading.id)}`}
                    onClick={(event) => {
                      event.preventDefault();

                      const targetElement = document.getElementById(heading.id);
                      if (!(targetElement instanceof HTMLElement)) {
                        return;
                      }

                      if (scrollUnlockTimeoutRef.current !== null) {
                        window.clearTimeout(scrollUnlockTimeoutRef.current);
                      }

                      isProgrammaticScrollRef.current = true;
                      window.history.replaceState(null, "", `#${encodeURIComponent(heading.id)}`);
                      scrollToElementBelowHeader(targetElement, "auto");
                      setActiveHeadingId(heading.id);
                      onNavigate?.();

                      scrollUnlockTimeoutRef.current = window.setTimeout(() => {
                        isProgrammaticScrollRef.current = false;
                      }, 500);
                    }}
                    className={`block w-full cursor-pointer text-left text-[15px] leading-8 tracking-[-0.01em] transition-colors ${paddingClass} ${
                      isActive
                        ? "font-semibold text-foreground dark:text-white"
                        : "font-medium text-muted-foreground/90 hover:text-foreground"
                    }`}
                  >
                    {heading.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
