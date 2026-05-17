import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en", "ja", "zh"],
  defaultLocale: "ko",
  localePrefix: "always",
  localeDetection: true,
  localeCookie: true,
});

export type AppLocale = (typeof routing.locales)[number];
