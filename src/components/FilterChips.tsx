"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface FilterChipsProps {
  intent: {
    mood?: string[];
    colors?: string[];
    style?: string[];
    negativeFilters?: string[];
  } | null;
  onRemoveFilter?: (type: string, value: string) => void;
  className?: string;
}

export function FilterChips({ intent, onRemoveFilter, className }: FilterChipsProps) {
  if (!intent) return null;

  const chips: { type: string; value: string; color: string }[] = [];

  intent.mood?.forEach((m) =>
    chips.push({ type: "mood", value: m, color: "bg-purple-100 text-purple-700" })
  );
  intent.colors?.forEach((c) =>
    chips.push({ type: "color", value: c, color: "bg-blue-100 text-blue-700" })
  );
  intent.style?.forEach((s) =>
    chips.push({ type: "style", value: s, color: "bg-green-100 text-green-700" })
  );
  intent.negativeFilters?.forEach((n) =>
    chips.push({ type: "negative", value: n, color: "bg-red-100 text-red-700" })
  );

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip, index) => (
        <motion.span
          key={`${chip.type}-${chip.value}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
            chip.color
          )}
        >
          {chip.type === "negative" && <span className="text-xs">NOT</span>}
          {chip.value}
          {onRemoveFilter && (
            <button
              onClick={() => onRemoveFilter(chip.type, chip.value)}
              className="ml-1 rounded-full p-0.5 hover:bg-black/10"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </motion.span>
      ))}
    </div>
  );
}
