import { FilterOption } from "@/types/filters";

export const moodOptions: FilterOption[] = [
  { id: "romantic", label: "Romantic" },
  { id: "serene", label: "Serene" },
  { id: "energetic", label: "Energetic" },
  { id: "moody", label: "Moody" },
  { id: "dramatic", label: "Dramatic" },
  { id: "playful", label: "Playful" },
  { id: "melancholic", label: "Melancholic" },
  { id: "nostalgic", label: "Nostalgic" },
  { id: "ethereal", label: "Ethereal" },
  { id: "bold", label: "Bold" },
];

export const colorOptions: FilterOption[] = [
  { id: "warm", label: "Warm Tones", color: "#E07A5F" },
  { id: "cool", label: "Cool Tones", color: "#457B9D" },
  { id: "neutral", label: "Neutral", color: "#9A8C7E" },
  { id: "monochrome", label: "Monochrome", color: "#2D2D2D" },
  { id: "pastel", label: "Pastel", color: "#DDA0DD" },
  { id: "vibrant", label: "Vibrant", color: "#FF6B6B" },
  { id: "earth", label: "Earth Tones", color: "#8B7355" },
  { id: "muted", label: "Muted", color: "#A9A9A9" },
  { id: "high-contrast", label: "High Contrast", color: "#000000" },
  { id: "desaturated", label: "Desaturated", color: "#B8B8B8" },
];

export const styleOptions: FilterOption[] = [
  { id: "cinematic", label: "Cinematic" },
  { id: "editorial", label: "Editorial" },
  { id: "candid", label: "Candid" },
  { id: "minimalist", label: "Minimalist" },
  { id: "vintage", label: "Vintage" },
  { id: "film", label: "Film/Analog" },
  { id: "documentary", label: "Documentary" },
  { id: "fashion", label: "Fashion" },
  { id: "fine-art", label: "Fine Art" },
  { id: "street", label: "Street" },
  { id: "architectural", label: "Architectural" },
  { id: "abstract", label: "Abstract" },
];

export const exclusionOptions: FilterOption[] = [
  { id: "illustration", label: "Illustrations" },
  { id: "vector", label: "Vectors" },
  { id: "stock-photo", label: "Stock Photos" },
  { id: "clip-art", label: "Clip Art" },
  { id: "3d-render", label: "3D Renders" },
  { id: "ai-generated", label: "AI Generated" },
  { id: "screenshot", label: "Screenshots" },
  { id: "logo", label: "Logos" },
  { id: "text-heavy", label: "Text-Heavy" },
  { id: "low-quality", label: "Low Quality" },
];
