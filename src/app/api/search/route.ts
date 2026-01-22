import { NextRequest, NextResponse } from "next/server";
import { parseSearchIntent, generateSuggestions, scoreImageRelevance, SearchIntent } from "@/lib/ai";
import { searchAllPlatforms } from "@/lib/apify";
import { searchAuthenticatedPlatforms } from "@/lib/authenticated-scrapers";
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

    // Search all platforms in parallel:
    // - Apify: Arena, Cosmos (public APIs/scraping)
    // - Authenticated: Pinterest, Savee, Shotdeck (requires login)
    console.log("[Search API] Starting search for:", intent.refinedQuery || query);

    const [apifyImages, authImages, suggestions] = await Promise.all([
      searchAllPlatforms(
        intent.refinedQuery || query,
        platforms || ["arena", "cosmos"],
        30
      ).catch(err => {
        console.error("[Search API] Apify error:", err);
        return [];
      }),
      searchAuthenticatedPlatforms(
        intent.refinedQuery || query,
        ["pinterest", "shotdeck"],
        15
      ).catch(err => {
        console.error("[Search API] Auth scrapers error:", err);
        return [];
      }),
      generateSuggestions(query, intent.mood),
    ]);

    console.log("[Search API] Results - Apify:", apifyImages.length, "Auth:", authImages.length);

    // Combine all images
    const images = [...apifyImages, ...authImages];

    // Default filters to always exclude (text-heavy, articles, irrelevant content)
    const defaultNegativePatterns = [
      "article", "blog", "news", "tweet", "post", "thread", "comment",
      "screenshot", "infographic", "chart", "diagram", "meme",
      "logo", "icon", "banner", "ad", "advertisement",
      "text", "quote", "typography", "font",
      "website", "webpage", "browser", "app store",
      "book cover", "magazine cover", "album cover",
      "thumbnail", "preview", "placeholder"
    ];

    // URL patterns that indicate non-photo content
    const badUrlPatterns = [
      /medium\.com/i, /substack/i, /wordpress/i, /blogger/i,
      /twitter\.com/i, /x\.com/i, /facebook/i, /linkedin/i,
      /reddit\.com/i, /imgur\.com\/a\//i,
      /\.gif$/i, /\.svg$/i,
      /avatar/i, /profile/i, /thumb.*small/i
    ];

    // Filter out images that match negative filters
    const filteredImages = images.filter((img) => {
      const text = `${img.title} ${img.description || ""}`.toLowerCase();
      const url = (img.url + img.sourceUrl).toLowerCase();

      // Check user/AI negative filters
      const matchesNegativeFilter = intent.negativeFilters.some((filter) =>
        text.includes(filter.toLowerCase())
      );
      if (matchesNegativeFilter) return false;

      // Check default negative patterns
      const matchesDefaultPattern = defaultNegativePatterns.some((pattern) =>
        text.includes(pattern)
      );
      if (matchesDefaultPattern) return false;

      // Check URL patterns
      const matchesBadUrl = badUrlPatterns.some((pattern) =>
        pattern.test(url)
      );
      if (matchesBadUrl) return false;

      // Filter out very short titles that are likely not descriptive photos
      if (img.title && img.title.length > 100) return false;

      return true;
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
      .filter((img) => img.relevance > 0.2) // Lower threshold to show more results
      .sort((a, b) => b.relevance - a.relevance);

    console.log("[Search API] After filtering:", scoredImages.length, "images");

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
