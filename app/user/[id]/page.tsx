"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Header from "../../components/Header";
import { FEED_MODES } from "../../constants/feed";
import { FeedMode } from "../../types";

export default function UserDetailPage() {
  const t = useTranslations("UserPage");
  const params = useParams();
  const userId = typeof params.id === "string" ? params.id : "";
  const [currentMode, setCurrentMode] = useState<FeedMode>(FEED_MODES.USER);

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onMenuClick={() => {}}
      />

      <main className="mx-auto max-w-[728px] px-6 py-14">
        <section className="rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{t("description")}</p>
          <p className="mt-5 text-xs text-muted-foreground">{t("userId", { userId })}</p>
        </section>
      </main>
    </div>
  );
}
