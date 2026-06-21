import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Header from "../components/Header";
import LinkDetailContent from "../components/links/LinkDetailContent";
import LinkDetailHeader from "../components/links/LinkDetailHeader";
import LinkOpenButton from "../components/links/LinkOpenButton";
import LinkReactionBar from "../components/links/LinkReactionBar";
import LinkViewerStateBar from "../components/links/LinkViewerStateBar";
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
  const publicLink = { ...link };
  delete publicLink.sourceCompanyUserId;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[728px] px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-8 md:px-6 md:pb-16 md:pt-12">
        <LinkDetailHeader
          link={publicLink}
          locale={locale}
          backLabel={t("back")}
          sourceCompanyLabel={t("sourceCompany")}
        />
        <LinkDetailContent
          link={publicLink}
          summaryFallback={t("summaryFallback")}
          urlLabel={t("sourceUrl")}
        />
        <section className="mb-3 flex flex-col gap-3 border-t border-border py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <LinkReactionBar
              linkId={link.id}
              initialLikeCount={link.likeCount}
              initialLikeStatus={link.likeStatus}
            />
          </div>
          <div className="flex items-start gap-3 sm:justify-end">
            <LinkViewerStateBar
              linkId={link.id}
              initialIsSaved={link.isSaved}
              initialIsRead={link.isRead}
            />
            <LinkOpenButton
              linkId={link.id}
              url={link.url}
              label={t("openOriginal")}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
