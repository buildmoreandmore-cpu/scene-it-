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

    const prompt = `You are a visual search intent parser for a creative image discovery platform.
Parse the user's search query and extract structured information.

Return JSON with these fields:
- refinedQuery: optimized search terms for image platforms (focus on the visual subject)
- mood: emotional qualities (e.g., "romantic", "serene", "energetic")
- colors: dominant colors mentioned or implied
- style: visual styles (e.g., "candid", "cinematic", "editorial")
- subjects: main subjects/objects in the image
- negativeFilters: content types to EXCLUDE

IMPORTANT for negativeFilters:
- If searching for real photos of people/places, add: ["illustration", "vector", "clip art", "book cover", "magazine", "poster", "graphic design", "logo", "icon", "screenshot"]
- If searching for art/design, add: ["stock photo", "amateur"]
- Always consider what the user does NOT want to see

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

    const prompt = `Generate 5 related visual search queries for a creative discovery platform.
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
  const text = imageText.toLowerCase();
  let score = 0.5; // Start with neutral score

  // Positive scoring: keywords from intent
  const allKeywords = [
    ...intent.subjects,
    ...intent.mood,
    ...intent.style,
  ].map((k) => k.toLowerCase());

  for (const keyword of allKeywords) {
    if (text.includes(keyword)) {
      score += 0.1;
    }
  }

  // Penalty for AI-specified negative filters only
  for (const filter of intent.negativeFilters) {
    if (text.includes(filter.toLowerCase())) {
      score -= 0.2;
    }
  }

  return Math.max(0, Math.min(1, score));
}
