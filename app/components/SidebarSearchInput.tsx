'use client';

interface SidebarSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export default function SidebarSearchInput({
  value,
  onChange,
  placeholder,
}: SidebarSearchInputProps) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-muted border-none rounded-full
                py-2 pl-10 pr-4 text-sm text-foreground
                transition-colors duration-200
                focus:bg-muted/70 focus:outline-none"
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
