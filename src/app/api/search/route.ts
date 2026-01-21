import { NextRequest, NextResponse } from "next/server";
import { parseSearchIntent, generateSuggestions } from "@/lib/ai";
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

    return NextResponse.json({
      images: filteredImages,
      intent,
      suggestions,
      total: filteredImages.length,
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
