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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-6 shadow-xl md:p-7">
        <div className="mb-5">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Session expired
            </p>
            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
              다시 로그인이 필요합니다.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              세션이 만료되어 로그인 페이지로 이동합니다.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            나중에
          </button>
          <button
            type="button"
            onClick={onGoToLogin}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
