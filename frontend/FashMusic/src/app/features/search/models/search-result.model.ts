export interface SongResult {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  duration_formatted: string;
  url: string;
  thumbnail: string | null;
  genre?: string;
}

export interface SearchResponse {
  results: SongResult[];
  total: number;
  query: string;
  cached: boolean;
  isDemo?: boolean;
}
