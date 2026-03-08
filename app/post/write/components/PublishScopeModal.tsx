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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl md:p-7">
        <div className="mb-5">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Publish options
            </p>
            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
              게시물 공개 설정
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
            <p className="text-base font-semibold text-foreground">전체 공개로 발행</p>
            <p className="mt-1 text-sm text-muted-foreground">
              피드와 검색에 노출되어 누구나 조회할 수 있습니다.
            </p>
          </button>

          <button
            type="button"
            disabled={isDisabled}
            onClick={onPublishPrivate}
            className="group w-full rounded-xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-base font-semibold text-foreground">비공개로 발행</p>
            <p className="mt-1 text-sm text-muted-foreground">
              작성자 본인만 확인할 수 있으며 피드에는 노출되지 않습니다.
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
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
