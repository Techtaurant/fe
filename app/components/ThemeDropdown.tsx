"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";

type ThemeMode = "light" | "dark" | "system";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function ThemeModeDropdown() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const displayTheme: ThemeMode =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";

  // useEffect(() => {
  //   setIsMounted(true);
  // }, []);

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

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (mode: ThemeMode) => {
    setTheme(mode);
    setIsOpen(false);
  };

  const isDarkActive =
    isMounted &&
    (displayTheme === "dark" ||
      (displayTheme === "system" && resolvedTheme === "dark"));

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Theme"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full
               border border-border text-sm text-foreground
               transition-colors duration-200
               hover:bg-muted"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full border border-border ${
            isDarkActive ? "bg-warning" : "bg-transparent"
          }`}
        />
        <span className="text-xs text-muted-foreground" suppressHydrationWarning>
          {isMounted ? displayTheme : "system"}
        </span>
        <svg
          className="w-4 h-4 text-muted-foreground"
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
          className="absolute right-0 mt-2 w-36 rounded-md border border-border bg-popover text-popover-foreground shadow-lg py-1 z-[400]"
        >
          {THEME_OPTIONS.map((option) => {
            const isSelected = displayTheme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
