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
        className="w-full bg-search-input-background border-none rounded-lg py-2 pl-10 pr-4 text-sm text-foreground transition-colors duration-200 focus:bg-search-input-background focus:outline-none"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
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
