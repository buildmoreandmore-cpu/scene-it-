export interface FilterOption {
  id: string;
  label: string;
  color?: string;
}

export interface UserFilters {
  mood: string[];
  colors: string[];
  style: string[];
  negativeFilters: string[];
}
