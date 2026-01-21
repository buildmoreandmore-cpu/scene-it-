"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FilterOption } from "@/types/filters";

interface FilterSelectorProps {
  title: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (id: string) => void;
  showColorSwatches?: boolean;
  variant?: "default" | "negative";
}

export function FilterSelector({
  title,
  options,
  selected,
  onToggle,
  showColorSwatches = false,
  variant = "default",
}: FilterSelectorProps) {
  const chipColors = {
    default: {
      inactive: "bg-brand-stone text-brand-stoneDark hover:bg-brand-purple hover:text-white",
      active: "bg-brand-purple text-white",
    },
    negative: {
      inactive: "bg-red-50 text-red-600 hover:bg-red-100",
      active: "bg-red-500 text-white",
    },
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-brand-stoneGray uppercase tracking-wide">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const isSelected = selected.includes(option.id);
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => onToggle(option.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                isSelected
                  ? chipColors[variant].active
                  : chipColors[variant].inactive
              )}
            >
              {showColorSwatches && option.color && (
                <span
                  className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                  style={{ backgroundColor: option.color }}
                />
              )}
              {variant === "negative" && isSelected && (
                <span className="text-xs font-bold">NOT</span>
              )}
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
