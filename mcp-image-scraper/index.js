#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config();

// Credentials from environment
const SAVEE_EMAIL = process.env.SAVEE_EMAIL;
const SAVEE_PASSWORD = process.env.SAVEE_PASSWORD;
const PINTEREST_EMAIL = process.env.PINTEREST_EMAIL;
const PINTEREST_PASSWORD = process.env.PINTEREST_PASSWORD;
const SHOTDECK_EMAIL = process.env.SHOTDECK_EMAIL;
const SHOTDECK_PASSWORD = process.env.SHOTDECK_PASSWORD;

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browser;
}

// Savee scraper
async function searchSavee(query, limit = 30) {
  if (!SAVEE_EMAIL || !SAVEE_PASSWORD) {
    return { error: "Savee credentials not configured" };
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Login
    await page.goto("https://savee.it/login/", { waitUntil: "networkidle2" });
    await page.type('input[name="email"]', SAVEE_EMAIL);
    await page.type('input[name="password"]', SAVEE_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Search
    await page.goto(`https://savee.it/search/?q=${encodeURIComponent(query)}`, {
      waitUntil: "networkidle2",
    });

    // Wait for images and scroll
    await new Promise(r => setTimeout(r, 3000));
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(r => setTimeout(r, 1500));
    }

    // Extract images
    const images = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll("img").forEach((img) => {
        if (img.src && img.src.startsWith("http") && img.width > 100) {
          results.push({
            url: img.src,
            title: img.alt || "",
            sourceUrl: img.closest("a")?.href || "https://savee.it",
          });
        }
      });
      return results;
    });

    await page.close();
    return images.slice(0, limit).map((img, i) => ({
      id: `savee-${Date.now()}-${i}`,
      ...img,
      thumbnailUrl: img.url,
      source: "savee",
    }));
  } catch (error) {
    await page.close();
    return { error: error.message };
  }
}

// Pinterest scraper
async function searchPinterest(query, limit = 30) {
  if (!PINTEREST_EMAIL || !PINTEREST_PASSWORD) {
    return { error: "Pinterest credentials not configured" };
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Login
    await page.goto("https://www.pinterest.com/login/", { waitUntil: "networkidle2" });
    await page.type('input[name="id"]', PINTEREST_EMAIL);
    await page.type('input[name="password"]', PINTEREST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 });

    // Search
    await page.goto(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`, {
      waitUntil: "networkidle2",
    });

    // Wait and scroll
    await new Promise(r => setTimeout(r, 3000));
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(r => setTimeout(r, 1500));
    }

    // Extract images
    const images = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll("img").forEach((img) => {
        const src = img.src || img.dataset.src || "";
        if (src && src.startsWith("http") && src.includes("pinimg") && img.width > 100) {
          results.push({
            url: src,
            title: img.alt || "",
            sourceUrl: img.closest("a")?.href || "https://pinterest.com",
          });
        }
      });
      return results;
    });

    await page.close();
    return images.slice(0, limit).map((img, i) => ({
      id: `pinterest-${Date.now()}-${i}`,
      ...img,
      thumbnailUrl: img.url,
      source: "pinterest",
    }));
  } catch (error) {
    await page.close();
    return { error: error.message };
  }
}

// Shotdeck scraper
async function searchShotdeck(query, limit = 30) {
  if (!SHOTDECK_EMAIL || !SHOTDECK_PASSWORD) {
    return { error: "Shotdeck credentials not configured" };
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Login
    await page.goto("https://shotdeck.com/login", { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', SHOTDECK_EMAIL);
    await page.type('input[type="password"]', SHOTDECK_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 });

    // Search
    await page.goto(`https://shotdeck.com/browse?search=${encodeURIComponent(query)}`, {
      waitUntil: "networkidle2",
    });

    // Wait and scroll
    await new Promise(r => setTimeout(r, 3000));
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(r => setTimeout(r, 1500));
    }

    // Extract images
    const images = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll("img").forEach((img) => {
        const src = img.src || img.dataset.src || "";
        if (src && src.startsWith("http") && img.width > 100) {
          results.push({
            url: src,
            title: img.alt || "",
            sourceUrl: img.closest("a")?.href || "https://shotdeck.com",
          });
        }
      });
      return results;
    });

    await page.close();
    return images.slice(0, limit).map((img, i) => ({
      id: `shotdeck-${Date.now()}-${i}`,
      ...img,
      thumbnailUrl: img.url,
      source: "shotdeck",
    }));
  } catch (error) {
    await page.close();
    return { error: error.message };
  }
}

// Create MCP server
const server = new Server(
  {
    name: "image-scraper",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_savee",
        description: "Search Savee.it for images (requires login)",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            limit: { type: "number", description: "Max results (default 30)" },
          },
          required: ["query"],
        },
      },
      {
        name: "search_pinterest",
        description: "Search Pinterest for images (requires login)",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            limit: { type: "number", description: "Max results (default 30)" },
          },
          required: ["query"],
        },
      },
      {
        name: "search_shotdeck",
        description: "Search Shotdeck for film stills (requires login)",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            limit: { type: "number", description: "Max results (default 30)" },
          },
          required: ["query"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;
    switch (name) {
      case "search_savee":
        result = await searchSavee(args.query, args.limit || 30);
        break;
      case "search_pinterest":
        result = await searchPinterest(args.query, args.limit || 30);
        break;
      case "search_shotdeck":
        result = await searchShotdeck(args.query, args.limit || 30);
        break;
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
    };
  }
});

// Cleanup on exit
process.on("SIGINT", async () => {
  if (browser) await browser.close();
  process.exit(0);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
