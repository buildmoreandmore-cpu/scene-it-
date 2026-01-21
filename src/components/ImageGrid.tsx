"use client";

import { ImageCard } from "./ImageCard";
import { ScrapedImage } from "@/types";

interface ImageGridProps {
  images: ScrapedImage[];
  onToggleSave?: (image: ScrapedImage) => void;
  onSelect?: (image: ScrapedImage) => void;
  savedIds?: Set<string>;
}

export function ImageGrid({
  images,
  onToggleSave,
  onSelect,
  savedIds = new Set(),
}: ImageGridProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
      {images.map((image) => (
        <div key={image.id} className="break-inside-avoid mb-6">
          <ImageCard
            image={image}
            isSaved={savedIds.has(image.id)}
            onToggleSave={(e) => {
              e.stopPropagation();
              onToggleSave?.(image);
            }}
            onClick={() => onSelect?.(image)}
          />
        </div>
      ))}
    </div>
  );
}
