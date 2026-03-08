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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">게시물 공개 설정</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          발행할 게시물의 공개 범위를 선택해주세요.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={isDisabled}
            onClick={onPublishPublic}
            className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            전체 공개로 발행
          </button>
          <button
            type="button"
            disabled={isDisabled}
            onClick={onPublishPrivate}
            className="w-full rounded-lg border border-border px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            비공개로 발행
          </button>
          <button
            type="button"
            disabled={isDisabled}
            onClick={onClose}
            className="w-full rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
