"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../../hooks/useUser";
import { queryKeys } from "../../lib/queryKeys";
import { fetchLinkViewerStates } from "../../services/links/client";
import type { LinkContent } from "../../services/links/types";
import LinkCard from "./LinkCard";

interface LinkListProps {
  links: LinkContent[];
  locale: string;
  emptyMessage: string;
  summaryFallback: string;
  readLabel: string;
  unreadLabel: string;
}

function getPublicLink(link: LinkContent): LinkContent {
  const publicLink = { ...link };
  delete publicLink.sourceCompanyUserId;
  return publicLink;
}

export default function LinkList({
  links,
  locale,
  emptyMessage,
  summaryFallback,
  readLabel,
  unreadLabel,
}: LinkListProps) {
  const { user } = useUser();
  const linkIds = useMemo(() => links.map((link) => link.id), [links]);
  const viewerStatesQuery = useQuery({
    queryKey: queryKeys.links.viewerStates(linkIds),
    queryFn: () => fetchLinkViewerStates(linkIds),
    enabled: Boolean(user) && linkIds.length > 0,
  });
  const readStatusByLinkId = useMemo(() => {
    return new Map(
      (viewerStatesQuery.data ?? []).map((state) => [
        state.linkId,
        state.isRead,
      ]),
    );
  }, [viewerStatesQuery.data]);
  const shouldShowReadStatus =
    Boolean(user) && viewerStatesQuery.isSuccess && !viewerStatesQuery.isError;

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={getPublicLink(link)}
          locale={locale}
          summaryFallback={summaryFallback}
          readStatus={
            shouldShowReadStatus
              ? readStatusByLinkId.get(link.id) ?? Boolean(link.isRead)
              : undefined
          }
          readLabel={readLabel}
          unreadLabel={unreadLabel}
        />
      ))}
    </div>
  );
}
