import { ApifyClient } from "apify-client";

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export interface ScrapedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  source: "pinterest" | "arena" | "cosmos" | "savee";
  sourceUrl: string;
  width?: number;
  height?: number;
  author?: string;
  authorUrl?: string;
  tags?: string[];
}

interface PinterestResult {
  imageUrl?: string;
  image?: string;
  title?: string;
  description?: string;
  url?: string;
  link?: string;
  pinner?: { name?: string; url?: string };
}

interface ArenaBlock {
  id: number;
  title?: string;
  description?: string;
  image?: {
    display?: { url?: string };
    thumb?: { url?: string };
    original?: { url?: string };
  };
  source?: { url?: string };
  user?: { slug?: string; full_name?: string };
}

interface ArenaSearchResponse {
  blocks?: ArenaBlock[];
}

interface CosmosResult {
  imageUrl?: string;
  title?: string;
  description?: string;
  pageUrl?: string;
  author?: string;
}

interface SaveeResult {
  imageUrl?: string;
  title?: string;
  description?: string;
  pageUrl?: string;
  author?: string;
}

// Pinterest scraper - disabled (requires paid Apify actor subscription)
export async function scrapePinterest(_query: string, _limit = 50): Promise<ScrapedImage[]> {
  // TODO: Subscribe to easyapi/pinterest-search-scraper or find free alternative
  console.log("Pinterest scraper requires paid Apify subscription");
  return [];
}

// Are.na API (free, no auth needed for public content)
export async function scrapeArena(query: string, limit = 50): Promise<ScrapedImage[]> {
  try {
    const response = await fetch(
      `https://api.are.na/v2/search?q=${encodeURIComponent(query)}&per=100`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Are.na API error: ${response.status}`);
    }

    const data: ArenaSearchResponse = await response.json();
    const blocks = data.blocks || [];

    // Filter to only blocks with images
    const imageBlocks = blocks
      .filter((block) => block.image?.display?.url || block.image?.original?.url)
      .slice(0, limit);

    return imageBlocks.map((block, index) => ({
      id: `arena-${block.id}-${index}`,
      url: block.image?.display?.url || block.image?.original?.url || "",
      thumbnailUrl: block.image?.thumb?.url || block.image?.display?.url || "",
      title: block.title || "",
      description: block.description || undefined,
      source: "arena" as const,
      sourceUrl: block.source?.url || `https://www.are.na/block/${block.id}`,
      author: block.user?.full_name,
      authorUrl: block.user?.slug ? `https://www.are.na/${block.user.slug}` : undefined,
    }));
  } catch (error) {
    console.error("Are.na scraping error:", error);
    return [];
  }
}

// Cosmos.so scraper - disabled due to Apify cheerio-scraper issues
export async function scrapeCosmos(_query: string, _limit = 50): Promise<ScrapedImage[]> {
  // TODO: Fix cheerio-scraper pageFunction syntax or find alternative
  console.log("Cosmos scraper temporarily disabled");
  return [];
}

// Savee.it scraper - disabled due to Apify cheerio-scraper issues
export async function scrapeSavee(_query: string, _limit = 50): Promise<ScrapedImage[]> {
  // TODO: Fix cheerio-scraper pageFunction syntax or find alternative
  console.log("Savee scraper temporarily disabled");
  return [];
}

// Multi-platform search
export async function searchAllPlatforms(
  query: string,
  platforms: ("pinterest" | "arena" | "cosmos" | "savee")[] = ["pinterest", "arena", "cosmos", "savee"],
  limitPerPlatform = 30
): Promise<ScrapedImage[]> {
  const promises: Promise<ScrapedImage[]>[] = [];

  if (platforms.includes("pinterest")) {
    promises.push(scrapePinterest(query, limitPerPlatform));
  }
  if (platforms.includes("arena")) {
    promises.push(scrapeArena(query, limitPerPlatform));
  }
  if (platforms.includes("cosmos")) {
    promises.push(scrapeCosmos(query, limitPerPlatform));
  }
  if (platforms.includes("savee")) {
    promises.push(scrapeSavee(query, limitPerPlatform));
  }

  const results = await Promise.all(promises);
  const allImages = results.flat();

  // Return unsorted - let the API route handle sorting by relevance
  return allImages;
}
