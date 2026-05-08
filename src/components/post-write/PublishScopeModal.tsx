import { useTranslations } from 'next-intl';

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
  const t = useTranslations('WritePage.publishModal');

  if (!isOpen) return null;

  return (
    <div className="bg-foreground/45 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="border-border bg-card w-full max-w-xl rounded-2xl border p-6 shadow-xl md:p-7">
        <div className="mb-5">
          <div>
            <p className="bg-primary/10 text-primary mb-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold">
              {t('badge')}
            </p>
            <h2 className="text-foreground text-xl font-semibold md:text-2xl">{t('title')}</h2>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            disabled={isDisabled}
            onClick={onPublishPublic}
            className="group border-primary/30 bg-primary/5 hover:bg-primary/10 w-full rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-foreground text-base font-semibold">{t('publicTitle')}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t('publicDescription')}</p>
          </button>

          <button
            type="button"
            disabled={isDisabled}
            onClick={onPublishPrivate}
            className="group border-border bg-background hover:bg-muted/60 w-full rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-foreground text-base font-semibold">{t('privateTitle')}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t('privateDescription')}</p>
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={isDisabled}
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-full border px-6 py-2.5 text-sm font-medium transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
