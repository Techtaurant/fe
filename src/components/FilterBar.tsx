'use client';

import { useTranslations } from 'next-intl';

import { DateRange, FilterState, SortOption } from '../types';

interface FilterBarProps {
  filterState: FilterState;
  onFilterChange: (newState: FilterState) => void;
}

export default function FilterBar({ filterState, onFilterChange }: FilterBarProps) {
  const t = useTranslations('FilterBar');

  const handleDateChange = (dateRange: DateRange) => {
    onFilterChange({ ...filterState, dateRange });
  };

  const handleSortChange = (sortBy: SortOption) => {
    onFilterChange({ ...filterState, sortBy });
  };

  const dateOptions: { label: string; value: DateRange }[] = [
    { label: t('date.7d'), value: '7d' },
    { label: t('date.30d'), value: '30d' },
    { label: t('date.365d'), value: '365d' },
    { label: t('date.all'), value: 'all' },
  ];

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: t('sort.latest'), value: 'latest' },
    { label: t('sort.comments'), value: 'comments' },
    { label: t('sort.views'), value: 'views' },
    { label: t('sort.likes'), value: 'likes' },
  ];

  return (
    <div className="border-border mb-6 flex flex-col justify-between gap-4 border-b py-4 md:flex-row md:items-center md:gap-0">
      {/* 날짜 필터 (왼쪽) */}
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
        {dateOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleDateChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              filterState.dateRange === option.value
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 정렬 필터 (오른쪽) */}
      <div className="no-scrollbar flex items-center gap-4 overflow-x-auto pb-2 text-sm md:pb-0">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            className={`whitespace-nowrap transition-colors ${
              filterState.sortBy === option.value
                ? 'text-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
