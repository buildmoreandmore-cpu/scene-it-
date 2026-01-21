"use client";

import { motion } from "framer-motion";
import { FilterSelector } from "./FilterSelector";
import { ArrowRightIcon } from "./Icons";
import { UserFilters } from "@/types/filters";
import {
  moodOptions,
  colorOptions,
  styleOptions,
  exclusionOptions,
} from "@/lib/filterPresets";

interface RefineViewProps {
  query: string;
  filters: UserFilters;
  onFilterChange: (filters: UserFilters) => void;
  onSearchWithFilters: () => void;
  onSkipSearch: () => void;
}

export function RefineView({
  query,
  filters,
  onFilterChange,
  onSearchWithFilters,
  onSkipSearch,
}: RefineViewProps) {
  const toggleFilter = (
    category: keyof UserFilters,
    id: string
  ) => {
    const current = filters[category];
    const updated = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    onFilterChange({ ...filters, [category]: updated });
  };

  const hasFilters =
    filters.mood.length > 0 ||
    filters.colors.length > 0 ||
    filters.style.length > 0 ||
    filters.negativeFilters.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-brand-white"
    >
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal mb-3">
            Refine your search
          </h1>
          <p className="text-lg text-brand-stoneGray">
            &ldquo;{query}&rdquo;
          </p>
        </motion.div>

        {/* Filter Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          <FilterSelector
            title="Mood"
            options={moodOptions}
            selected={filters.mood}
            onToggle={(id) => toggleFilter("mood", id)}
          />

          <FilterSelector
            title="Colors"
            options={colorOptions}
            selected={filters.colors}
            onToggle={(id) => toggleFilter("colors", id)}
            showColorSwatches
          />

          <FilterSelector
            title="Style"
            options={styleOptions}
            selected={filters.style}
            onToggle={(id) => toggleFilter("style", id)}
          />

          <FilterSelector
            title="Exclude"
            options={exclusionOptions}
            selected={filters.negativeFilters}
            onToggle={(id) => toggleFilter("negativeFilters", id)}
            variant="negative"
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mt-12 justify-center"
        >
          <button
            onClick={onSkipSearch}
            className="px-6 py-3 text-brand-stoneGray hover:text-brand-charcoal font-medium transition-colors"
          >
            Skip & Search
          </button>
          <button
            onClick={onSearchWithFilters}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-charcoal text-white font-semibold rounded-pill hover:bg-brand-purple transition-all duration-300 active:scale-95"
          >
            {hasFilters ? "Search with Filters" : "Search"}
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
