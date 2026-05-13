import { useTranslations } from "next-intl";

interface PublishScopeModalProps {
  isOpen: boolean;
  isDisabled: boolean;
  onPublishPublic: () => void;
  onPublishPrivate: () => void;
  onClose: () => void;
}

export default function PublishScopeModal({
  isOpen,
  isDisabled,
  onPublishPublic,
  onPublishPrivate,
  onClose,
}: PublishScopeModalProps) {
  const t = useTranslations("WritePage.publishModal");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl md:p-7">
        <div className="mb-5">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t("badge")}
            </p>
            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
              {t("title")}
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            disabled={isDisabled}
            onClick={onPublishPublic}
            className="group w-full rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-base font-semibold text-foreground">{t("publicTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("publicDescription")}
            </p>
          </button>

          <button
            type="button"
            disabled={isDisabled}
            onClick={onPublishPrivate}
            className="group w-full rounded-xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-base font-semibold text-foreground">{t("privateTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("privateDescription")}
            </p>
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={isDisabled}
            onClick={onClose}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
