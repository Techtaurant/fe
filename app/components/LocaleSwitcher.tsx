"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const t = useTranslations("Locale");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t("switchTo", { locale: locale.toUpperCase() })}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs uppercase text-foreground transition-colors hover:bg-muted"
      >
        <span>{locale}</span>
        <svg
          className="h-4 w-4 text-muted-foreground"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.7a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 z-[400] mt-2 w-24 rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-lg"
        >
          {routing.locales.map((targetLocale) => {
            const isSelected = locale === targetLocale;
            return (
              <button
                key={targetLocale}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setIsOpen(false);
                  router.replace(pathname, { locale: targetLocale });
                }}
                className={`w-full px-3 py-2 text-left text-xs uppercase transition-colors ${
                  isSelected
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                {targetLocale}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
