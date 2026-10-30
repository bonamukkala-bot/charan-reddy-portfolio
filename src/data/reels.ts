export interface ReelItem {
  title: string;
  url: string;
  thumbnail: string;
  topic?: string;
  language?: string;
}

// Add real verified reel URLs and thumbnails here when published.
// If this array is empty, the reel row is automatically hidden from the site.
export const reelsData: ReelItem[] = [];
