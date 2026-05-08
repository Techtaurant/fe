'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { useRouter } from '@/i18n/navigation';

function OAuthErrorContent() {
  const t = useTranslations('OAuthError');
  const searchParams = useSearchParams();
  const router = useRouter();

  const errorCode = searchParams.get('error');
  const errorMessage = searchParams.get('message');

  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case '4001':
        return t('error.4001');
      case '4002':
        return t('error.4002');
      case '4003':
        return t('error.4003');
      case '4004':
        return t('error.4004');
      default:
        return errorMessage || t('error.unknown');
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md px-4 text-center">
        <h1 className="text-foreground mb-4 text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mb-6">{getErrorDescription(errorCode)}</p>
        <button
          onClick={() => router.push('/')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-2 text-sm font-medium transition-colors duration-200"
        >
          {t('backHome')}
        </button>
      </div>
    </div>
  );
}

export default function OAuthError() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <OAuthErrorContent />
    </Suspense>
  );
}
