'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const errorCode = searchParams.get('error');
  const errorMessage = searchParams.get('message');

  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case '4001':
        return '지원하지 않는 로그인 방식입니다.';
      case '4002':
        return '이메일 정보를 가져올 수 없습니다. Google 계정 설정을 확인해주세요.';
      case '4003':
        return '로그인에 실패했습니다. 다시 시도해주세요.';
      case '4004':
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return errorMessage || '알 수 없는 오류가 발생했습니다.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-default)]">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-2xl font-bold text-black mb-4">로그인 실패</h1>
        <p className="text-[var(--color-gray-600)] mb-6">
          {getErrorDescription(errorCode)}
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 rounded-[var(--radius-pill)] bg-black text-white text-sm font-medium
                   transition-[background-color] duration-[var(--transition-base)]
                   hover:bg-[var(--color-gray-800)]"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default function OAuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    }>
      <OAuthErrorContent />
    </Suspense>
  );
}
