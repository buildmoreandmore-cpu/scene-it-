import { NextRequest, NextResponse } from "next/server";
import { parseSearchIntent, generateSuggestions, scoreImageRelevance } from "@/lib/ai";
import { searchAllPlatforms } from "@/lib/apify";

export async function POST(request: NextRequest) {
  try {
    const { query, platforms } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Parse search intent with AI
    const intent = await parseSearchIntent(query);

    // Search platforms in parallel
    const [images, suggestions] = await Promise.all([
      searchAllPlatforms(
        intent.refinedQuery || query,
        platforms || ["pinterest", "arena"],
        30
      ),
      generateSuggestions(query, intent.mood),
    ]);

    // Filter out images that match negative filters
    const filteredImages = images.filter((img) => {
      const text = `${img.title} ${img.description || ""}`.toLowerCase();
      return !intent.negativeFilters.some((filter) =>
        text.includes(filter.toLowerCase())
      );
    });

    // Score and rank images by relevance
    const scoredImages = filteredImages
      .map((img) => ({
        ...img,
        relevance: scoreImageRelevance(
          `${img.title} ${img.description || ""} ${img.url}`,
          intent
        ),
      }))
      .filter((img) => img.relevance >= 0.1) // Remove very low matches
      .sort((a, b) => b.relevance - a.relevance);

    return NextResponse.json({
      images: scoredImages,
      intent,
      suggestions,
      total: scoredImages.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // Redirect to POST handler logic
  const intent = await parseSearchIntent(query);
  const images = await searchAllPlatforms(intent.refinedQuery || query, ["pinterest", "arena"], 30);

  return NextResponse.json({
    images,
    intent,
    total: images.length,
  });
}
