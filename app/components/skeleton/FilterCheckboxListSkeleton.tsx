"use client";

interface FilterCheckboxListSkeletonProps {
  count?: number;
}

export default function FilterCheckboxListSkeleton({
  count = 5,
}: FilterCheckboxListSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-2 py-1">
          <div className="w-4 h-4 rounded border border-border skeleton-bg animate-pulse" />
          <div className="h-4 w-24 rounded skeleton-bg animate-pulse" />
        </div>
      ))}
    </>
  );
}
