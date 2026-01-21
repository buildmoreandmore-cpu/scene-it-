"use client";

import { useState } from "react";
import { ScrapedImage } from "@/types";
import { Heart } from "./Icons";

interface ImageCardProps {
  image: ScrapedImage;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export function ImageCard({ image, isSaved, onToggleSave, onClick }: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-card transition-all duration-300 hover:shadow-xl hover:shadow-black/5"
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="skeleton absolute inset-0 w-full" style={{ paddingBottom: "100%" }} />
      )}

      <img
        src={image.thumbnailUrl || image.url}
        alt={image.description || image.title || "Image"}
        className={`w-full h-auto block object-cover transition-transform duration-500 group-hover:scale-105 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <div
          onClick={onToggleSave}
          className={`p-3 rounded-full transition-all duration-300 ${
            isSaved
              ? "text-brand-pink scale-110"
              : "text-white hover:text-brand-pink hover:scale-110"
          }`}
        >
          <Heart filled={isSaved} className="w-10 h-10" />
        </div>

        {/* Platform Badge */}
        <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-mono text-white tracking-wider uppercase">
          {image.source}
        </div>
      </div>

      {/* Persistent Saved State */}
      {isSaved && (
        <div className="absolute bottom-3 right-3 text-brand-pink drop-shadow-lg">
          <Heart filled className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
