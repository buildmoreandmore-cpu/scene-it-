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

// Cosmos.so scraper using Apify web-scraper (handles JavaScript)
export async function scrapeCosmos(query: string, limit = 50): Promise<ScrapedImage[]> {
  console.log("[Cosmos] Starting scrape for:", query);
  try {
    // Search URL with query parameter
    const searchUrl = `https://www.cosmos.so/search?q=${encodeURIComponent(query)}`;

    const run = await apifyClient.actor("apify/web-scraper").call({
      startUrls: [{ url: searchUrl }],
      pageFunction: `async function pageFunction(context) {
        // Wait for page to load
        await new Promise(r => setTimeout(r, 6000));
        // Scroll to load more images
        for (let i = 0; i < 5; i++) {
          window.scrollBy(0, window.innerHeight);
          await new Promise(r => setTimeout(r, 2000));
        }
        // Extract images - we're already in browser context
        const images = [];
        document.querySelectorAll('img').forEach((img) => {
          const src = img.src || img.dataset?.src || '';
          if (src && src.startsWith('http') && img.width > 100 && !src.includes('avatar') && !src.includes('profile') && !src.includes('logo')) {
            images.push({
              imageUrl: src,
              title: img.alt || '',
              pageUrl: img.closest('a')?.href || 'https://cosmos.so'
            });
          }
        });
        return images;
      }`,
      maxRequestsPerCrawl: 1,
    }, { timeout: 120000 });

    console.log("[Cosmos] Run completed:", run.status);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const allResults = (items.flat() as (CosmosResult & { "#error"?: boolean })[]).filter(item => !item["#error"]);
    console.log("[Cosmos] Got", allResults.length, "images");

    return allResults
      .filter((item) => item.imageUrl && !item.imageUrl.includes('avatar') && !item.imageUrl.includes('logo'))
      .slice(0, limit)
      .map((item, index) => ({
        id: `cosmos-${Date.now()}-${index}`,
        url: item.imageUrl || "",
        thumbnailUrl: item.imageUrl || "",
        title: item.title || "",
        description: item.description,
        source: "cosmos" as const,
        sourceUrl: item.pageUrl || "https://cosmos.so",
        author: item.author,
      }));
  } catch (error) {
    console.error("[Cosmos] Scraping error:", error);
    return [];
  }
}

// Savee.it scraper - DISABLED (requires login for search)
export async function scrapeSavee(_query: string, _limit = 50): Promise<ScrapedImage[]> {
  // Savee.it requires login to search - disabled for now
  console.log("[Savee] Disabled - requires login");
  return [];
}

// Multi-platform search
export async function searchAllPlatforms(
  query: string,
  platforms: ("pinterest" | "arena" | "cosmos" | "savee")[] = ["arena", "cosmos"],
  limitPerPlatform = 30
): Promise<ScrapedImage[]> {
  console.log("[Search] Starting search for:", query, "on platforms:", platforms);

  const promises: Promise<ScrapedImage[]>[] = [];
  const platformNames: string[] = [];

  if (platforms.includes("pinterest")) {
    promises.push(scrapePinterest(query, limitPerPlatform));
    platformNames.push("pinterest");
  }
  if (platforms.includes("arena")) {
    promises.push(scrapeArena(query, limitPerPlatform));
    platformNames.push("arena");
  }
  if (platforms.includes("cosmos")) {
    promises.push(scrapeCosmos(query, limitPerPlatform));
    platformNames.push("cosmos");
  }
  if (platforms.includes("savee")) {
    promises.push(scrapeSavee(query, limitPerPlatform));
    platformNames.push("savee");
  }

  const results = await Promise.all(promises);

  // Log results per platform
  results.forEach((r, i) => {
    console.log(`[Search] ${platformNames[i]}: ${r.length} images`);
  });

  const allImages = results.flat();
  console.log("[Search] Total images:", allImages.length);

  // Return unsorted - let the API route handle sorting by relevance
  return allImages;
}
