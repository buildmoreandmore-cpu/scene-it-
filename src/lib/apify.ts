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
  try {
    // Scrape the discover page which has curated content, then scroll to load more
    const run = await apifyClient.actor("apify/web-scraper").call({
      startUrls: [{ url: `https://www.cosmos.so/discover` }],
      pageFunction: `async function pageFunction(context) {
        const { page, request } = context;

        // Wait for initial images to load
        await page.waitForSelector('img', { timeout: 15000 }).catch(() => {});

        // Scroll down multiple times to load more images
        for (let i = 0; i < 5; i++) {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight));
          await new Promise(r => setTimeout(r, 1500));
        }

        const results = await page.evaluate(() => {
          const images = [];
          document.querySelectorAll('img').forEach((img) => {
            const src = img.src || img.dataset.src || '';
            const alt = img.alt || '';
            const link = img.closest('a')?.href || '';
            // Filter out small images, avatars, logos, icons
            if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon') && (img.naturalWidth > 150 || img.width > 150)) {
              images.push({ imageUrl: src, title: alt, pageUrl: link || 'https://cosmos.so' });
            }
          });
          return images;
        });
        return results;
      }`,
      maxRequestsPerCrawl: 1,
      maxConcurrency: 1,
    }, { timeout: 90000 });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const cosmosResults = (items.flat() as CosmosResult[]).filter(Boolean);

    // Filter results by query keywords if they have titles
    const queryTerms = query.toLowerCase().split(/\s+/);
    const filteredResults = cosmosResults.filter((item) => {
      if (!item.imageUrl) return false;
      // If no title, include it anyway (we'll show discover content)
      if (!item.title) return true;
      const title = item.title.toLowerCase();
      // Check if any query term appears in the title
      return queryTerms.some(term => title.includes(term));
    });

    // If we have filtered results, use those; otherwise return all discover results
    const finalResults = filteredResults.length > 5 ? filteredResults : cosmosResults.filter(item => item.imageUrl);

    return finalResults
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
    console.error("Cosmos scraping error:", error);
    return [];
  }
}

// Savee.it scraper using Apify web-scraper (handles JavaScript)
export async function scrapeSavee(query: string, limit = 50): Promise<ScrapedImage[]> {
  try {
    const run = await apifyClient.actor("apify/web-scraper").call({
      startUrls: [{ url: `https://savee.it/search/?q=${encodeURIComponent(query)}` }],
      pageFunction: `async function pageFunction(context) {
        const { page, request } = context;
        await page.waitForSelector('img', { timeout: 10000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));
        const results = await page.evaluate(() => {
          const images = [];
          document.querySelectorAll('img').forEach((img) => {
            const src = img.src || img.dataset.src || '';
            const alt = img.alt || '';
            const link = img.closest('a')?.href || '';
            if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo') && img.width > 100) {
              images.push({ imageUrl: src, title: alt, pageUrl: link.startsWith('http') ? link : 'https://savee.it' + link });
            }
          });
          return images;
        });
        return results;
      }`,
      maxRequestsPerCrawl: 1,
      maxConcurrency: 1,
    }, { timeout: 60000 });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const saveeResults = (items.flat() as SaveeResult[]).filter(Boolean);

    return saveeResults
      .filter((item) => item.imageUrl)
      .slice(0, limit)
      .map((item, index) => ({
        id: `savee-${Date.now()}-${index}`,
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

  // Return unsorted - let the API route handle sorting by relevance
  return allImages;
}
