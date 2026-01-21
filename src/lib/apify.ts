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

// Pinterest scraper using Apify
export async function scrapePinterest(query: string, limit = 50): Promise<ScrapedImage[]> {
  try {
    const run = await apifyClient.actor("dSCLg0C3YEZ83HzYX").call({
      search: query,
      maxItems: limit,
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    return (items as PinterestResult[]).map((item, index) => ({
      id: `pinterest-${index}-${Date.now()}`,
      url: item.imageUrl || item.image || "",
      thumbnailUrl: item.imageUrl || item.image || "",
      title: item.title || "",
      description: item.description,
      source: "pinterest" as const,
      sourceUrl: item.url || item.link || "",
      author: item.pinner?.name,
      authorUrl: item.pinner?.url,
    }));
  } catch (error) {
    console.error("Pinterest scraping error:", error);
    return [];
  }
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

// Cosmos.so scraper using Apify Web Scraper
export async function scrapeCosmos(query: string, limit = 50): Promise<ScrapedImage[]> {
  try {
    // Use Apify's Cheerio Scraper for cosmos.so
    const run = await apifyClient.actor("apify/cheerio-scraper").call({
      startUrls: [
        { url: `https://cosmos.so/search?q=${encodeURIComponent(query)}` },
      ],
      pageFunction: `async function pageFunction(context) {
        const { $, request } = context;
        const results = [];

        $('img[src*="cosmos"]').each((i, el) => {
          const $el = $(el);
          const imageUrl = $el.attr('src') || '';
          const title = $el.attr('alt') || '';
          const parentLink = $el.closest('a').attr('href') || '';

          if (imageUrl && imageUrl.includes('http')) {
            results.push({
              imageUrl,
              title,
              pageUrl: parentLink.startsWith('http') ? parentLink : 'https://cosmos.so' + parentLink,
            });
          }
        });

        return results;
      }`,
      maxRequestsPerCrawl: 5,
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const flatItems = (items as unknown as CosmosResult[][]).flat().slice(0, limit);

    return flatItems.map((item, index) => ({
      id: `cosmos-${index}-${Date.now()}`,
      url: item.imageUrl || "",
      thumbnailUrl: item.imageUrl || "",
      title: item.title || "",
      description: item.description,
      source: "cosmos" as const,
      sourceUrl: item.pageUrl || "https://cosmos.so",
      author: item.author,
    }));
  } catch (error) {
    console.error("Cosmos scraping error:", error);
    return [];
  }
}

// Savee.it scraper using Apify Web Scraper
export async function scrapeSavee(query: string, limit = 50): Promise<ScrapedImage[]> {
  try {
    // Use Apify's Cheerio Scraper for savee.it
    const run = await apifyClient.actor("apify/cheerio-scraper").call({
      startUrls: [
        { url: `https://savee.it/search/?q=${encodeURIComponent(query)}` },
      ],
      pageFunction: `async function pageFunction(context) {
        const { $, request } = context;
        const results = [];

        $('img').each((i, el) => {
          const $el = $(el);
          const imageUrl = $el.attr('src') || $el.attr('data-src') || '';
          const title = $el.attr('alt') || '';
          const parentLink = $el.closest('a').attr('href') || '';

          if (imageUrl && imageUrl.includes('http') && !imageUrl.includes('avatar')) {
            results.push({
              imageUrl,
              title,
              pageUrl: parentLink.startsWith('http') ? parentLink : 'https://savee.it' + parentLink,
            });
          }
        });

        return results;
      }`,
      maxRequestsPerCrawl: 5,
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const flatItems = (items as unknown as SaveeResult[][]).flat().slice(0, limit);

    return flatItems.map((item, index) => ({
      id: `savee-${index}-${Date.now()}`,
      url: item.imageUrl || "",
      thumbnailUrl: item.imageUrl || "",
      title: item.title || "",
      description: item.description,
      source: "savee" as const,
      sourceUrl: item.pageUrl || "https://savee.it",
      author: item.author,
    }));
  } catch (error) {
    console.error("Savee scraping error:", error);
    return [];
  }
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

  // Shuffle to mix sources
  return allImages.sort(() => Math.random() - 0.5);
}
