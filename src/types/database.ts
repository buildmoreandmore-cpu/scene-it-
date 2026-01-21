export interface Database {
  public: {
    Tables: {
      searches: {
        Row: {
          id: string;
          user_id: string | null;
          query: string;
          refined_query: string | null;
          intent: SearchIntent | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          query: string;
          refined_query?: string | null;
          intent?: SearchIntent | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          query?: string;
          refined_query?: string | null;
          intent?: SearchIntent | null;
          created_at?: string;
        };
      };
      saved_images: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          thumbnail_url: string;
          title: string | null;
          source: string;
          source_url: string;
          collection_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          thumbnail_url: string;
          title?: string | null;
          source: string;
          source_url: string;
          collection_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          thumbnail_url?: string;
          title?: string | null;
          source?: string;
          source_url?: string;
          collection_id?: string | null;
          created_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

export interface SearchIntent {
  refinedQuery: string;
  mood: string[];
  colors: string[];
  style: string[];
  subjects: string[];
  negativeFilters: string[];
}

export interface ScrapedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  source: "pinterest" | "arena" | "cosmos" | "savee" | "shotdeck";
  sourceUrl: string;
  width?: number;
  height?: number;
  author?: string;
  authorUrl?: string;
  tags?: string[];
}
