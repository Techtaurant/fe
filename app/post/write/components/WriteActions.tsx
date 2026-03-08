interface WriteActionsProps {
  isSubmitting: boolean;
  isPublishActionDisabled: boolean;
  draftCountLabel: string;
  onSaveDraft: () => void;
  onOpenPublishModal: () => void;
  onGoDraftList: () => void;
}

export default function WriteActions({
  isSubmitting,
  isPublishActionDisabled,
  draftCountLabel,
  onSaveDraft,
  onOpenPublishModal,
  onGoDraftList,
}: WriteActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      <div className="inline-flex overflow-hidden rounded-lg border border-border">
        <button
          type="button"
          disabled={isPublishActionDisabled}
          onClick={onSaveDraft}
          className="px-5 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "저장 중..." : "임시저장"}
        </button>
        <button
          type="button"
          onClick={onGoDraftList}
          className="min-w-14 border-l border-border px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted"
          aria-label="임시저장 게시글 목록 보기"
        >
          {draftCountLabel}
        </button>
      </div>
      <button
        type="button"
        disabled={isPublishActionDisabled}
        onClick={onOpenPublishModal}
        className="rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "발행 중..." : "발행하기"}
      </button>
    </div>
  );
}
