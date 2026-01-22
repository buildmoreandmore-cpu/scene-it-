import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy initialization to avoid build-time errors
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  }
  return genAI;
}

export interface SearchIntent {
  refinedQuery: string;
  mood: string[];
  colors: string[];
  style: string[];
  subjects: string[];
  negativeFilters: string[];
}

// Parse natural language search into structured intent
export async function parseSearchIntent(query: string): Promise<SearchIntent> {
  // If no API key, return simple fallback
  if (!process.env.GOOGLE_API_KEY) {
    return {
      refinedQuery: query,
      mood: [],
      colors: [],
      style: [],
      subjects: [query],
      negativeFilters: [],
    };
  }

  try {
    const model = getGenAI().getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const prompt = `You are a visual search intent parser for a creative discovery platform used by art directors, creative directors, and filmmakers.
These professionals search for reference imagery, mood board material, and visual inspiration for projects.
Interpret queries with this creative industry context in mind.
Parse the user's search query and extract structured information.

Return JSON with these fields:
- refinedQuery: optimized search terms for image platforms (focus on the visual subject)
- mood: emotional qualities (e.g., "romantic", "serene", "energetic")
- colors: dominant colors mentioned or implied
- style: visual styles (e.g., "candid", "cinematic", "editorial")
- subjects: main subjects/objects in the image
- negativeFilters: content types to EXCLUDE

IMPORTANT for negativeFilters - ALWAYS include these unless the user explicitly wants them:
- For photos of people/places: ["illustration", "vector", "clip art", "book cover", "magazine", "poster", "graphic design", "logo", "icon", "screenshot", "article", "text", "infographic", "meme", "tweet", "social media post", "news", "blog", "website", "chart", "diagram", "cartoon", "anime", "comic"]
- For art/design: ["stock photo", "amateur", "low quality"]
- Always aggressively filter out text-heavy content, articles, and social media screenshots
- Default to photo/visual content unless user asks for illustrations or graphics

User query: "${query}"`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();
    if (!content) throw new Error("No response");

    return JSON.parse(content);
  } catch (error) {
    console.error("AI parsing error:", error);
    return {
      refinedQuery: query,
      mood: [],
      colors: [],
      style: [],
      subjects: [query],
      negativeFilters: [],
    };
  }
}

// Generate related search suggestions
export async function generateSuggestions(query: string, mood?: string[]): Promise<string[]> {
  // If no API key, return empty suggestions
  if (!process.env.GOOGLE_API_KEY) {
    return [];
  }

  try {
    const model = getGenAI().getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.9,
      },
    });

    const prompt = `Generate 5 related visual search queries for creative professionals (art directors, creative directors, filmmakers).
Think like someone building a mood board or seeking visual reference for a project.
Return JSON with: { "suggestions": ["query1", "query2", ...] }
Make suggestions progressively more specific and creative.

Original: "${query}"${mood?.length ? `\nMood: ${mood.join(", ")}` : ""}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("Suggestions error:", error);
    return [];
  }
}

// Score image relevance to search intent
export function scoreImageRelevance(
  imageText: string,
  intent: SearchIntent
): number {
  const text = imageText.toLowerCase().trim();

  // If image has no/minimal metadata, give it a neutral pass score
  // (trust that the platform's search returned relevant results)
  if (text.length < 5) {
    return 0.5;
  }

  let score = 0.4; // Start slightly below neutral
  let hasPositiveMatch = false;

  // Check refined query words
  const queryWords = intent.refinedQuery.toLowerCase().split(/\s+/);
  for (const word of queryWords) {
    if (word.length > 2 && text.includes(word)) {
      score += 0.15;
      hasPositiveMatch = true;
    }
  }

  // Primary subjects are most important - higher weight
  for (const subject of intent.subjects) {
    const subjectLower = subject.toLowerCase();
    if (text.includes(subjectLower)) {
      score += 0.2;
      hasPositiveMatch = true;
    }
    // Partial match for compound words
    const words = subjectLower.split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && text.includes(word)) {
        score += 0.08;
        hasPositiveMatch = true;
      }
    }
  }

  // Mood keywords
  for (const mood of intent.mood) {
    if (text.includes(mood.toLowerCase())) {
      score += 0.1;
      hasPositiveMatch = true;
    }
  }

  // Style keywords
  for (const style of intent.style) {
    if (text.includes(style.toLowerCase())) {
      score += 0.1;
      hasPositiveMatch = true;
    }
  }

  // Color keywords
  for (const color of intent.colors) {
    if (text.includes(color.toLowerCase())) {
      score += 0.05;
      hasPositiveMatch = true;
    }
  }

  // Penalty for negative filters
  for (const filter of intent.negativeFilters) {
    if (text.includes(filter.toLowerCase())) {
      score -= 0.25;
    }
  }

  // Penalty for common irrelevant terms
  const penaltyTerms = ["article", "blog", "news", "meme", "funny", "lol", "wtf", "omg", "click", "subscribe"];
  for (const term of penaltyTerms) {
    if (text.includes(term)) {
      score -= 0.15;
    }
  }

  // Bonus for photography-related terms
  const photoTerms = ["photo", "photograph", "shot", "portrait", "candid", "capture", "film", "cinema"];
  for (const term of photoTerms) {
    if (text.includes(term)) {
      score += 0.05;
    }
  }

  // If no positive matches but also no negative matches, give benefit of doubt
  // (platform search is trusted)
  if (!hasPositiveMatch && score >= 0.35) {
    score = 0.45;
  }

  return Math.max(0, Math.min(1, score));
}
