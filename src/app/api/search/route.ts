import { NextRequest, NextResponse } from "next/server";
import { parseSearchIntent, generateSuggestions, scoreImageRelevance, SearchIntent } from "@/lib/ai";
import { searchAllPlatforms } from "@/lib/apify";
import { UserFilters } from "@/types/filters";

export async function POST(request: NextRequest) {
  try {
    const { query, platforms, userFilters } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Parse search intent with AI
    const aiIntent = await parseSearchIntent(query);

    // Merge user-selected filters with AI-parsed intent
    const intent: SearchIntent = {
      ...aiIntent,
      mood: [...new Set([...(userFilters?.mood || []), ...aiIntent.mood])],
      colors: [...new Set([...(userFilters?.colors || []), ...aiIntent.colors])],
      style: [...new Set([...(userFilters?.style || []), ...aiIntent.style])],
      negativeFilters: [...new Set([...(userFilters?.negativeFilters || []), ...aiIntent.negativeFilters])],
    };

    // Search platforms in parallel
    // Note: Pinterest disabled (requires paid Apify actor). Arena, Cosmos, Savee active.
    const [images, suggestions] = await Promise.all([
      searchAllPlatforms(
        intent.refinedQuery || query,
        platforms || ["arena", "cosmos", "savee"],
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

    // Score and rank images by relevance (only use title/description, not URL)
    const scoredImages = filteredImages
      .map((img) => ({
        ...img,
        relevance: scoreImageRelevance(
          `${img.title} ${img.description || ""}`,
          intent
        ),
      }))
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
  const images = await searchAllPlatforms(intent.refinedQuery || query, ["arena", "cosmos", "savee"], 30);

  return NextResponse.json({
    images,
    intent,
    total: images.length,
  });
}
