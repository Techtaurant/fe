'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // 쿠키는 자동으로 설정되어 있음 (HttpOnly라 JS에서 접근 불가)
    // 바로 메인 페이지로 이동
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-default)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-[var(--color-gray-600)]">로그인 처리 중...</p>
      </div>
    </div>
  );
}
