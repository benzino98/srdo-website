export interface Resource {
  id: number;
  title: string;
  category: string;
  description: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url?: string;
  is_published: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}
