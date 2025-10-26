'use client';

import { useEffect, useState } from 'react';

interface SelectDialogItem {
  id: string;
  name: string;
}

interface SelectDialogProps<T extends SelectDialogItem> {
  isOpen: boolean;
  onClose: () => void;
  items: T[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  title: string;
  searchPlaceholder?: string;
}

export default function SelectDialog<T extends SelectDialogItem>({
  isOpen,
  onClose,
  items,
  selectedIds,
  onToggle,
  title,
  searchPlaceholder = '검색...',
}: SelectDialogProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // body 스크롤 막기
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Dialog가 열릴 때 검색어 초기화
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 검색 필터링
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[400]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-lg)]
                     w-full max-w-[480px] max-h-[640px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-default)]">
            <h2 className="text-xl font-bold text-black">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--color-gray-100)]
                       transition-[background-color] duration-[var(--transition-base)]"
              aria-label="닫기"
            >
              <svg
                className="w-6 h-6 text-[var(--color-gray-700)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-[var(--color-border-default)]">
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-gray-200)] border-none rounded-[var(--radius-pill)]
                         py-2 pl-10 pr-4 text-sm text-[var(--color-gray-700)]
                         transition-[background-color] duration-[var(--transition-base)]
                         focus:bg-[var(--color-gray-100)] focus:outline-none"
                autoFocus
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-gray-600)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {selectedIds.length > 0 && (
              <p className="mt-2 text-sm text-[var(--color-gray-600)]">
                {selectedIds.length}개 선택됨
              </p>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                {filteredItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-[var(--radius-md)]
                             hover:bg-[var(--color-bg-hover)] transition-[background-color] duration-[var(--transition-base)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => onToggle(item.id)}
                      className="w-5 h-5 rounded border-[var(--color-gray-400)] text-black
                               focus:ring-2 focus:ring-black focus:ring-offset-0"
                    />
                    <span className="text-sm text-[var(--color-gray-700)]">
                      {item.name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--color-gray-600)]">
                  검색 결과가 없습니다.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--color-border-default)]">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-[var(--radius-pill)]
                       bg-black text-white text-sm font-medium
                       transition-[background-color] duration-[var(--transition-base)]
                       hover:bg-[var(--color-gray-800)]"
            >
              완료
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
