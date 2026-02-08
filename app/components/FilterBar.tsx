'use client';

import { FilterState, DateRange, SortOption } from '../types';

interface FilterBarProps {
  filterState: FilterState;
  onFilterChange: (newState: FilterState) => void;
}

export default function FilterBar({ filterState, onFilterChange }: FilterBarProps) {
  const handleDateChange = (dateRange: DateRange) => {
    onFilterChange({ ...filterState, dateRange });
  };

  const handleSortChange = (sortBy: SortOption) => {
    onFilterChange({ ...filterState, sortBy });
  };

  const dateOptions: { label: string; value: DateRange }[] = [
    { label: '7일', value: '7d' },
    { label: '30일', value: '30d' },
    { label: '365일', value: '365d' },
    { label: '전체', value: 'all' },
  ];

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: '최신순', value: 'latest' },
    { label: '댓글순', value: 'comments' },
    { label: '조회순', value: 'views' },
    { label: '추천순', value: 'likes' },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-border mb-6 gap-4 md:gap-0">
      {/* 날짜 필터 (왼쪽) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
        {dateOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleDateChange(option.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${
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
      <div className="flex items-center gap-4 text-sm overflow-x-auto pb-2 md:pb-0 no-scrollbar">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            className={`whitespace-nowrap transition-colors
              ${
                filterState.sortBy === option.value
                  ? 'font-bold text-foreground'
                  : 'font-medium text-muted-foreground hover:text-foreground'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
