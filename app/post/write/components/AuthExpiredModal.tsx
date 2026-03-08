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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[620px] rounded-[28px] bg-[#f6f6f7] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-5xl font-bold leading-none text-[#101115] md:text-[44px]">
            Login required
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ececee] text-3xl leading-none text-[#5c5f66] transition-colors hover:bg-[#e2e3e7]"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="rounded-3xl bg-[#ececef] p-6">
          <p className="text-base leading-relaxed text-[#484b54]">
            로그인 세션이 만료되었습니다.
            <br />
            작성 중이던 내용은 안전하게 저장되었습니다.
            <br />
            로그인 후 자동으로 발행이 다시 시도됩니다.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d2d5dc] bg-[#f6f6f7] px-7 py-3 text-2xl font-semibold text-[#17191f] transition-colors hover:bg-[#ececef]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onGoToLogin}
            className="rounded-full bg-[#111217] px-7 py-3 text-2xl font-semibold text-white transition-opacity hover:opacity-90"
          >
            로그인 하러가기
          </button>
        </div>
      </div>
    </div>
  );
}
