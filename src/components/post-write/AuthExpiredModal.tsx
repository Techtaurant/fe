import { useTranslations } from "next-intl";

interface AuthExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToLogin: () => void;
}

export default function AuthExpiredModal({
  isOpen,
  onClose,
  onGoToLogin,
}: AuthExpiredModalProps) {
  const t = useTranslations("WritePage.authModal");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-6 shadow-xl md:p-7">
        <div className="mb-5">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {t("badge")}
            </p>
            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("later")}
          </button>
          <button
            type="button"
            onClick={onGoToLogin}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("login")}
          </button>
        </div>
      </div>
    </div>
  );
}
