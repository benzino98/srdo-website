export interface Project {
  id: number;
  title: string;
  description: string;
  content?: string;
  status: "ongoing" | "completed";
  start_date: string;
  end_date: string | null;
  location: string;
  budget: number | null;
  created_at: string;
  updated_at: string;
  image_url?: string;
  partners?: Partner[];
  impacts?: Impact[];
  manager?: string;
  beneficiaries?: number;
}

export interface Partner {
  id: number;
  name: string;
  logo_url?: string;
  website_url?: string;
}

export interface Impact {
  id: number;
  title: string;
  description: string;
  value: number;
  unit: string;
}
