import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Header from "../components/Header";
import LinkDetailContent from "../components/links/LinkDetailContent";
import LinkDetailHeader from "../components/links/LinkDetailHeader";
import LinkOpenButton from "../components/links/LinkOpenButton";
import LinkReactionBar from "../components/links/LinkReactionBar";
import { fetchOpenLinkDetail } from "../services/links/server";

interface LinkDetailPageProps {
  params: Promise<{
    locale: string;
    linkId: string;
  }>;
}

export default async function LinkDetailPage({ params }: LinkDetailPageProps) {
  const { locale, linkId } = await params;
  const t = await getTranslations({ locale, namespace: "LinkDetail" });
  const link = await fetchOpenLinkDetail(linkId).catch((error: unknown) => {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      notFound();
    }
    throw error;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[728px] px-4 pb-16 pt-8 md:px-6 md:pt-12">
        <LinkDetailHeader
          link={link}
          locale={locale}
          backLabel={t("back")}
        />
        <LinkDetailContent
          link={link}
          summaryFallback={t("summaryFallback")}
          urlLabel={t("sourceUrl")}
        />
        <section className="flex flex-col items-stretch gap-4 border-t border-border py-4 sm:flex-row sm:items-start sm:justify-between">
          <LinkReactionBar
            linkId={link.id}
            initialLikeCount={link.likeCount}
            initialLikeStatus={link.likeStatus}
          />
          <LinkOpenButton
            linkId={link.id}
            url={link.url}
            label={t("openOriginal")}
          />
        </section>
      </main>
    </div>
  );
}
