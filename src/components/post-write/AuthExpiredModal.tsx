import { useTranslations } from 'next-intl';

interface AuthExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToLogin: () => void;
}

export default function AuthExpiredModal({ isOpen, onClose, onGoToLogin }: AuthExpiredModalProps) {
  const t = useTranslations('WritePage.authModal');

  if (!isOpen) return null;

  return (
    <div className="bg-foreground/45 fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="border-border bg-card w-full max-w-[480px] rounded-2xl border p-6 shadow-xl md:p-7">
        <div className="mb-5">
          <div>
            <p className="bg-muted text-muted-foreground mb-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold">
              {t('badge')}
            </p>
            <h2 className="text-foreground text-xl font-semibold md:text-2xl">{t('title')}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{t('description')}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-full border px-6 py-2.5 text-sm font-medium transition-colors"
          >
            {t('later')}
          </button>
          <button
            type="button"
            onClick={onGoToLogin}
            className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            {t('login')}
          </button>
        </div>
      </div>
    </div>
  );
}
