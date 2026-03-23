"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

const AUTH_RETURN_TO_STORAGE_KEY = "auth:returnTo";
const PENDING_PUBLISH_STORAGE_KEY = "post:write:pendingPublish";
const PENDING_PUBLISH_TTL_MS = 30 * 60 * 1000;

function isSafeInternalPath(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//"));
}

export default function OAuthCallback() {
  const t = useTranslations("OAuthCallback");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectFromQuery = searchParams.get("redirect");
    if (isSafeInternalPath(redirectFromQuery)) {
      router.replace(redirectFromQuery);
      return;
    }

    const returnTo = window.sessionStorage.getItem(AUTH_RETURN_TO_STORAGE_KEY);
    if (isSafeInternalPath(returnTo)) {
      window.sessionStorage.removeItem(AUTH_RETURN_TO_STORAGE_KEY);
      router.replace(returnTo);
      return;
    }

    const pendingRaw = window.sessionStorage.getItem(PENDING_PUBLISH_STORAGE_KEY);
    if (pendingRaw) {
      try {
        const parsed = JSON.parse(pendingRaw) as {
          createdAt?: number;
          path?: string;
        };
        const pendingPath = parsed.path ?? null;

        if (
          typeof parsed.createdAt === "number" &&
          Date.now() - parsed.createdAt <= PENDING_PUBLISH_TTL_MS &&
          isSafeInternalPath(pendingPath)
        ) {
          router.replace(pendingPath);
          return;
        }
      } catch {
        // ignore invalid pending payload
      }
    }

    router.replace(`/${locale}`);
  }, [locale, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
        <p className="text-muted-foreground">{t("processing")}</p>
      </div>
    </div>
  );
}
