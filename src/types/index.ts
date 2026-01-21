export * from "./database";
export * from "./filters";

export interface SearchState {
  query: string;
  isLoading: boolean;
  images: import("./database").ScrapedImage[];
  intent: import("./database").SearchIntent | null;
  suggestions: string[];
  error: string | null;
}

export interface FilterState {
  sources: ("pinterest" | "arena" | "cosmos" | "savee")[];
  colors: string[];
  mood: string[];
}
