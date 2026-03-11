import { useTranslations } from "next-intl";

interface WriteActionsProps {
  isSubmitting: boolean;
  isPublishActionDisabled: boolean;
  draftCountLabel: string;
  showDraftActions?: boolean;
  onGoBack: () => void;
  onSaveDraft: () => void;
  onOpenPublishModal: () => void;
  onGoDraftList: () => void;
}

export default function WriteActions({
  isSubmitting,
  isPublishActionDisabled,
  draftCountLabel,
  showDraftActions = true,
  onGoBack,
  onSaveDraft,
  onOpenPublishModal,
  onGoDraftList,
}: WriteActionsProps) {
  const t = useTranslations("WritePage.actions");

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onGoBack}
        className="rounded-lg border border-transparent bg-muted/70 px-5 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-muted/80"
      >
        {t("exit")}
      </button>

      <div className="flex gap-3">
        {showDraftActions && (
          <div className="inline-flex overflow-hidden rounded-lg bg-muted/80">
            <button
              type="button"
              disabled={isPublishActionDisabled}
              onClick={onSaveDraft}
              className="px-4 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t("saving") : t("saveDraft")}
            </button>
            <button
              type="button"
              onClick={onGoDraftList}
              className="min-w-11 border-l border-border px-2.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("draftListAria")}
            >
              {draftCountLabel}
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={isPublishActionDisabled}
          onClick={onOpenPublishModal}
          className="rounded-lg bg-primary px-7 py-2.5 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("publishing") : t("publish")}
        </button>
      </div>
    </div>
  );
}
