"use client";

import { useEffect } from "react";
import { Heart, XIcon, DownloadIcon, ExternalLinkIcon } from "./Icons";
import { ScrapedImage } from "@/types";

interface LightboxProps {
  image: ScrapedImage;
  isSaved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}

export function Lightbox({ image, isSaved, onToggleSave, onClose }: LightboxProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 animate-fade-in">
      <button
        onClick={onClose}
        className="fixed top-6 right-6 text-white/70 hover:text-brand-pink transition-colors p-2"
        aria-label="Close"
      >
        <XIcon className="w-8 h-8" />
      </button>

      <div className="relative w-full h-full max-w-[90vw] max-h-[80vh] flex items-center justify-center p-4">
        <img
          src={image.url}
          alt={image.description || image.title}
          className="max-w-full max-h-full object-contain animate-zoom-in"
        />
      </div>

      <div className="mt-8 flex items-center gap-10 md:gap-16">
        <button
          onClick={onToggleSave}
          className="flex items-center gap-2 text-white hover:text-brand-pink hover:scale-105 transition-all text-lg font-medium"
        >
          <Heart filled={isSaved} className="w-6 h-6" />
          {isSaved ? "Saved" : "Save"}
        </button>

        <a
          href={image.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white hover:text-brand-pink hover:scale-105 transition-all text-lg font-medium"
        >
          <DownloadIcon className="w-6 h-6" />
          Download
        </a>

        <a
          href={image.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white hover:text-brand-pink hover:scale-105 transition-all text-lg font-medium"
        >
          <ExternalLinkIcon className="w-6 h-6" />
          {image.source} →
        </a>
      </div>

      {/* Backdrop Click */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
