import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { ScrapedImage } from "@/types";

// Credentials from environment
const SAVEE_EMAIL = process.env.SAVEE_EMAIL;
const PINTEREST_EMAIL = process.env.PINTEREST_EMAIL;
const PINTEREST_PASSWORD = process.env.PINTEREST_PASSWORD;
const SHOTDECK_EMAIL = process.env.SHOTDECK_EMAIL;
const SHOTDECK_PASSWORD = process.env.SHOTDECK_PASSWORD;

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) {
    return browser;
  }

  // Check if running locally (development) or on Vercel (production)
  const isLocal = process.env.NODE_ENV === "development" || !process.env.VERCEL;

  let executablePath: string;
  let args: string[];

  if (isLocal) {
    // For local development, use local Chrome installation
    const localChromePaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ];

    const foundPath = localChromePaths.find((p) => {
      try {
        require("fs").accessSync(p);
        return true;
      } catch {
        return false;
      }
    });

    if (!foundPath) {
      throw new Error("No local Chrome installation found");
    }

    executablePath = foundPath;
    args = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ];
  } else {
    // For Vercel serverless, use @sparticuz/chromium
    executablePath = await chromium.executablePath();
    args = chromium.args;
  }

  browser = await puppeteer.launch({
    args,
    defaultViewport: { width: 1280, height: 720 },
    executablePath,
    headless: true,
  });

  return browser;
}

