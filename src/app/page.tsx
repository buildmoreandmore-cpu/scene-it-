"use client";

import { useState, useCallback } from "react";
import { Logo, SearchBar, ImageCard, LoadingGrid, Lightbox, Heart, RefineView, ThemeToggle } from "@/components";
import { ScrapedImage, UserFilters } from "@/types";

type View = "landing" | "refine" | "search" | "saved";

const initialFilters: UserFilters = {
  mood: [],
  colors: [],
  style: [],
  negativeFilters: [],
};

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingQuery, setPendingQuery] = useState("");
  const [userFilters, setUserFilters] = useState<UserFilters>(initialFilters);
  const [results, setResults] = useState<ScrapedImage[]>([]);
  const [savedImages, setSavedImages] = useState<ScrapedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ScrapedImage | null>(null);

  const preloadImages = async (images: ScrapedImage[]) => {
    const promises = images.slice(0, 50).map(
      (img) =>
        new Promise<void>((resolve) => {
          const el = new window.Image();
          el.onload = el.onerror = () => resolve();
          el.src = img.thumbnailUrl || img.url;
        })
    );
    await Promise.all(promises);
    setImagesPreloaded(true);
  };

  // Go to refine view when search is submitted
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setPendingQuery(query);
    setUserFilters(initialFilters);
    setView("refine");
  }, []);

  // Execute the actual search with optional filters
  const executeSearch = useCallback(async (query: string, filters?: UserFilters) => {
    setSearchQuery(query);
    setIsLoading(true);
    setImagesPreloaded(false);
    setView("search");

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userFilters: filters }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      const images = data.images || [];
      setResults(images);
      setIsLoading(false);
      if (images.length > 0) {
        await preloadImages(images);
      } else {
        setImagesPreloaded(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setIsLoading(false);
      setImagesPreloaded(true);
    }
  }, []);

  // Search with user-selected filters
  const handleSearchWithFilters = useCallback(() => {
    executeSearch(pendingQuery, userFilters);
  }, [pendingQuery, userFilters, executeSearch]);

  // Skip filters and search immediately
  const handleSkipSearch = useCallback(() => {
    executeSearch(pendingQuery);
  }, [pendingQuery, executeSearch]);

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
  const isRefine = view === "refine";

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      {/* Header - shown on search and saved views (not landing or refine) */}
      {!isLanding && !isRefine && (
        <header className="sticky top-0 z-40 h-16 sm:h-20 bg-header-bg backdrop-blur-md border-b border-border flex items-center px-3 sm:px-6 md:px-10 justify-between gap-2 sm:gap-6 md:gap-8 transition-all duration-300">
          <button
            onClick={() => setView("landing")}
            className="hover:opacity-70 transition-opacity flex-shrink-0"
          >
            <img src="/logo.png" alt="Scene.it" className="h-8 sm:h-10 w-auto" />
          </button>

          <div className="flex-1 max-w-[600px] transition-all duration-500">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              isLoading={isLoading}
              onSearch={handleSearch}
            />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setView("saved")}
              className="relative p-2 group flex items-center"
            >
              <Heart
                className={`w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300 ${
                  savedImages.length > 0
                    ? "text-brand-pink scale-110"
                    : "text-text-muted group-hover:text-brand-pink"
                }`}
                filled={savedImages.length > 0}
              />
              {savedImages.length > 0 && (
                <span className="absolute -top-0 -right-0 bg-brand-pink text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-zoom-in shadow-lg">
                  {savedImages.length}
                </span>
              )}
            </button>
          </div>
        </header>
      )}

      <main>
        {/* Landing Page */}
        {view === "landing" && <LandingPage onSearch={handleSearch} />}

        {/* Refine View */}
        {view === "refine" && (
          <RefineView
            query={pendingQuery}
            filters={userFilters}
            onFilterChange={setUserFilters}
            onSearchWithFilters={handleSearchWithFilters}
            onSkipSearch={handleSkipSearch}
          />
        )}

        {/* Search Results */}
        {view === "search" && (
          <ResultsPage
            results={results}
            isLoading={isLoading || !imagesPreloaded}
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bg-primary animate-fade-in relative">
      {/* Theme Toggle in top right */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="text-center mb-6 sm:mb-10 select-none">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-4 text-text-primary">
          Scene.it
        </h1>
        <div className="text-text-muted text-lg font-medium tracking-tight">
          <p>See what you imagine.</p>
          <p>Find what you feel.</p>
        </div>
      </div>

      <SearchBar isHero value={query} onChange={setQuery} onSearch={onSearch} />

      <div className="mt-6 sm:mt-8 flex flex-wrap justify-center items-center gap-3 text-sm text-text-muted">
        <span className="opacity-60">Try:</span>
        {["warm minimalism", "vintage film", "brutalist mood"].map((tag) => (
          <button
            key={tag}
            onClick={() => onSearch(tag)}
            className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-pill bg-bg-tertiary text-text-primary hover:bg-brand-purple hover:text-white transition-all duration-300 font-medium active:scale-95"
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
      <div className="flex flex-col items-center justify-center py-40 text-text-muted animate-slide-up">
        <p className="text-2xl font-medium tracking-tight">No results found.</p>
        <p className="text-base mt-2 opacity-60">Try exploring different visual moods.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 sm:py-10 animate-fade-in">
      <p className="text-sm text-text-muted mb-4">
        Showing {results.length} images
      </p>
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
              preloaded
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
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Collected Moments
        </h2>
        <p className="text-text-muted mt-2 font-medium">
          {savedImages.length} images saved
        </p>
      </div>

      {savedImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-text-muted">
          <p className="text-xl font-medium">Nothing saved yet.</p>
          <p className="text-base mt-2 opacity-60">Begin your discovery to fill this space.</p>
          <button
            onClick={onGoHome}
            className="mt-8 px-6 py-2 bg-text-primary text-bg-primary rounded-pill hover:bg-brand-purple hover:text-white transition-all"
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
