"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "./Icons";

const placeholders = [
  "moody cyberpunk streets, purple neon...",
  "warm minimalism, wooden furniture",
  "vintage film aesthetic, 35mm grain",
  "mid-century brutalism architecture",
  "ethereal dreamcore landscapes",
];

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (val: string) => void;
  isHero?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  isHero = false,
  isLoading = false,
  className,
}: SearchBarProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isHero) {
      const interval = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isHero]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative group transition-all duration-300",
        isHero ? "w-full max-w-[600px]" : "w-full",
        className
      )}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholders[placeholderIndex]}
        autoFocus={isHero}
        className={cn(
          "w-full bg-bg-secondary font-sans transition-all duration-300",
          "border-2 border-border focus:border-brand-purple outline-none",
          "rounded-pill px-4 sm:px-6",
          isHero ? "text-base sm:text-xl md:text-2xl h-12 sm:h-14 md:h-16 py-3 sm:py-4" : "text-base sm:text-lg h-10 sm:h-12 py-2",
          "text-text-primary placeholder-text-muted shadow-sm focus:shadow-md"
        )}
      />

      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
        {isLoading && (
          <div className="w-5 h-5 border-2 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
        )}
        {!isLoading && value.trim() && (
          <button
            type="submit"
            className="text-text-muted hover:text-brand-purple transition-colors"
          >
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  );
}
