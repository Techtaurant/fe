'use client';

import { ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useActionSnackbar } from '../../hooks/useActionSnackbar';
import { useUser } from '../../hooks/useUser';
import { useUserBans } from '../../hooks/useUserBans';
import { usePathname, useRouter } from '../../i18n/navigation';
import { routing } from '../../i18n/routing';
import { redirectToOAuthLogin } from '../../lib/authRedirect';
import { useTheme } from '../ThemeProvider';
import ActionSnackbar from '../ui/ActionSnackbar';
import ProfileEditModal from '../user/ProfileEditModal';
import BlockedAccountsModal from './BlockedAccountsModal';

type ThemeMode = 'light' | 'dark' | 'system';
type SettingsTab = 'general' | 'management';

interface SettingsPanelProps {
  onClose?: () => void;
}

function ThemePreview({ mode, isActive }: { mode: ThemeMode; isActive: boolean }) {
  const frameClassName = isActive ? 'border-2 border-[#3083F6]' : 'border border-transparent';
  const accentClassName = isActive ? 'bg-primary/90' : 'bg-slate-400';

  if (mode === 'dark') {
    return (
      <div className={`rounded-lg border p-0.5 ${frameClassName}`}>
        <div className="h-9 w-14 overflow-hidden rounded-md bg-slate-800 p-1.5">
          <div className="h-1.5 w-9 rounded bg-slate-600" />
          <div className="mt-1 flex gap-1">
            <div className="h-4 w-4 rounded bg-slate-700" />
            <div className="h-4 flex-1 rounded bg-slate-700" />
          </div>
          <div className={`mt-1 h-1 w-3 rounded ${accentClassName}`} />
        </div>
      </div>
    );
  }

  if (mode === 'light') {
    return (
      <div className={`rounded-lg border p-0.5 ${frameClassName}`}>
        <div className="h-9 w-14 overflow-hidden rounded-md bg-slate-50 p-1.5">
          <div className="h-1.5 w-9 rounded bg-slate-300" />
          <div className="mt-1 flex gap-1">
            <div className="h-4 w-4 rounded bg-slate-200" />
            <div className="h-4 flex-1 rounded bg-slate-200" />
          </div>
          <div className={`mt-1 h-1 w-3 rounded ${accentClassName}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-0.5 ${frameClassName}`}>
      <div className="h-9 w-14 overflow-hidden rounded-md">
        <div className="h-1/2 bg-slate-50 p-1.5">
          <div className="h-1.5 w-9 rounded bg-slate-300" />
        </div>
        <div className="h-1/2 bg-slate-800 p-1.5">
          <div className="h-1.5 w-9 rounded bg-slate-600" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const t = useTranslations('SettingsPage');
  const tTheme = useTranslations('Theme');
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isBlockedAccountsModalOpen, setIsBlockedAccountsModalOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const { snackbar, showSnackbar } = useActionSnackbar();
  const {
    bans,
    isLoading: isBansLoading,
    unbanByUserId,
    unbanningUserId,
  } = useUserBans(Boolean(user));

  const activeTheme: ThemeMode =
    theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';

  const localeLabelMap = useMemo(
    () => ({
      ko: t('locale.ko'),
      en: t('locale.en'),
      ja: t('locale.ja'),
      zh: t('locale.zh'),
    }),
    [t],
  );

  const sortedBans = useMemo(
    () => [...bans].sort((a, b) => new Date(b.bannedAt).getTime() - new Date(a.bannedAt).getTime()),
    [bans],
  );

  const activeTabTitle = activeTab === 'general' ? t('tabs.general') : t('tabs.management');

  const handleUnbanUser = async (targetUserId: string) => {
    const result = await unbanByUserId(targetUserId);
    if (!result.ok) {
      showSnackbar({
        type: 'error',
        message: t('blockedModal.unblockFailed'),
      });
    }
  };

  return (
    <>
      <ActionSnackbar
        isOpen={Boolean(snackbar)}
        variant={snackbar?.type ?? 'error'}
        message={snackbar?.message ?? ''}
      />
      <div className="bg-background/95 relative flex h-[560px] w-full max-w-[660px] flex-col overflow-hidden rounded-2xl shadow-2xl backdrop-blur-sm">
        <div className="grid min-h-0 flex-1 grid-cols-[200px_1fr] gap-0">
          <aside className="border-border border-r bg-transparent p-4">
            <div className="flex flex-col gap-2">
              {(
                [
                  { key: 'general', label: t('tabs.general') },
                  { key: 'management', label: t('tabs.management') },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`h-10 rounded-lg px-3 text-left text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-muted dark:text-foreground'
                        : 'text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-muted dark:hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="h-full overflow-y-auto p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-foreground text-xl font-semibold">{activeTabTitle}</h2>
              {onClose ? (
                <button
                  type="button"
                  aria-label={t('closeAria')}
                  onClick={onClose}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center rounded-md px-[6px] py-[3px] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>

            {!isUserLoading && !user ? (
              <div className="border-border bg-card rounded-xl border p-5">
                <p className="text-muted-foreground text-sm">{t('loginRequired')}</p>
                <button
                  type="button"
                  onClick={() => {
                    redirectToOAuthLogin({ redirectPath: `${pathname}?settings=open` });
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors"
                >
                  {t('loginAction')}
                </button>
              </div>
            ) : null}

            {activeTab === 'general' && user ? (
              <article className="p-0">
                <div>
                  <h3 className="text-foreground text-base font-semibold">{t('theme.title')}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{t('theme.description')}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(['dark', 'light', 'system'] as const).map((mode) => {
                      const isActive = activeTheme === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTheme(mode)}
                          className={`inline-flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm transition-colors ${
                            isActive
                              ? 'text-foreground font-bold'
                              : 'text-foreground hover:bg-muted font-normal'
                          }`}
                        >
                          <ThemePreview mode={mode} isActive={isActive} />
                          <span>{tTheme(`mode.${mode}`)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-border mt-6 border-t pt-6">
                  <h3 className="text-foreground text-base font-semibold">{t('language.title')}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{t('language.description')}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {routing.locales.map((targetLocale) => {
                      const isActive = locale === targetLocale;
                      return (
                        <button
                          key={targetLocale}
                          type="button"
                          onClick={() => {
                            const nextParams = new URLSearchParams(searchParams.toString());
                            nextParams.set('settings', 'open');
                            const nextQuery = nextParams.toString();
                            const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;
                            router.replace(nextPath, { locale: targetLocale });
                          }}
                          className={`h-9 rounded-lg px-3 text-sm font-semibold transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          {localeLabelMap[targetLocale]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            ) : null}

            {activeTab === 'management' && user ? (
              <article className="p-0">
                <section>
                  <h3 className="text-foreground text-base font-semibold">
                    {t('management.profile')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsProfileEditModalOpen(true)}
                    aria-label={`${t('management.profile')} ${t('management.edit')}`}
                    className="hover:bg-muted/60 mt-3 flex w-full items-center justify-between rounded-md px-1 py-2 text-left transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-muted relative h-8 w-8 overflow-hidden rounded-full">
                        {user.profileImageUrl ? (
                          <Image
                            src={user.profileImageUrl}
                            alt={user.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground inline-flex h-full w-full items-center justify-center text-sm font-semibold">
                            {user.name.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground truncate text-sm font-semibold">{user.name}</p>
                    </div>
                    <span className="text-muted-foreground ml-3 inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
                      {t('management.edit')}
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  </button>
                </section>

                <section className="border-border mt-6 border-t pt-6">
                  <h3 className="text-foreground text-base font-semibold">
                    {t('tabs.management')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsBlockedAccountsModalOpen(true)}
                    className="hover:bg-muted/60 mt-3 flex h-11 w-full items-center justify-between rounded-md px-1 text-left transition-colors"
                  >
                    <span className="text-foreground text-sm font-semibold">
                      {t('management.blockedAccounts')}
                    </span>
                    <ChevronRight className="text-muted-foreground h-5 w-5" />
                  </button>
                </section>
              </article>
            ) : null}
          </section>
        </div>

        <BlockedAccountsModal
          isOpen={isBlockedAccountsModalOpen}
          isLoading={isBansLoading}
          bans={sortedBans}
          unbanningUserId={unbanningUserId}
          onClose={() => setIsBlockedAccountsModalOpen(false)}
          onUnban={handleUnbanUser}
        />
        {user && (
          <ProfileEditModal
            isOpen={isProfileEditModalOpen}
            user={user}
            onClose={() => setIsProfileEditModalOpen(false)}
          />
        )}
      </div>
    </>
  );
}
