'use client';

import { Ban, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import AppModal from '../common/AppModal';
import UnblockActionButton from '../ui/UnblockActionButton';

interface BlockedAccountItem {
  userId: string;
  name: string;
  profileImageUrl: string | null;
  bannedAt: string;
}

interface BlockedAccountsModalProps {
  isOpen: boolean;
  isLoading: boolean;
  bans: BlockedAccountItem[];
  unbanningUserId: string | null;
  onClose: () => void;
  onUnban: (targetUserId: string) => Promise<void>;
}

export default function BlockedAccountsModal({
  isOpen,
  isLoading,
  bans,
  unbanningUserId,
  onClose,
  onUnban,
}: BlockedAccountsModalProps) {
  const t = useTranslations('SettingsPage');

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="absolute inset-0 z-20 flex items-center justify-center bg-black/35 px-4 py-5 backdrop-blur-[1px]"
      panelClassName="h-[420px] w-full max-w-[520px] max-h-full rounded-3xl border border-border bg-background/95 pt-5 pr-1.5 pb-5 pl-6 shadow-2xl backdrop-blur-sm"
    >
      <div className="relative flex h-full flex-col">
        <div className="flex items-center">
          <h3 className="text-foreground text-[20px] leading-none font-bold tracking-[-0.02em]">
            {t('blockedModal.title')}
          </h3>
        </div>

        <button
          type="button"
          aria-label={t('blockedModal.closeAria')}
          onClick={onClose}
          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-0 right-5 inline-flex items-center justify-center rounded-md px-[6px] py-[3px] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {isLoading ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
            {t('blockedModal.loading')}
          </div>
        ) : bans.length === 0 ? (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4">
            <div className="bg-muted rounded-xl p-3">
              <Ban className="h-7 w-7" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">{t('blockedModal.empty')}</p>
          </div>
        ) : (
          <ul className="mt-2 flex-1 space-y-2 overflow-y-auto">
            {bans.map((item) => {
              const isUnbanning = unbanningUserId === item.userId;

              return (
                <li
                  key={item.userId}
                  className="flex items-center justify-between gap-3 rounded-xl px-2 py-2"
                >
                  <div className="flex min-w-0 items-center gap-[14px]">
                    <div className="relative h-7 w-7 overflow-hidden rounded-full bg-white/10">
                      {item.profileImageUrl ? (
                        <Image
                          src={item.profileImageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground inline-flex h-full w-full items-center justify-center text-sm font-semibold">
                          {item.name.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground truncate text-sm leading-none font-semibold tracking-[-0.02em]">
                      {item.name}
                    </p>
                  </div>

                  <UnblockActionButton
                    disabled={isUnbanning}
                    onClick={async () => {
                      await onUnban(item.userId);
                    }}
                    className="mt-[2px] mr-[20px]"
                  >
                    {isUnbanning ? t('blockedModal.unblocking') : t('blockedModal.unblockAction')}
                  </UnblockActionButton>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppModal>
  );
}
