"use client";

import { useEffect, useMemo, useState } from "react";
import { TableOfContentsHeading } from "@/app/components/MarkdownRenderer";
import { scrollToElementBelowHeader } from "@/app/lib/scrollToElementBelowHeader";

interface PostDetailTableOfContentsProps {
  headings: TableOfContentsHeading[];
}

function getDecodedHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

export default function PostDetailTableOfContents({
  headings,
}: PostDetailTableOfContentsProps) {
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);

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

      const targetElement = document.getElementById(hash);
      if (targetElement instanceof HTMLElement) {
        scrollToElementBelowHeader(targetElement, "auto");
      }

      setActiveHeadingId(hash);
    };

    const frameId = window.requestAnimationFrame(syncActiveHeadingFromHash);
    window.addEventListener("hashchange", syncActiveHeadingFromHash);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", syncActiveHeadingFromHash);
    };
  }, [headings]);

  useEffect(() => {
    if (headingIds.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);

        if (visibleEntries.length > 0) {
          setActiveHeadingId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-96px 0px -60% 0px",
        threshold: [0, 1],
      },
    );

    headingIds.forEach((headingId) => {
      const element = document.getElementById(headingId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [headingIds]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block xl:w-60 xl:shrink-0">
      <div className="sticky top-28 border-l border-border/80 pl-6">
        <nav aria-label="게시물 목차">
          <ul className="space-y-3 py-2">
            {headings.map((heading) => {
              const isActive = activeHeadingId === heading.id;
              const paddingClass =
                heading.level === 1 ? "pl-0" : heading.level === 2 ? "pl-4" : "pl-8";

              return (
                <li key={heading.id}>
                  <a
                    href={`#${encodeURIComponent(heading.id)}`}
                    onClick={(event) => {
                      event.preventDefault();

                      const targetElement = document.getElementById(heading.id);
                      if (!(targetElement instanceof HTMLElement)) {
                        return;
                      }

                      window.history.replaceState(null, "", `#${encodeURIComponent(heading.id)}`);
                      scrollToElementBelowHeader(targetElement, "smooth");
                      setActiveHeadingId(heading.id);
                    }}
                    className={`block w-full text-left text-[15px] leading-8 tracking-[-0.01em] transition-colors ${paddingClass} ${
                      isActive
                        ? "font-semibold text-foreground"
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
