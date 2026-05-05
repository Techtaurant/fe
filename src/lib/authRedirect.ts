interface OAuthRedirectOptions {
  redirectPath?: string;
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
}

export function buildOAuthLoginUrl(origin: string, options: OAuthRedirectOptions = {}): string {
  const url = new URL("/oauth2/authorization/google", getApiBaseUrl());
  url.searchParams.set("origin", origin);

  if (options.redirectPath) {
    url.searchParams.set("redirect", options.redirectPath);
  }

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
  window.location.href = buildOAuthLoginUrl(window.location.origin, options);
}
