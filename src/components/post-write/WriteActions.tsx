import { useTranslations } from 'next-intl';

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
  const t = useTranslations('WritePage.actions');

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onGoBack}
        className="bg-muted/70 text-foreground hover:bg-muted/80 rounded-lg border border-transparent px-5 py-2.5 text-base font-semibold transition-colors"
      >
        {t('exit')}
      </button>

      <div className="flex flex-wrap justify-end gap-3">
        {showDraftActions && (
          <div className="bg-close-button inline-flex overflow-hidden rounded-lg">
            <button
              type="button"
              disabled={isPublishActionDisabled}
              onClick={onSaveDraft}
              className="text-foreground hover:bg-close-button-hover px-4 py-2.5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t('saving') : t('saveDraft')}
            </button>
            <button
              type="button"
              onClick={onGoDraftList}
              className="dark:border-ring text-foreground hover:bg-close-button-hover min-w-11 border-l border-white/80 px-2.5 py-2 text-sm font-semibold transition-colors"
              aria-label={t('draftListAria')}
            >
              {draftCountLabel}
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={isPublishActionDisabled}
          onClick={onOpenPublishModal}
          className="bg-comment-submit-button hover:bg-comment-submit-button-hover rounded-lg px-7 py-2.5 text-base font-semibold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t('publishing') : t('publish')}
        </button>
      </div>
    </div>
  );
}