// Pinterest scraper
export async function scrapePinterestAuth(query: string, limit = 30): Promise<ScrapedImage[]> {
  if (!PINTEREST_EMAIL || !PINTEREST_PASSWORD) {
    console.log("[Pinterest] Credentials not configured");
    return [];
  }

  console.log("[Pinterest] Starting authenticated scrape for:", query);

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Login
    await page.goto("https://www.pinterest.com/login/", { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector('input[name="id"]', { timeout: 10000 });
    await page.type('input[name="id"]', PINTEREST_EMAIL);
    await page.type('input[name="password"]', PINTEREST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});

    // Search
    await page.goto(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait and scroll
    await new Promise((r) => setTimeout(r, 3000));
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Extract images
    const images = await page.evaluate(() => {
      const results: { url: string; title: string; sourceUrl: string }[] = [];
      document.querySelectorAll("img").forEach((img) => {
        const src = img.src || (img as HTMLImageElement).dataset.src || "";
        if (src && src.startsWith("http") && src.includes("pinimg") && img.width > 100) {
          results.push({
            url: src,
            title: img.alt || "",
            sourceUrl: (img.closest("a") as HTMLAnchorElement)?.href || "https://pinterest.com",
          });
        }
      });
      return results;
    });

    await page.close();
    console.log("[Pinterest] Got", images.length, "images");

    return images.slice(0, limit).map((img, i) => ({
      id: `pinterest-${Date.now()}-${i}`,
      url: img.url,
      thumbnailUrl: img.url,
      title: img.title,
      source: "pinterest" as const,
      sourceUrl: img.sourceUrl,
    }));
  } catch (error) {
    console.error("[Pinterest] Error:", error);
    if (page) await page.close().catch(() => {});
    return [];
  }
}

// Savee scraper - uses Google OAuth
export async function scrapeSaveeAuth(query: string, limit = 30): Promise<ScrapedImage[]> {
  if (!SAVEE_EMAIL) {
    console.log("[Savee] Email not configured");
    return [];
  }

  console.log("[Savee] Starting authenticated scrape for:", query);

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Go to login page
    await page.goto("https://savee.it/login/", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Try to find and click Google OAuth button
    const googleButton = await page.$('button[data-provider="google"], a[href*="google"], [class*="google"]');
    if (googleButton) {
      await googleButton.click();
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});

      // Handle Google login if redirected
      const currentUrl = page.url();
      if (currentUrl.includes("accounts.google.com") && PINTEREST_PASSWORD) {
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.type('input[type="email"]', SAVEE_EMAIL);
        await page.keyboard.press("Enter");
        await new Promise((r) => setTimeout(r, 3000));

        const passwordInput = await page.$('input[type="password"]');
        if (passwordInput) {
          await page.type('input[type="password"]', PINTEREST_PASSWORD);
          await page.keyboard.press("Enter");
          await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
        }
      }
    }

    // Search
    await page.goto(`https://savee.it/search/?q=${encodeURIComponent(query)}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait and scroll
    await new Promise((r) => setTimeout(r, 3000));
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Extract images
    const images = await page.evaluate(() => {
      const results: { url: string; title: string; sourceUrl: string }[] = [];
      document.querySelectorAll("img").forEach((img) => {
        if (
          img.src &&
          img.src.startsWith("http") &&
          img.width > 100 &&
          !img.src.includes("avatar") &&
          !img.src.includes("logo")
        ) {
          results.push({
            url: img.src,
            title: img.alt || "",
            sourceUrl: (img.closest("a") as HTMLAnchorElement)?.href || "https://savee.it",
          });
        }
      });
      return results;
    });

    await page.close();
    console.log("[Savee] Got", images.length, "images");

    return images.slice(0, limit).map((img, i) => ({
      id: `savee-${Date.now()}-${i}`,
      url: img.url,
      thumbnailUrl: img.url,
      title: img.title,
      source: "savee" as const,
      sourceUrl: img.sourceUrl,
    }));
  } catch (error) {
    console.error("[Savee] Error:", error);
    if (page) await page.close().catch(() => {});
    return [];
  }
}

// Shotdeck scraper
export async function scrapeShotdeckAuth(query: string, limit = 30): Promise<ScrapedImage[]> {
  if (!SHOTDECK_EMAIL || !SHOTDECK_PASSWORD) {
    console.log("[Shotdeck] Credentials not configured");
    return [];
  }

  console.log("[Shotdeck] Starting authenticated scrape for:", query);

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Login - use the correct URL
    await page.goto("https://shotdeck.com/welcome/login", { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for dynamic form to render
    await new Promise((r) => setTimeout(r, 3000));

    // Try multiple selectors for email input
    const emailSelector = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        const type = input.type?.toLowerCase();
        const placeholder = input.placeholder?.toLowerCase() || '';
        const name = input.name?.toLowerCase() || '';
        if (type === 'email' || placeholder.includes('email') || name.includes('email')) {
          return `input[type="${input.type}"]${input.name ? `[name="${input.name}"]` : ''}`;
        }
      }
      // Fallback to first text/email input
      const firstInput = document.querySelector('input[type="text"], input[type="email"]');
      return firstInput ? 'input[type="text"], input[type="email"]' : null;
    });

    if (!emailSelector) {
      console.log("[Shotdeck] Could not find email input");
      await page.close();
      return [];
    }

    await page.type(emailSelector, SHOTDECK_EMAIL);
    await page.type('input[type="password"]', SHOTDECK_PASSWORD);

    // Click submit button
    const submitButton = await page.$('button[type="submit"], input[type="submit"], button:contains("Submit"), button:contains("Log")');
    if (submitButton) {
      await submitButton.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});

    // Search
    await page.goto(`https://shotdeck.com/browse?search=${encodeURIComponent(query)}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait and scroll
    await new Promise((r) => setTimeout(r, 3000));
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Extract images
    const images = await page.evaluate(() => {
      const results: { url: string; title: string; sourceUrl: string }[] = [];
      document.querySelectorAll("img").forEach((img) => {
        const src = img.src || (img as HTMLImageElement).dataset.src || "";
        if (src && src.startsWith("http") && img.width > 100 && !src.includes("avatar") && !src.includes("logo")) {
          results.push({
            url: src,
            title: img.alt || "",
            sourceUrl: (img.closest("a") as HTMLAnchorElement)?.href || "https://shotdeck.com",
          });
        }
      });
      return results;
    });

    await page.close();
    console.log("[Shotdeck] Got", images.length, "images");

    return images.slice(0, limit).map((img, i) => ({
      id: `shotdeck-${Date.now()}-${i}`,
      url: img.url,
      thumbnailUrl: img.url,
      title: img.title,
      source: "shotdeck" as const,
      sourceUrl: img.sourceUrl,
    }));
  } catch (error) {
    console.error("[Shotdeck] Error:", error);
    if (page) await page.close().catch(() => {});
    return [];
  }
}

// Search all authenticated platforms
export async function searchAuthenticatedPlatforms(
  query: string,
  platforms: ("pinterest" | "savee" | "shotdeck")[] = ["pinterest", "savee", "shotdeck"],
  limitPerPlatform = 15
): Promise<ScrapedImage[]> {
  console.log("[Auth Search] Starting for:", query, "on:", platforms);

  const promises: Promise<ScrapedImage[]>[] = [];

  if (platforms.includes("pinterest")) {
    promises.push(scrapePinterestAuth(query, limitPerPlatform));
  }
  if (platforms.includes("savee")) {
    promises.push(scrapeSaveeAuth(query, limitPerPlatform));
  }
  if (platforms.includes("shotdeck")) {
    promises.push(scrapeShotdeckAuth(query, limitPerPlatform));
  }

  const results = await Promise.all(promises);
  const allImages = results.flat();

  console.log("[Auth Search] Total images:", allImages.length);
  return allImages;
}
