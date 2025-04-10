export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  image_url?: string;
  is_published: boolean;
  published_at?: string;
  author?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface NewsResponse {
  data: NewsArticle[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}
