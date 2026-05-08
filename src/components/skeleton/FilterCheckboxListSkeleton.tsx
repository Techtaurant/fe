'use client';

interface FilterCheckboxListSkeletonProps {
  count?: number;
}

export default function FilterCheckboxListSkeleton({ count = 5 }: FilterCheckboxListSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-2 py-1">
          <div className="border-border skeleton-bg h-4 w-4 animate-pulse rounded border" />
          <div className="skeleton-bg h-4 w-24 animate-pulse rounded" />
        </div>
      ))}
    </>
  );
}
