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

    const prompt = `You are a visual search intent parser for a creative discovery platform.
Extract structured information from natural language image searches.

Return JSON with:
- refinedQuery: optimized search terms for image platforms
- mood: emotional qualities (e.g., "serene", "energetic", "melancholic")
- colors: dominant colors mentioned or implied
- style: visual styles (e.g., "minimalist", "vintage", "brutalist")
- subjects: main subjects/objects
- negativeFilters: things to exclude

Be creative in expanding vague descriptions into searchable terms.

User query: ${query}`;

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
  imageDescription: string,
  intent: SearchIntent
): number {
  // Simple keyword matching for speed
  const allKeywords = [
    ...intent.mood,
    ...intent.colors,
    ...intent.style,
    ...intent.subjects,
  ].map((k) => k.toLowerCase());

  const description = imageDescription.toLowerCase();
  let score = 0;

  for (const keyword of allKeywords) {
    if (description.includes(keyword)) {
      score += 1;
    }
  }

  // Penalty for negative filters
  for (const filter of intent.negativeFilters) {
    if (description.includes(filter.toLowerCase())) {
      score -= 2;
    }
  }

  return Math.max(0, Math.min(1, score / Math.max(allKeywords.length, 1)));
}
