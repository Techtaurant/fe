interface WriteActionsProps {
  isSubmitting: boolean;
  isPublishActionDisabled: boolean;
  draftCountLabel: string;
  onGoBack: () => void;
  onSaveDraft: () => void;
  onOpenPublishModal: () => void;
  onGoDraftList: () => void;
}

export default function WriteActions({
  isSubmitting,
  isPublishActionDisabled,
  draftCountLabel,
  onGoBack,
  onSaveDraft,
  onOpenPublishModal,
  onGoDraftList,
}: WriteActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onGoBack}
        className="rounded-lg border border-transparent bg-muted/70 px-5 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-muted/80"
      >
        나가기
      </button>

      <div className="flex gap-3">
        <div className="inline-flex overflow-hidden rounded-lg bg-muted/80">
          <button
            type="button"
            disabled={isPublishActionDisabled}
            onClick={onSaveDraft}
            className="px-4 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "저장 중..." : "임시저장"}
          </button>
          <button
            type="button"
            onClick={onGoDraftList}
            className="min-w-11 border-l border-border px-2.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="임시저장 게시글 목록 보기"
          >
            {draftCountLabel}
          </button>
        </div>

        <button
          type="button"
          disabled={isPublishActionDisabled}
          onClick={onOpenPublishModal}
          className="rounded-lg bg-primary px-7 py-2.5 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "발행 중..." : "발행하기"}
        </button>
      </div>
    </div>
  );
}
