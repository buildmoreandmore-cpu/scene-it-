"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Logo, SearchBar, ImageCard, LoadingGrid, Lightbox, Heart } from "@/components";
import { ScrapedImage } from "@/types";

type View = "landing" | "search" | "saved";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ScrapedImage[]>([]);
  const [savedImages, setSavedImages] = useState<ScrapedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ScrapedImage | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setIsLoading(true);
    setView("search");

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setResults(data.images || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleSave = (img: ScrapedImage) => {
    setSavedImages((prev) => {
      const isAlreadySaved = prev.some((s) => s.id === img.id);
      if (isAlreadySaved) {
        return prev.filter((s) => s.id !== img.id);
      } else {
        return [...prev, img];
      }
    });
  };

  const isLanding = view === "landing";

  return (
    <div className="min-h-screen bg-brand-white text-brand-stoneDark">
      {/* Header - shown on search and saved views */}
      {!isLanding && (
        <header className="sticky top-0 z-40 h-20 bg-brand-white/80 backdrop-blur-md border-b border-brand-stone flex items-center px-6 md:px-10 justify-between gap-8 transition-all duration-300">
          <button
            onClick={() => setView("landing")}
            className="text-2xl font-bold tracking-tighter text-brand-charcoal hover:opacity-70 transition-opacity"
          >
            Scene.it
          </button>

          <div className="flex-1 max-w-[600px] transition-all duration-500">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              isLoading={isLoading}
              onSearch={handleSearch}
            />
          </div>

          <button
            onClick={() => setView("saved")}
            className="relative p-2 group flex items-center"
          >
            <Heart
              className={`w-8 h-8 transition-all duration-300 ${
                savedImages.length > 0
                  ? "text-brand-pink scale-110"
                  : "text-brand-stoneGray group-hover:text-brand-pink"
              }`}
              filled={savedImages.length > 0}
            />
            {savedImages.length > 0 && (
              <span className="absolute -top-0 -right-0 bg-brand-pink text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-zoom-in shadow-lg">
                {savedImages.length}
              </span>
            )}
          </button>
        </header>
      )}

      <main>
        {/* Landing Page */}
        {view === "landing" && <LandingPage onSearch={handleSearch} />}

        {/* Search Results */}
        {view === "search" && (
          <ResultsPage
            results={results}
            isLoading={isLoading}
            savedImages={savedImages}
            onToggleSave={toggleSave}
            onSelect={setSelectedImage}
          />
        )}

        {/* Saved Images */}
        {view === "saved" && (
          <SavedPage
            savedImages={savedImages}
            onToggleSave={toggleSave}
            onSelect={setSelectedImage}
            onGoHome={() => setView("landing")}
          />
        )}
      </main>

      {/* Lightbox */}
      {selectedImage && (
        <Lightbox
          image={selectedImage}
          isSaved={savedImages.some((s) => s.id === selectedImage.id)}
          onToggleSave={() => toggleSave(selectedImage)}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

// Landing Page Component
function LandingPage({ onSearch }: { onSearch: (val: string) => void }) {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-brand-white animate-fade-in">
      <div className="text-center mb-10 select-none">
        <h1 className="text-6xl font-bold tracking-tighter mb-4 text-brand-charcoal">
          Scene.it
        </h1>
        <div className="text-brand-stoneGray text-lg font-medium tracking-tight opacity-70">
          <p>See what you imagine.</p>
          <p>Find what you feel.</p>
        </div>
      </div>

      <SearchBar isHero value={query} onChange={setQuery} onSearch={onSearch} />

      <div className="mt-8 flex flex-wrap justify-center items-center gap-3 text-sm text-brand-stoneGray">
        <span className="opacity-60">Try:</span>
        {["warm minimalism", "vintage film", "brutalist mood"].map((tag) => (
          <button
            key={tag}
            onClick={() => onSearch(tag)}
            className="px-5 py-2 rounded-pill bg-brand-stone text-brand-stoneDark hover:bg-brand-purple hover:text-white transition-all duration-300 font-medium active:scale-95"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

// Results Page Component
function ResultsPage({
  results,
  isLoading,
  savedImages,
  onToggleSave,
  onSelect,
}: {
  results: ScrapedImage[];
  isLoading: boolean;
  savedImages: ScrapedImage[];
  onToggleSave: (img: ScrapedImage) => void;
  onSelect: (img: ScrapedImage) => void;
}) {
  if (isLoading)
    return (
      <div className="py-12 px-4">
        <LoadingGrid />
      </div>
    );

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-brand-stoneGray animate-slide-up">
        <p className="text-2xl font-medium tracking-tight">No results found.</p>
        <p className="text-base mt-2 opacity-60">Try exploring different visual moods.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-10 animate-fade-in">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
        {results.map((img) => (
          <div key={img.id} className="break-inside-avoid mb-6">
            <ImageCard
              image={img}
              isSaved={savedImages.some((s) => s.id === img.id)}
              onToggleSave={(e) => {
                e.stopPropagation();
                onToggleSave(img);
              }}
              onClick={() => onSelect(img)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Saved Page Component
function SavedPage({
  savedImages,
  onToggleSave,
  onSelect,
  onGoHome,
}: {
  savedImages: ScrapedImage[];
  onToggleSave: (img: ScrapedImage) => void;
  onSelect: (img: ScrapedImage) => void;
  onGoHome: () => void;
}) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-brand-charcoal">
          Collected Moments
        </h2>
        <p className="text-brand-stoneGray mt-2 opacity-60 font-medium">
          {savedImages.length} images saved
        </p>
      </div>

      {savedImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-brand-stoneGray">
          <p className="text-xl font-medium">Nothing saved yet.</p>
          <p className="text-base mt-2 opacity-60">Begin your discovery to fill this space.</p>
          <button
            onClick={onGoHome}
            className="mt-8 px-6 py-2 bg-brand-charcoal text-white rounded-pill hover:bg-brand-purple transition-all"
          >
            Start Searching
          </button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
          {savedImages.map((img) => (
            <div key={img.id} className="break-inside-avoid mb-6">
              <ImageCard
                image={img}
                isSaved={true}
                onToggleSave={(e) => {
                  e.stopPropagation();
                  onToggleSave(img);
                }}
                onClick={() => onSelect(img)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
