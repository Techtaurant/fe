'use client';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onEnter?: () => void;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder,
  onEnter,
  className,
}: SearchInputProps) {
  const wrapperClassName = className ? `relative ${className}` : 'relative';

  return (
    <div className={wrapperClassName}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        className="bg-search-input-background text-foreground focus:bg-search-input-background w-full rounded-lg border-none py-2 pr-4 pl-10 text-sm transition-colors duration-200 focus:outline-none"
      />
      <svg
        className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
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
  );
}
