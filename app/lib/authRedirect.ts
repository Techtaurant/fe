import { routing, type AppLocale } from "@/i18n/routing";

interface OAuthRedirectOptions {
  redirectPath?: string;
  locale?: string;
  successRedirectUri?: string;
  failureRedirectUri?: string;
}

const OAUTH_CALLBACK_PATH = "/oauth/callback";
const OAUTH_ERROR_PATH = "/oauth/error";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
}

export function buildOAuthLoginUrl(origin: string, options: OAuthRedirectOptions = {}): string {
  const url = new URL("/oauth2/authorization/google", getApiBaseUrl());
  const locale = resolveLocale(options.locale);
  const successRedirectUri =
    options.successRedirectUri ?? buildSuccessRedirectUri(locale, options.redirectPath);
  const failureRedirectUri =
    options.failureRedirectUri ?? buildFailureRedirectUri(locale);

  url.searchParams.set("origin", origin);
  url.searchParams.set("redirect-uri", successRedirectUri);
  url.searchParams.set("failure-redirect-uri", failureRedirectUri);

  return url.toString();
}

export function buildApiUrl(path: string): string {
  return new URL(path, getApiBaseUrl()).toString();
}

export function buildLogoutUrl(): string {
  return buildApiUrl("/api/auth/logout");
}

export function redirectToOAuthLogin(options: OAuthRedirectOptions = {}): void {
  if (typeof window === "undefined") return;

  window.location.href = buildOAuthLoginUrl(window.location.origin, {
    ...options,
    locale: options.locale ?? resolveLocaleFromPathname(window.location.pathname),
  });
}

function buildSuccessRedirectUri(
  locale: AppLocale,
  redirectPath?: string,
): string {
  const callbackPath = `/${locale}${OAUTH_CALLBACK_PATH}`;
  if (!redirectPath) {
    return callbackPath;
  }

  const searchParams = new URLSearchParams();
  searchParams.set("redirect", redirectPath);
  return `${callbackPath}?${searchParams.toString()}`;
}

function buildFailureRedirectUri(locale: AppLocale): string {
  return `/${locale}${OAUTH_ERROR_PATH}`;
}

function resolveLocale(locale?: string): AppLocale {
  return toAppLocale(locale) ?? routing.defaultLocale;
}

function resolveLocaleFromPathname(pathname: string): AppLocale {
  const [, locale] = pathname.split("/");
  return resolveLocale(locale);
}

function toAppLocale(locale?: string): AppLocale | null {
  if (!locale) {
    return null;
  }

  return routing.locales.includes(locale as AppLocale) ? (locale as AppLocale) : null;
}
