'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';

function OAuthErrorContent() {
  const t = useTranslations('OAuthError');
  const locale = useLocale();
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">{t('title')}</h1>
        <p className="text-muted-foreground mb-6">
          {getErrorDescription(errorCode)}
        </p>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium
                   transition-colors duration-200
                   hover:bg-primary/90"
        >
          {t('backHome')}
        </button>
      </div>
    </div>
  );
}

export default function OAuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <OAuthErrorContent />
    </Suspense>
  );
}
