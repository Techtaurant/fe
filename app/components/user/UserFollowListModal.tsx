"use client";

import Image from "next/image";
import { Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import AppModal from "../common/AppModal";
import { FollowUserItem } from "@/app/services/users/follow";

export type FollowListTab = "followers" | "followings";

interface UserFollowListModalProps {
  isOpen: boolean;
  isLoading: boolean;
  activeTab: FollowListTab;
  users: FollowUserItem[];
  currentUserId: string | null;
  followingUserIdSet: Set<string>;
  followerCount: number | null;
  followingCount: number | null;
  onClose: () => void;
  onTabChange: (tab: FollowListTab) => void;
  onToggleFollow: (
    targetUserId: string,
    isCurrentlyFollowing: boolean,
    targetUserName?: string,
  ) => Promise<void>;
}

function formatCount(value: number | null): string {
  if (value === null) return "-";
  return new Intl.NumberFormat().format(value);
}

export default function UserFollowListModal({
  isOpen,
  isLoading,
  activeTab,
  users,
  currentUserId,
  followingUserIdSet,
  followerCount,
  followingCount,
  onClose,
  onTabChange,
  onToggleFollow,
}: UserFollowListModalProps) {
  const t = useTranslations("UserPage");

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="absolute inset-0 z-20 flex items-center justify-center bg-black/35 px-4 py-5 backdrop-blur-[1px]"
      panelClassName="h-[500px] w-full max-w-[520px] max-h-full rounded-3xl border border-border bg-background/95 pt-5 pr-1.5 pb-5 pl-6 shadow-2xl backdrop-blur-sm"
    >
      <div className="relative flex h-full flex-col">
        <div className="flex items-center">
          <h3 className="text-[20px] leading-none font-bold tracking-[-0.02em] text-foreground">
            {t("followList.title")}
          </h3>
        </div>

        <button
          type="button"
          aria-label={t("followList.closeAria")}
          onClick={onClose}
          className="absolute right-5 top-0 inline-flex items-center justify-center rounded-md px-[6px] py-[3px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mt-4 mb-2 mr-5 grid grid-cols-2 rounded-lg bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => onTabChange("followers")}
            className={`h-9 rounded-md text-sm font-semibold transition-colors ${
              activeTab === "followers"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("stats.followers")} {formatCount(followerCount)}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("followings")}
            className={`h-9 rounded-md text-sm font-semibold transition-colors ${
              activeTab === "followings"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("stats.following")} {formatCount(followingCount)}
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {t("followList.loading")}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="rounded-xl bg-muted p-3">
              <Users className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {activeTab === "followers" ? t("followList.emptyFollowers") : t("followList.emptyFollowings")}
            </p>
          </div>
        ) : (
          <ul className="mt-2 flex-1 space-y-2 overflow-y-auto pr-3">
            {users.map((item) => {
              const isSelf = currentUserId === item.userId;
              const isFollowing = followingUserIdSet.has(item.userId);
              const isFollowingsTab = activeTab === "followings";
              const shouldShowActionButton = isFollowingsTab || !isFollowing;
              const actionLabel =
                isFollowingsTab
                  ? t("actions.remove")
                  : isFollowing
                    ? t("actions.following")
                    : t("actions.follow");

              return (
                <li
                  key={item.userId}
                  className="flex items-center justify-between gap-3 rounded-xl px-2 py-2"
                >
                  <div className="flex min-w-0 items-center gap-[14px]">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white/10">
                      {item.profileImageUrl ? (
                        <Image
                          src={item.profileImageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                          {item.name.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm leading-none font-semibold tracking-[-0.02em] text-foreground">
                      {item.name}
                    </p>
                  </div>

                  {!isSelf && shouldShowActionButton ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await onToggleFollow(item.userId, isFollowing, item.name);
                      }}
                      className={`h-7 ${isFollowingsTab ? "min-w-[52px]" : "min-w-[56px]"} ${isFollowingsTab ? "px-2" : "px-1.5"} rounded-md text-xs leading-none font-semibold whitespace-nowrap transition-colors ${
                        isFollowing
                          ? "bg-primary/15 text-primary hover:bg-primary/25"
                          : "btn-primary-surface text-[#FFFFFF] hover:bg-button-primary-hover"
                      }`}
                    >
                      {actionLabel}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppModal>
  );
}
