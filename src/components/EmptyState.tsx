"use client";

import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  type: "initial" | "no-results" | "error";
  query?: string;
  onSuggestionClick?: (suggestion: string) => void;
}

const suggestions = [
  "cozy coffee shop with warm lighting",
  "brutalist architecture in golden hour",
  "minimal scandinavian interiors",
  "moody forest photography",
  "vintage film aesthetic portraits",
];

export function EmptyState({ type, query, onSuggestionClick }: EmptyStateProps) {
  if (type === "initial") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="mb-6 rounded-full bg-surface p-6">
          <Sparkles className="h-12 w-12 text-secondary" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Discover your vision
        </h2>
        <p className="mb-8 max-w-md text-center text-muted">
          Describe what you&apos;re looking for in natural language. Be as vague or specific as
          you like.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick?.(suggestion)}
              className="rounded-full bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary hover:text-white"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  if (type === "no-results") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="mb-6 rounded-full bg-surface p-6">
          <Search className="h-12 w-12 text-muted" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          No results for &ldquo;{query}&rdquo;
        </h2>
        <p className="mb-6 text-muted">Try a different search or adjust your filters</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="mb-6 rounded-full bg-red-100 p-6">
        <Search className="h-12 w-12 text-red-500" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">Something went wrong</h2>
      <p className="text-muted">Please try again later</p>
    </motion.div>
  );
}
