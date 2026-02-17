"use client";

type FeedSkeletonVariant = "community" | "company";

interface FeedSkeletonProps {
  variant?: FeedSkeletonVariant;
  count?: number;
  loadMore?: boolean;
}

export default function FeedSkeleton({
  variant = "community",
  count = 5,
  loadMore = false,
}: FeedSkeletonProps) {
  const titleWidthClass = variant === "community" ? "w-4/5 h-6" : "w-3/4 h-5";
  const metaWidthClass = variant === "community" ? "w-2/3" : "w-1/2";
  const showTagPills = variant === "community" && !loadMore;

  return (
    <div className={`flex flex-col gap-6 ${loadMore ? "pt-2" : ""}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <article
          key={idx}
          className="py-4 md:py-6 border-b border-border animate-pulse"
        >
          <div className={`h-4 ${loadMore ? "w-20" : "w-24"} rounded skeleton-bg mb-3`} />
          <div className={`${titleWidthClass} rounded skeleton-bg mb-3`} />
          <div className={`h-4 ${metaWidthClass} rounded skeleton-bg ${showTagPills ? "mb-4" : ""}`} />
          {showTagPills && (
            <div className="flex gap-2">
              <div className="h-6 w-14 rounded-full skeleton-bg" />
              <div className="h-6 w-16 rounded-full skeleton-bg" />
              <div className="h-6 w-12 rounded-full skeleton-bg" />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
